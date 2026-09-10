/**
 * AI 接入运行时配置（localStorage 持久化，UI 可改，构建期 env 只作默认值）。
 *
 * 设计：
 * - 默认值来自构建期 env（VITE_AI_MODE / VITE_AI_PROXY_PORT），与旧行为兼容；
 * - 用户在「本地数据」页修改后写入 localStorage，立即生效，无需重新构建；
 * - port 只接受 2-5 位数字，非法输入回退默认值；
 * - 与批注存储同前缀约定（paper-desk.*），全局配置不区分学习者（AI 开关是家庭级设置）。
 */

export interface AiRuntimeConfig{
  /** 是否启用 AI 增强（讲解/批改反馈）；关闭时混合适配器行为与 LocalDemo 完全一致 */
  enabled:boolean;
  /** 本机 AI 代理监听端口（代理默认 4610） */
  port:string;
}

const STORAGE_KEY='paper-desk.ai-config';

const defaultConfig=():AiRuntimeConfig=>({
  enabled:import.meta.env.VITE_AI_MODE==='ai',
  port:import.meta.env.VITE_AI_PROXY_PORT??'4610',
});

const normalize=(raw:Partial<AiRuntimeConfig>|null):AiRuntimeConfig=>{
  const base=defaultConfig();
  if(!raw)return base;
  return{
    enabled:typeof raw.enabled==='boolean'?raw.enabled:base.enabled,
    port:typeof raw.port==='string'&&/^\d{2,5}$/.test(raw.port)?raw.port:base.port,
  };
};

export function loadAiConfig():AiRuntimeConfig{
  try{
    const raw=localStorage.getItem(STORAGE_KEY);
    return normalize(raw?(JSON.parse(raw) as Partial<AiRuntimeConfig>):null);
  }catch{return defaultConfig();}
}

/* 供应商预设（借鉴 Project013 设置页）：选择后自动填接口地址与推荐模型，免手输 URL */
export interface AiProviderPreset{id:string;label:string;apiBase:string;model:string;}
export const AI_PROVIDER_PRESETS:AiProviderPreset[]=[
  {id:'glm',label:'智谱 GLM',apiBase:'https://open.bigmodel.cn/api/paas/v4/chat/completions',model:'glm-4-flash'},
  {id:'deepseek',label:'DeepSeek',apiBase:'https://api.deepseek.com/v1/chat/completions',model:'deepseek-chat'},
  {id:'qwen',label:'通义千问',apiBase:'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',model:'qwen-turbo'},
  {id:'moonshot',label:'Moonshot Kimi',apiBase:'https://api.moonshot.cn/v1/chat/completions',model:'moonshot-v1-8k'},
  {id:'custom',label:'自定义兼容服务',apiBase:'',model:''},
];

/* 密钥浏览器侧仅存会话内存（刷新即失）；代理侧才是持久层 */
const SESSION_KEY_KEY='ai-proxy-key-session';
export function stashSessionKey(apiKey:string):void{try{sessionStorage.setItem(SESSION_KEY_KEY,apiKey);}catch{/* ignore */}}
export function peekSessionKey():string{try{return sessionStorage.getItem(SESSION_KEY_KEY)??'';}catch{return '';}}

/** 部分更新并持久化，返回归一化后的完整配置（UI 直接采用返回值渲染）。 */
export function saveAiConfig(patch:Partial<AiRuntimeConfig>):AiRuntimeConfig{
  const next=normalize({...loadAiConfig(),...patch});
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(next));}catch{/* 隐私模式/配额不可用时仅内存生效 */}
  return next;
}

export interface AiProxyProbeResult{
  online:boolean;
  /** 代理是否已配置密钥（AI_PROXY_API_KEY） */
  configured:boolean;
  model:string;
  error?:string;
  /** 上游探活（可选，较慢）：真实调用一次上游确认密钥/地址/模型可用 */
  upstream?:'ok'|'failed'|'untested';
  upstreamDetail?:string;
}

/** 探活 /health：短超时；在线时返回密钥配置状态与模型名（供设置面板展示）。 */
export async function probeAiProxy(port:string,timeoutMs=2500):Promise<AiProxyProbeResult>{
  try{
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),timeoutMs);
    const response=await fetch(`http://127.0.0.1:${port}/health`,{signal:controller.signal});
    clearTimeout(timer);
    if(!response.ok)return{online:false,configured:false,model:'',error:`HTTP ${response.status}`};
    const body=(await response.json()) as {configured?:boolean;model?:string};
    return{online:true,configured:Boolean(body.configured),model:body.model??''};
  }catch{
    return{online:false,configured:false,model:'',error:'无法连接（代理未启动或端口不正确）'};
  }
}

/**
 * 上游探活：真实调用一次代理 /probe（代理向上游发最小请求）。
 * 「检测连接」在线+已配密钥时建议再点此项——能提前暴露密钥错误/地址不对/模型名不存在。
 */
export async function probeAiUpstream(port:string,timeoutMs=30000):Promise<{ok:boolean;detail?:string}>{
  try{
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),timeoutMs);
    const response=await fetch(`http://127.0.0.1:${port}/probe`,{method:'POST',headers:{'content-type':'application/json'},body:'{}',signal:controller.signal});
    clearTimeout(timer);
    const body=(await response.json()) as {ok:boolean;error?:string;detail?:string;model?:string};
    if(!response.ok||!body.ok)return{ok:false,detail:body.detail??body.error??`HTTP ${response.status}`};
    return{ok:true};
  }catch{
    return{ok:false,detail:'探活请求失败（超时或代理不可达）'};
  }
}

/** 代理侧配置（/config 读取）：密钥只回传是否存在与末 4 位掩码，不回传原文。 */
export interface AiProxyConfigView{
  hasKey:boolean;
  keyHint:string;
  apiBase:string;
  model:string;
  configFile:string;
}

export async function fetchProxyConfig(port:string,timeoutMs=2500):Promise<AiProxyConfigView|null>{
  try{
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),timeoutMs);
    const response=await fetch(`http://127.0.0.1:${port}/config`,{signal:controller.signal});
    clearTimeout(timer);
    if(!response.ok)return null;
    return(await response.json()) as AiProxyConfigView;
  }catch{return null;}
}

export interface SaveProxyConfigInput{
  /** 留空表示不修改已保存的密钥 */
  apiKey?:string;
  apiBase?:string;
  model?:string;
}

export interface SaveProxyConfigResult{
  ok:boolean;
  error?:string;
  view?:AiProxyConfigView;
}

/** 保存代理参数到本机配置文件（~/.ai-proxy/config.json，0600）；浏览器不持久保存密钥。 */
export async function saveProxyConfig(port:string,input:SaveProxyConfigInput):Promise<SaveProxyConfigResult>{
  try{
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),5000);
    const response=await fetch(`http://127.0.0.1:${port}/config`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(input),signal:controller.signal});
    clearTimeout(timer);
    const body=(await response.json()) as {ok:boolean;error?:string;hasKey?:boolean;keyHint?:string;apiBase?:string;model?:string;configFile?:string};
    if(!response.ok||!body.ok)return{ok:false,error:body.error??`HTTP ${response.status}`};
    return{ok:true,view:{hasKey:Boolean(body.hasKey),keyHint:body.keyHint??'',apiBase:body.apiBase??'',model:body.model??'',configFile:body.configFile??''}};
  }catch{
    return{ok:false,error:'无法连接代理（保存失败，请确认代理已启动且端口正确）'};
  }
}
