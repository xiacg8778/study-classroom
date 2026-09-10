import {Button} from '@mui/material';import {Link} from 'react-router-dom';import {useLearningSession} from '../../state/LearningSessionProvider';import {ProposalBadge} from '../../components/ProposalBadge';import {pathLabel,evidenceKindLabel} from '../../contracts/labels';import {TtsControls} from '../lesson/TtsControls';import {WrongQuestionCandidateCard} from '../wrong-questions/WrongQuestionCandidateCard';import {FocusedKnowledgePath} from '../knowledge-graph/FocusedKnowledgePath';import {CheckCircleOutline} from '@mui/icons-material';
export function NextLessonProposal():JSX.Element{const{state,commitRegistration}=useLearningSession();const close=state.close;if(!close)return<div/>;const next=close.nextLesson;const receipt=state.registrationReceipt;const commitError=state.registrationError;
/* 证据栏给人看：内部 evidenceRef 翻译成「类型＋说明」；ID 仅登记/日志使用，不直达 UI。
   同类多条折叠计数；模板化 summary（如「记录了原始作答与用时。」）不重复展示，复述/迁移等有真实内容的才带出。 */
const evidence=state.grading?.evidenceCandidates;
const TEMPLATE_SUMMARY='记录了原始作答与用时。';
const evidenceText=(():string=>{
  if(!next.evidenceRefs.length)return '证据不足';
  if(!evidence?.length)return `共 ${next.evidenceRefs.length} 条本课学习记录`;
  const counts=new Map<string,{label:string;detail:string[];count:number}>();
  for(const e of evidence){
    const label=evidenceKindLabel(e.kind);
    const detail=e.summary&&!TEMPLATE_SUMMARY.includes(e.summary.slice(0,8))&&!e.summary.startsWith('记录了原始作答')?e.summary:'';
    const entry=counts.get(label)??{label,detail:[],count:0};
    if(detail&&!entry.detail.includes(detail))entry.detail.push(detail);
    entry.count+=1;
    counts.set(label,entry);
  }
  return [...counts.values()].map((entry)=>entry.count>1?`${entry.label} ×${entry.count}${entry.detail.length?`（${entry.detail.join('；')}）`:''}`:`${entry.label}${entry.detail.length?`（${entry.detail.join('；')}）`:''}`).join('、');
})();
return<section className="next-proposal"><ProposalBadge label={receipt?'已提交宿主登记（有回执）':'下一课建议 proposal · 尚未保存'}/><p className="eyebrow">唯一主路径 {pathLabel(next.primaryPath)} · {next.durationMinutes} 分钟</p><h1>{next.action}</h1><TtsControls segments={[`下一步任务：${next.action}`,`为什么：${next.rationale}`]} auto label="朗读任务与理由"/><p><strong>为什么：</strong>{next.rationale}</p><p><strong>证据：</strong>{evidenceText}</p><p><strong>暂不做：</strong>{next.doNotDo}</p><hr className="rule"/><h2>错题候选</h2>{close.wrongQuestions.length?close.wrongQuestions.map((item)=><WrongQuestionCandidateCard key={item.candidateId} item={item}/>):<p>本次没有错题候选。</p>}<h2>知识路径</h2><FocusedKnowledgePath graph={close.graph}/><p>登记意图：{state.registration?'以候选身份登记，不覆盖既有记录':'尚未准备'}</p>{receipt?<p className="host-receipt" role="status"><CheckCircleOutline style={{verticalAlign:'-4px',marginRight:6,color:'#2e7d32'}}/>宿主已登记 · 回执 {receipt.commitId}</p>:commitError?<p className="host-error" role="alert">{commitError}</p>:null}{!receipt&&state.registration&&<Button variant="contained" onClick={()=>void commitRegistration()}>提交到宿主登记（组件 24）</Button>}{receipt&&<p className="host-note">正式宿主为本地 BFF 演示实现：登记册在本机 ~/.host-bff/registry.json，非云端权威登记。</p>}<Button component={Link} to="/knowledge-graph">查看完整图谱</Button></section>}
