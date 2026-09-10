import LockOutlined from '@mui/icons-material/LockOutlined'; import {capabilityManifest,getCapabilityState} from '../config/capabilityManifest';
/* 能力边界展示：文案由 capabilityManifest 实时驱动（单一事实源），不再硬编码状态——
   此前组件 24/37 升级 available 后这里仍显示「HOLD」，状态与展示不一致。 */
const COMPONENT_LABELS:Record<string,{hold:string;available:string;flagFalse:string;merged:string}>={
  '25':{hold:'',available:'',flagFalse:'25 / 34：Shadow 能力关闭',merged:''},
  '34':{hold:'',available:'',flagFalse:'25 / 34：Shadow 能力关闭',merged:''},
  '26':{hold:'26：HOLD，不进入主链',available:'26：宿主登记门面可用（本地 BFF）',flagFalse:'',merged:''},
  '37':{hold:'37：HOLD，不进入主链',available:'37：OpenMAIC 互动课堂可用（本地运行时）',flagFalse:'',merged:''},
  '35':{hold:'',available:'',flagFalse:'',merged:'35 / 36：能力已合并、未正式激活'},
  '36':{hold:'',available:'',flagFalse:'',merged:'35 / 36：能力已合并、未正式激活'},
};
export function CapabilityStatus():JSX.Element{
  const lines=[
    /* proposal-only 安全边界（设计期常量，非开关）：正式云端权威未接入，一切结果为候选；本地功能见下列各行 */
    `正式云端登记与调度：未接入（本地演示边界，一切结果为候选；不影响下方本地功能）`,
    ...(['25','34','26','37','35','36'] as const).flatMap((id)=>{
      const label=COMPONENT_LABELS[id]?.[getCapabilityState(id) as keyof (typeof COMPONENT_LABELS)['25']] ?? null;
      return label?[label]:[];
    }),
    `浏览器朗读：${capabilityManifest.components.tts==='available'?'当前设备可用':'当前设备不支持，文字仍完整'}`,
  ];
  return<details className="capability"><summary><LockOutlined fontSize="small"/>能力边界</summary><ul>{lines.map((line)=><li key={line}>{line}</li>)}</ul></details>;
}
