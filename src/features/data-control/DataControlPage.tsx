import './data.css';import {Button,Dialog,DialogActions,DialogContent,DialogTitle,FormControlLabel,Switch,TextField} from '@mui/material';import DownloadOutlined from '@mui/icons-material/DownloadOutlined';import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined';import LogoutOutlined from '@mui/icons-material/LogoutOutlined';import {useCallback,useState} from 'react';import {useNavigate} from 'react-router-dom';import {useLearningSession} from '../../state/LearningSessionProvider';import {DataControlService} from '../../services/DataControlService';import {listPdfProgressEntries,removePdfProgressEntry,type PdfProgressEntry} from '../../services/pdfProgressStore';import {clearLocalRecords,loadLocalRecords,type LocalRecordEntry} from '../../services/localRecordStore';import {loadAiConfig,saveAiConfig,probeAiProxy,probeAiUpstream,fetchProxyConfig,saveProxyConfig,stashSessionKey,peekSessionKey,AI_PROVIDER_PRESETS,type AiProxyProbeResult,type AiProxyConfigView} from '../../services/aiRuntimeConfig';
import {loadHostConfig,saveHostConfig,probeHostBff,type HostProbeResult} from '../../services/hostRuntimeConfig';
import {notifyHostConfigChanged,notifyOpenmaicConfigChanged} from '../../app/AppProviders';
import {loadOpenmaicConfig,saveOpenmaicConfig,probeOpenmaicBff} from '../../services/openmaicRuntimeConfig';import {LearnerSwitcher} from '../onboarding/LearnerSwitcher';
const formatSavedAt=(savedAt:number):string=>savedAt>0?new Date(savedAt).toLocaleString('zh-CN',{hour12:false}):'未知时间';
type ProbeState={checking:boolean;result:AiProxyProbeResult|null};
type ProxyForm={apiKey:string;apiBase:string;model:string};
function AiSettingsPanel():JSX.Element{
  const[config,setConfig]=useState(loadAiConfig);
  const[probe,setProbe]=useState<ProbeState>({checking:false,result:null});
  const[upstream,setUpstream]=useState<{testing:boolean;ok:boolean|null;detail:string}>({testing:false,ok:null,detail:''});
  const[view,setView]=useState<AiProxyConfigView|null>(null);
  const[form,setForm]=useState<ProxyForm>({apiKey:'',apiBase:'',model:''});
  const[formMsg,setFormMsg]=useState('');
  const[saving,setSaving]=useState(false);
  const toggle=(enabled:boolean):void=>{setConfig(saveAiConfig({enabled}));notifyHostConfigChanged();};
  const changePort=(port:string):void=>{setConfig(saveAiConfig({port}));setProbe({checking:false,result:null});setView(null);setFormMsg('');};
  const loadProxyConfig=async():Promise<void>=>{const v=await fetchProxyConfig(config.port);setView(v);if(v){setForm({apiKey:peekSessionKey(),apiBase:v.apiBase,model:v.model});setFormMsg(v.hasKey?`代理已配密钥（${v.keyHint}），留空即保持不变`:'代理尚未配置密钥');}else setFormMsg('读取代理配置失败（未启动或端口不正确）');};
  const check=async():Promise<void>=>{
    setProbe({checking:true,result:null});
    const result=await probeAiProxy(config.port);
    setProbe({checking:false,result});
    setUpstream({testing:false,ok:null,detail:''});
    if(result.online)await loadProxyConfig();
  };
  const testUpstream=async():Promise<void>=>{
    setUpstream({testing:true,ok:null,detail:''});
    const result=await probeAiUpstream(config.port);
    setUpstream({testing:false,ok:result.ok,detail:result.detail??''});
  };
  const saveProxy=async():Promise<void>=>{
    setSaving(true);setFormMsg('');
    const apiKey=form.apiKey.trim();
    const result=await saveProxyConfig(config.port,{apiKey:apiKey||undefined,apiBase:form.apiBase.trim()||undefined,model:form.model.trim()||undefined});
    setSaving(false);
    if(result.ok&&result.view){
      setView(result.view);
      if(apiKey)stashSessionKey(apiKey);
      setForm((current)=>({...current,apiKey:'',apiBase:result.view?.apiBase??current.apiBase,model:result.view?.model??current.model}));
      const probe=await probeAiProxy(config.port);
      setProbe({checking:false,result:probe});
      setFormMsg(`已保存到本机 ${result.view.configFile}${apiKey?'（密钥浏览器不留存）':''}`);
    }else setFormMsg(result.error??'保存失败');
  };
  const statusText=():string=>{
    if(!probe.result)return'未检测';
    if(!probe.result.online)return`离线 · ${probe.result.error??'无法连接'}`;
    return probe.result.configured?`在线 · 已配密钥 · 模型 ${probe.result.model}`:'在线 · 未配置密钥（会降级为本地演示）';
  };
  return<article><h2>AI 接入设置</h2>
  <p>启用后，讲解文案与批改反馈尝试由本机 AI 代理增强（密钥只存在本机代理，浏览器不持有）；代理不可用时自动降级为本地演示。对错判定始终由本地答案比对完成，AI 不改判。</p>
  <FormControlLabel control={<Switch checked={config.enabled} onChange={(e)=>toggle(e.target.checked)} inputProps={{'aria-label':'启用 AI 增强'}}/>} label={config.enabled?'AI 增强：已启用':'AI 增强：已关闭'}/>
  <div className="ai-config-row"><TextField size="small" label="代理端口" value={config.port} onChange={(e)=>changePort(e.target.value.replace(/\D/g,'').slice(0,5))} inputProps={{inputMode:'numeric','aria-label':'AI 代理端口'}} sx={{width:120}}/><Button variant="outlined" onClick={()=>void check()} disabled={probe.checking}>{probe.checking?'检测中…':'检测连接'}</Button>{probe.result?.online===true&&probe.result.configured&&<Button variant="outlined" onClick={()=>void testUpstream()} disabled={upstream.testing}>{upstream.testing?'测试中…（最长 30 秒）':'测试上游'}</Button>}</div>
  <p role="status" className={probe.result?.online?(probe.result.configured?'ai-config-ok':'ai-config-warn'):'ai-config-status'}>{statusText()}</p>
  {upstream.ok===true&&<p role="status" className="ai-config-ok">上游可用：密钥、接口地址、模型均有效。生成内容将带「AI 生成候选」标识。</p>}
  {upstream.ok===false&&<p role="status" className="ai-config-error">上游不可用：{upstream.detail}。此时讲解/批改会自动降级为本地演示（无 AI 标识）。</p>}
  <details className="ai-proxy-fields" open={Boolean(view)}>
    <summary>API 密钥 / 接口地址 / 模型（可选，保存到本机代理）</summary>
    {view&&<p className="ai-config-status">当前：{view.hasKey?`密钥 ${view.keyHint}`:'未配密钥'} · 模型 {view.model} · 配置文件 {view.configFile}</p>}
    <div className="ai-config-row"><label className="ai-preset-label" htmlFor="ai-provider-preset">供应商预设</label><select id="ai-provider-preset" className="ai-preset-select" defaultValue="" onChange={(e)=>{const preset=AI_PROVIDER_PRESETS.find((p)=>p.id===e.target.value);if(preset&&preset.id!=='custom')setForm((c)=>({...c,apiBase:preset.apiBase,model:preset.model}));}}><option value="" disabled>选择后自动填地址与模型</option>{AI_PROVIDER_PRESETS.map((p)=><option key={p.id} value={p.id}>{p.label}</option>)}</select></div>
    <TextField size="small" fullWidth label="API 密钥（留空=不修改已保存的密钥）" type="password" autoComplete="off" value={form.apiKey} onChange={(e)=>setForm((c)=>({...c,apiKey:e.target.value}))} inputProps={{'aria-label':'API 密钥'}}/>
    <TextField size="small" fullWidth label="API 接口地址（OpenAI 兼容 chat/completions）" value={form.apiBase} onChange={(e)=>setForm((c)=>({...c,apiBase:e.target.value}))} inputProps={{'aria-label':'API 接口地址'}}/>
    <TextField size="small" fullWidth label="模型名（如 glm-4-flash / deepseek-chat）" value={form.model} onChange={(e)=>setForm((c)=>({...c,model:e.target.value}))} inputProps={{'aria-label':'模型名'}}/>
    <div className="ai-config-row"><Button variant="contained" onClick={()=>void saveProxy()} disabled={saving||!view}>{saving?'保存中…':'保存到本机代理'}</Button><span className="ai-config-status">{formMsg}</span></div>
    <p className="ai-config-status">密钥只写入本机 ~/.ai-proxy/config.json（权限 0600），浏览器不持久保存；刷新页面后密钥输入框为空属正常。</p>
  </details>
  <p className="ai-config-status">AI 生成内容带「AI 生成候选」徽章与蓝紫色说明条；建议家长抽查复核。</p>
  </article>;
}
function HostSettingsPanel():JSX.Element{
  const[config,setConfig]=useState(loadHostConfig);
  const[probe,setProbe]=useState<{checking:boolean;result:HostProbeResult|null}>({checking:false,result:null});
  const toggle=(enabled:boolean):void=>{const next=saveHostConfig({enabled});setConfig(next);notifyHostConfigChanged();setProbe({checking:false,result:null});};
  const changePort=(port:string):void=>{const next=saveHostConfig({port});setConfig(next);setProbe({checking:false,result:null});};
  const check=async():Promise<void>=>{
    setProbe({checking:true,result:null});
    const result=await probeHostBff(config.port);
    setProbe({checking:false,result});
  };
  const statusText=():string=>{
    if(!probe.result)return'未检测';
    if(!probe.result.online)return`离线 · ${probe.result.error??'无法连接'}（提交按钮会提示宿主不可用）`;
    return`在线 · 本机登记册已有 ${probe.result.registrations??0} 条登记`;
  };
  return<article><h2>宿主登记连接（组件 24 · 本地 BFF）</h2>
  <p>启用后，收单页出现「提交到宿主登记」按钮：登记 proposal 经校验后写入本机登记册（~/.host-bff/registry.json）并返回正式回执。未启用或服务离线时保持候选态，不提交。需先在本机启动服务：<code>node scripts/host-bff.mjs --port {config.port}</code></p>
  <FormControlLabel control={<Switch checked={config.enabled} onChange={(e)=>toggle(e.target.checked)} inputProps={{'aria-label':'启用宿主登记'}}/>} label={config.enabled?'宿主登记：已启用':'宿主登记：未启用（候选不提交）'}/>
  <div className="ai-config-row"><TextField size="small" label="宿主端口" value={config.port} onChange={(e)=>changePort(e.target.value.replace(/\D/g,'').slice(0,5))} inputProps={{inputMode:'numeric','aria-label':'宿主服务端口'}} sx={{width:120}}/><Button variant="outlined" onClick={()=>void check()} disabled={probe.checking}>{probe.checking?'检测中…':'检测连接'}</Button></div>
  <p role="status" className={probe.result?.online?'ai-config-ok':'ai-config-status'}>{statusText()}</p>
  <p className="ai-config-status">登记是 proposal-only 语义的本机落地：只登记候选内容（错题/证据/下一课建议），不写任何权威掌握度；登记册可用「导出本地候选 JSON」一并带走。</p>
  </article>;
}

function OpenmaicSettingsPanel():JSX.Element{
  const[config,setConfig]=useState(loadOpenmaicConfig);
  const[probe,setProbe]=useState<{checking:boolean;result:{online:boolean;sessions?:number;error?:string}|null}>({checking:false,result:null});
  const toggle=(enabled:boolean):void=>{const next=saveOpenmaicConfig({enabled});setConfig(next);notifyOpenmaicConfigChanged();setProbe({checking:false,result:null});};
  const changePort=(port:string):void=>{const next=saveOpenmaicConfig({port});setConfig(next);setProbe({checking:false,result:null});};
  const check=async():Promise<void>=>{
    setProbe({checking:true,result:null});
    const result=await probeOpenmaicBff(config.port);
    setProbe({checking:false,result});
  };
  const statusText=():string=>{
    if(!probe.result)return'未检测';
    if(!probe.result.online)return`离线 · ${probe.result.error??'无法连接'}（生成讲解时自动降级为 AI/本地模式）`;
    return`在线 · 课件会话 ${probe.result.sessions??0} 个`;
  };
  return<article><h2>OpenMAIC 互动课堂（组件 37 · 本地运行时）</h2>
  <p>启用后，生成微课堂改由课件会话驱动（看一看/试一试/说一说三步互动），互动记录经 callback 回传本机运行时；掌握度与下一课仍由本地判定链生成，互动仅作学习证据候选。需先启动：<code>node scripts/openmaic-bff.mjs --port {config.port}</code></p>
  <FormControlLabel control={<Switch checked={config.enabled} onChange={(e)=>toggle(e.target.checked)} inputProps={{'aria-label':'启用 OpenMAIC 互动课堂'}}/>} label={config.enabled?'互动课堂：已启用':'互动课堂：未启用（AI/本地微课堂）'}/>
  <div className="ai-config-row"><TextField size="small" label="运行时端口" value={config.port} onChange={(e)=>changePort(e.target.value.replace(/\D/g,'').slice(0,5))} inputProps={{inputMode:'numeric','aria-label':'OpenMAIC 端口'}} sx={{width:120}}/><Button variant="outlined" onClick={()=>void check()} disabled={probe.checking}>{probe.checking?'检测中…':'检测连接'}</Button></div>
  <p role="status" className={probe.result?.online?'ai-config-ok':'ai-config-status'}>{statusText()}</p>
  <p className="ai-config-status">互动课堂不改变判定：Quiz 对错、掌握度、下一课建议仍由本地确定性链生成并走原提交链。</p>
  </article>;
}

function LearningRecordManager():JSX.Element{const{state}=useLearningSession();const learnerId=state.identity.learnerId;const[records,setRecords]=useState<LocalRecordEntry[]>(()=>loadLocalRecords(learnerId));const[confirmClear,setConfirmClear]=useState(false);const refresh=()=>setRecords(loadLocalRecords(learnerId));return<article><h2>本地学习记录（本机）</h2><p>历次学习的错题、掌握度候选与下一步建议，跨会话累积；只存本机，不是正式登记回执。</p>{records.length===0?<p className="annotation-empty">当前没有学习记录。</p>:<table className="annotation-table"><caption className="visually-hidden">本地学习记录列表</caption><thead><tr><th scope="col">时间</th><th scope="col">课程</th><th scope="col">错题数</th><th scope="col">掌握度候选</th></tr></thead><tbody>{records.slice().reverse().map((record)=><tr key={record.recordId}><td data-label="时间">{new Date(record.createdAt).toLocaleString('zh-CN',{hour12:false})}</td><td data-label="课程">{record.lessonTitle||record.textbookTitle}</td><td data-label="错题数">{record.wrongQuestions.length}</td><td data-label="掌握度候选">{record.mastery||'暂无法判断'}</td></tr>)}</tbody></table>}{records.length>0&&<Button size="small" color="secondary" onClick={()=>setConfirmClear(true)}>清空全部学习记录</Button>}{confirmClear&&<Dialog open onClose={()=>setConfirmClear(false)}><DialogTitle>清空学习者 {learnerId} 的全部本地学习记录？</DialogTitle><DialogContent>将删除本机保存的历次错题与学习摘要；此操作不可撤销。</DialogContent><DialogActions><Button onClick={()=>setConfirmClear(false)}>取消</Button><Button color="secondary" onClick={()=>{clearLocalRecords(learnerId);refresh();setConfirmClear(false);}}>确认清空</Button></DialogActions></Dialog>}</article>}
function AnnotationStoreManager():JSX.Element{const{state}=useLearningSession();const learnerId=state.identity.learnerId;const[entries,setEntries]=useState<PdfProgressEntry[]>(()=>listPdfProgressEntries(learnerId));const[pendingDelete,setPendingDelete]=useState<PdfProgressEntry|null>(null);const refresh=useCallback(()=>setEntries(listPdfProgressEntries(learnerId)),[learnerId]);const removeOne=(entry:PdfProgressEntry):void=>{removePdfProgressEntry(learnerId,entry.fileKey);refresh();setPendingDelete(null);};return<article><h2>PDF 批注存储（本机）</h2><p>保存书签、划线与阅读进度的本机记录；不含 PDF 文件内容。按学习者隔离，退出会话或切换学习者时全部清除。</p>{entries.length===0?<p className="annotation-empty">当前没有批注存储记录。</p>:<table className="annotation-table"><caption className="visually-hidden">PDF 批注存储列表</caption><thead><tr><th scope="col">文件</th><th scope="col">批注数</th><th scope="col">最后保存</th><th scope="col">操作</th></tr></thead><tbody>{entries.map((entry)=><tr key={entry.fileKey}><td data-label="文件">{entry.fileName}</td><td data-label="批注数">{entry.itemCount}</td><td data-label="最后保存">{formatSavedAt(entry.savedAt)}</td><td data-label="操作"><Button size="small" color="secondary" onClick={()=>setPendingDelete(entry)}>删除</Button></td></tr>)}</tbody></table>}{pendingDelete&&<Dialog open onClose={()=>setPendingDelete(null)}><DialogTitle>删除「{pendingDelete.fileName}」的本机批注？</DialogTitle><DialogContent>将删除这本书的全部书签、划线和阅读进度记录；PDF 文件本身不受影响。此操作不可撤销。</DialogContent><DialogActions><Button onClick={()=>setPendingDelete(null)}>取消</Button><Button color="secondary" onClick={()=>removeOne(pendingDelete)}>确认删除</Button></DialogActions></Dialog>}</article>}
export function DataControlPage():JSX.Element{const session=useLearningSession();const[confirm,setConfirm]=useState(false);const[deleted,setDeleted]=useState(false);const navigate=useNavigate();const service=new DataControlService();const remove=async():Promise<void>=>{await session.exit();setConfirm(false);setDeleted(!session.documents.isOpen()&&sessionStorage.length===0);};return<section className="page data-control"><p className="eyebrow">我的 / 监护人 · 当前标签页</p><h1>数据控制权<br/>留在家庭手里。</h1><LearnerSwitcher/><AiSettingsPanel/><HostSettingsPanel/><OpenmaicSettingsPanel/><LearningRecordManager/><AnnotationStoreManager/><article><h2>导出当前学习者候选</h2><p>导出包含学习者 ID、复述、作答、批改、错题和下一课候选；不含 PDF 字节、全文或真实姓名。</p><Button startIcon={<DownloadOutlined/>} disabled={!session.state.lesson} onClick={()=>service.download(session.state)}>下载本地候选 JSON</Button></article><article><h2>删除本地会话数据</h2><p>将清空当前 reducer、sessionStorage、本地 PDF、选区和朗读。</p><Button color="secondary" startIcon={<DeleteOutlineOutlined/>} onClick={()=>setConfirm(true)}>检查并删除</Button>{deleted&&<p role="status">本地会话数据已删除；未执行或声称任何云端删除。</p>}</article><article><h2>退出学习会话</h2><Button startIcon={<LogoutOutlined/>} onClick={()=>void session.exit().then(()=>navigate('/'))}>停止朗读、销毁文档并退出</Button></article><Dialog open={confirm} onClose={()=>setConfirm(false)}><DialogTitle>确认删除学习者 {session.state.identity.learnerId} 的本地数据？</DialogTitle><DialogContent>此操作只处理当前浏览器标签页的数据和内存中的 PDF。</DialogContent><DialogActions><Button onClick={()=>setConfirm(false)}>取消</Button><Button color="secondary" onClick={()=>void remove()}>确认删除</Button></DialogActions></Dialog></section>}
