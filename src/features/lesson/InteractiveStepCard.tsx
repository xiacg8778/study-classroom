import {useState} from 'react';import {SafeText} from '../../components/SafeText';import {CoursewareDemo} from './CoursewareDemo';import {Button,TextField} from '@mui/material';import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';import {useLearningSession} from '../../state/LearningSessionProvider';import type {LessonStep} from '../../contracts/learning';import type {CoursewareDemo as CoursewareDemoData} from '../../contracts/learning';
/**
 * OpenMAIC 互动课件步骤卡：每步带真实互动控件，互动经 callback 回传运行时。
 * - observe-confirm：观察确认按钮
 * - attempt-confirm：做到哪一步了（选项：完成了/有困难）
 * - summarize-input：总结输入框（必填）
 * callback 成功（ack）后「下一步」解锁；失败显示原因且允许跳过（不阻断学习链）。
 */
export function InteractiveStepCard({step,index,total,interaction,demo,done,onDone}:{step:LessonStep;index:number;total:number;interaction:{kind:'observe-confirm'|'attempt-confirm'|'summarize-input';prompt:string};demo:CoursewareDemoData|null;done:boolean;onDone:()=>void}):JSX.Element{
  const{sendInteraction}=useLearningSession();
  const[answer,setAnswer]=useState('');
  const[sending,setSending]=useState(false);
  const[result,setResult]=useState<{ok:boolean;detail?:string}|null>(null);
  const submit=async(payload:{type:string;answer?:string}):Promise<void>=>{
    setSending(true);setResult(null);
    const r=await sendInteraction(payload);
    setSending(false);setResult(r);
    if(r.ok)onDone();
  };
  return<article className="lesson-step interactive-step">
    <p className="eyebrow">互动课堂 {index+1} / {total} · OpenMAIC 课件</p>
    <h2>{step.title}</h2>
    <SafeText text={step.body} as="p"/>
    <aside><strong>现在只做这一件事</strong><SafeText text={interaction.prompt} as="p"/></aside>
    {demo&&<CoursewareDemo demo={demo}/>}
    <div className="interaction-area">
      {interaction.kind==='observe-confirm'&&<Button variant="outlined" disabled={done||sending} onClick={()=>void submit({type:interaction.kind})}>{done?'已确认观看':'我看清楚演示了'}</Button>}
      {interaction.kind==='attempt-confirm'&&<><Button variant="outlined" disabled={done||sending} onClick={()=>void submit({type:interaction.kind,answer:'completed'})}>我在纸上完成了</Button><Button variant="outlined" disabled={done||sending} onClick={()=>void submit({type:interaction.kind,answer:'stuck'})}>这一步有困难</Button></>}
      {interaction.kind==='summarize-input'&&<><TextField fullWidth multiline minRows={2} label="你总结的最关键一步" value={answer} onChange={(e)=>setAnswer(e.target.value)} disabled={done||sending} inputProps={{'aria-label':'总结输入'}}/><Button variant="outlined" disabled={done||sending||!answer.trim()} onClick={()=>void submit({type:interaction.kind,answer:answer.trim()})}>提交我的总结</Button></>}
      {done&&<span className="interaction-ack" role="status"><CheckCircleOutline style={{verticalAlign:'-4px',marginRight:4,color:'#2e7d32'}}/>互动已记录</span>}
      {result&&!result.ok&&<span className="interaction-error" role="alert">回传失败：{result.detail}（可继续学习，不阻断）</span>}
    </div>
    <small>{step.visualCue}</small>
  </article>;
}

