import InfoOutlined from '@mui/icons-material/InfoOutlined'; import {loadHostConfig} from '../services/hostRuntimeConfig'; import {loadOpenmaicConfig} from '../services/openmaicRuntimeConfig'; import {loadAiConfig} from '../services/aiRuntimeConfig'; import {useRuntimeConfigVersion} from '../app/AppProviders';
/* 模式横幅：由运行时开关实时驱动（与能力边界卡片同纪律——状态文案不许硬编码）。
   订阅配置变化通知：开关切换后横幅立即重读 localStorage 联动。
   模式名按实际链路如实显示：AI 开启=「本机自主模式」（真实 LLM 内容+本地确定性判定）；
   AI 关闭=「本地受控演示」（纯本地内容）。
   权威语义不变：schedulerAuthority 恒为 kernel-10 契约、未命中正式路由；
   宿主/OpenMAIC 为本地 BFF 增强，启用与否只改变"哪些增强在生效"，不改变候选-only 边界。 */
export function ModeBanner():JSX.Element{
  useRuntimeConfigVersion();
  const aiOn=loadAiConfig().enabled;
  const hostOn=loadHostConfig().enabled;
  const omcOn=loadOpenmaicConfig().enabled;
  const enhancements=[
    hostOn?'宿主登记（本地 BFF）':null,
    omcOn?'OpenMAIC 互动课堂（本地运行时）':null,
  ].filter(Boolean);
  const enhancementText=enhancements.length?`已启用增强：${enhancements.join('、')}。`:'';
  return<div className="mode-banner" role="status"><InfoOutlined fontSize="small"/><strong>{aiOn?'本机自主模式':'本地受控演示'}</strong><span>所有结果为候选（proposal-only），登记与调度权威仍为 kernel-10 契约、未命中正式路由；{enhancementText}宿主未连接正式云端，登记走本机服务。</span></div>;
}
