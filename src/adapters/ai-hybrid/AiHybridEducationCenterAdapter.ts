import type { AdapterResult,ResponseMeta } from '../../contracts/common'; import type { AdapterError } from '../../contracts/errors'; import type { IdentityContext } from '../../contracts/identity'; import type { BootstrapData,CloseUnitCommand,CloseUnitProposal,LearningIntentCommand,MicroLessonProposal,LessonStep } from '../../contracts/learning'; import type { GradeQuizCommand } from '../../contracts/quiz'; import type { GradingProposal } from '../../contracts/evidence'; import type { EducationCenterAdapter } from '../ports/EducationCenterAdapter'; import { LocalDemoEducationCenterAdapter } from '../local-demo/LocalDemoEducationCenterAdapter'; import { stableHash } from '../../services/hash'; import { loadAiConfig } from '../../services/aiRuntimeConfig';

/**
 * AI 混合适配器（真实 AI 接入的浏览器侧入口）。
 *
 * 设计：
 * - 装饰器模式：委托 LocalDemoEducationCenterAdapter 处理全部基线职责（bootstrap/幂等/收尾/登记）；
 *   仅「讲解生成」与「批改反馈」两个环节尝试调用本地代理增强，失败无缝降级 local-demo 结果。
 * - 密钥边界：浏览器不持有任何密钥；请求发往 127.0.0.1 代理，由代理持密钥转发。
 * - 诚实标注：AI 增强成功时 proposalId 加 ai- 前缀，limitation 注明「AI 生成为候选，家长可复核」；
 *   失败降级时与原 local-demo 行为完全一致。
 * - 探活：/health 短超时；not-configured/网络失败都视为「AI 不可用」，不再重试轰炸。
 */

/* 运行时配置（localStorage + UI 设置面板），按次调用读取——用户切换开关/改端口立即生效 */
const PROXY_BASE=():string=>`http://127.0.0.1:${loadAiConfig().port}`;
const AI_ENABLED=():boolean=>loadAiConfig().enabled;

interface AiLessonContent{objective:string;steps:Array<{title:string;body:string;action:string;visualCue:string}>;refusal?:string;}
interface AiGradingContent{items:Array<{questionId:string;thinkingFeedback:string;errorCause?:string;rationale?:string}>;refusal?:string;}
interface AiQuizContent{quizId?:string;questions:import('../../contracts/quiz').QuizQuestion[];refusal?:string;}

async function callProxy<T>(path:string,prompt:string,timeoutMs=60000,kind:'lesson'|'grading'|'quiz'='lesson'):Promise<T|null>{
  try{
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),timeoutMs);
    /* kind 必须显式传递：代理按 body.kind 选择输出 schema（缺省一律按 lesson，quiz 会拿到讲解格式导致校验失败降级） */
    const response=await fetch(`${PROXY_BASE()}${path}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({prompt,kind}),signal:controller.signal});
    clearTimeout(timer);
    if(!response.ok)return null;
    const parsed=(await response.json()) as {ok:boolean;content?:T};
    return parsed.ok&&parsed.content?parsed.content:null;
  }catch{return null;}
}

function lessonPrompt(command:LearningIntentCommand):string{
  const materialHint=command.material?`课程：${command.material.lessonId??''}，材料引用：${command.material.quote.slice(0,200)}`:'';
  /* 追问场景：携带上轮讲解摘要，要求模型真的换角度，而不是换个说法重复 */
  const followUp=command.previousLesson?`\n这是上一轮的讲解（目标：${command.previousLesson.objective}；三步：${command.previousLesson.stepTitles.join('、')}）。学习者现在要求：「${command.problemText.slice(0,200)}」。请务必换一个不同的切入角度重新讲解这个课程内容（例如换生活场景、换类比、换互动方式），不要重复上一轮的步骤结构和措辞。`:'';
  return`请为小学生生成三步微课堂。学习者的问题或材料：${command.problemText.slice(0,800)}。${materialHint}${followUp}
要求：objective 一句话；steps 恰好三步（title/body/action/visualCue），口语化，每步只安排一个动作，总字数不超过 350 字。${command.previousLesson?'三步的标题和内容必须与上一轮明显不同。':''}`;
}

/* R 码语义定义：随提示发给模型，避免模型凭空猜码；同时用于校验 AI 返回值的合法性（防幻觉码直达界面） */
const R_CODE_DEFS='R1=概念理解偏差,R2=方法选择不当,R3=计算步骤出错,R4=数位与进退位处理失误,R5=口诀或事实记忆偏差,R6=单位或分数单位混淆,R7=审题不完整,R8=步骤跳跃或过程不完整,R9=缺少检验习惯,R10=注意力或状态波动,R11=新情境迁移困难,undetermined=证据不足暂无法判断';
const VALID_ERROR_CAUSES=new Set(['R1','R2','R3','R4','R5','R6','R7','R8','R9','R10','R11','undetermined']);

function gradingPrompt(command:GradeQuizCommand):string{
  const lines=command.quiz.questions.map((question)=>{const response=command.responses.find((r)=>command.exposures.find((e)=>e.exposureId===r.exposureId)?.questionId===question.questionId);return`题 ${question.questionId}（${question.type}）：${question.prompt} 正确答案：${question.expectedAnswer} 学生作答：${response?.rawAnswer??''}`;});
  return`请逐题批改以下小学数学作答。只输出 thinkingFeedback（对思路的具体反馈，须紧扣本题内容）与 errorCause（从以下枚举中选最贴切的一个，禁止用「粗心」：${R_CODE_DEFS}），以及必要时的 rationale。每题之间用换行分隔。\n${lines.join('\n')}\n学生复述：${command.restatement.slice(0,200)}`;
}

/* 任意材料（local-pdf/ocr）路径：让模型按材料出题，而非套用本地演示的分数题。
   约束 quizId 前缀（代理 schema 同款 pattern），后续批改/收尾引擎据此识别「AI 生成 Quiz」族。 */
function quizPrompt(command:LearningIntentCommand):string{
  const gradeHint='学习者是中国小学二到三年级学生。';
  return`请围绕以下学习材料生成一份小测验（3～4 题），用于检验学习者是否理解了材料的核心内容。${gradeHint}材料：${command.problemText.slice(0,1200)}。要求：题型混合（至少 1 道四选一 choice、其余为 fill 或 steps）；choice 题给出恰好 4 个 options；steps 题给 keyPoints（每组为可接受的同义表达数组）与 keyPointLabels；quizId 必须以 ai-generic- 开头（后接小写字母数字连字符）；题目必须能凭材料内容作答，不出超纲题。`;
}

/* AI 返回 Quiz 的运行时校验（代理已按 schema 约束，此处做最后一道防线）：过滤残缺题，不足 2 题视为失败整体降级 */
function sanitizeAiQuiz(content:AiQuizContent):import('../../contracts/quiz').Quiz|null{
  if(content.refusal||!Array.isArray(content.questions))return null;
  const questions=content.questions.filter((q)=>q&&typeof q.questionId==='string'&&typeof q.prompt==='string'&&typeof q.expectedAnswer==='string'&&typeof q.rationale==='string'&&(q.type==='choice'||q.type==='fill'||q.type==='steps'))
    .map((q)=>({...q,options:q.type==='choice'&&Array.isArray(q.options)&&q.options.length>=2?q.options.slice(0,6):undefined}));
  if(questions.length<2)return null;
  return{quizId:/^ai-generic-[a-z0-9-]*$/.test(content.quizId??'')?content.quizId!:`ai-generic-${stableHash(content).slice(0,8)}`,questions};
}

export class AiHybridEducationCenterAdapter implements EducationCenterAdapter{
  private readonly fallback=new LocalDemoEducationCenterAdapter();
  private meta(requestId:string,aiEnhanced=false):ResponseMeta{return{requestId,correlationId:`corr-${requestId}`,schemaVersion:aiEnhanced?'ai-hybrid@1.1.0':'local-demo@1.0.0'};}
  private fail<T>(requestId:string,code:AdapterError['code'],message:string):AdapterResult<T>{const meta=this.meta(requestId);return{ok:false,error:{code,message,retryable:code==='VERSION_CONFLICT',requestId,correlationId:meta.correlationId},meta};}

  public async bootstrap(identity:IdentityContext):Promise<AdapterResult<BootstrapData>>{return this.fallback.bootstrap(identity);}
  public async closeLearningUnit(command:CloseUnitCommand):Promise<AdapterResult<CloseUnitProposal>>{return this.fallback.closeLearningUnit(command);}
  public async prepareRegistration(command:import('../../contracts/registration').PrepareRegistrationCommand):Promise<AdapterResult<import('../../contracts/registration').RegistrationProposal>>{return this.fallback.prepareRegistration(command);}

  public async routeLearningIntent(command:LearningIntentCommand):Promise<AdapterResult<MicroLessonProposal>>{
    const base=this.fallback.routeLearningIntent(command);
    if(!AI_ENABLED())return base;
    /* OpenMAIC 互动课堂路径：课件由本地 BFF 完整供给，本适配器的 AI 增强结果随后会被课件整体覆盖——
       纯属浪费最长 60s 的等待（用户感知为「点了生成没反应」），直接返回基线。 */
    if(command.skipAiEnhance)return base;
    /* 安全拦截 fail-closed 交给基线；AI 只增强真实内容路径。
       ① 苏教版课程路径：讲解用 AI 定制，Quiz 用课程配套（与旧行为一致）；
       ② 任意材料路径（local-pdf/ocr 等）：讲解与 Quiz 全部由 AI 生成——不再套用本地演示的分数题。
          全有或全无：讲解与 Quiz 任一失败即整体降级基线（诚实标注），绝不出现「AI 讲解配假分数题」的混搭。 */
    if(command.material?.origin!=='original-demo'){
      const genericBaseline=await base;
      if(!genericBaseline.ok)return genericBaseline;
      try{
        const lessonPromise=callProxy<AiLessonContent>('/api/ai/lesson',lessonPrompt(command),60000,'lesson');
        const quizPromise=callProxy<AiQuizContent>('/api/ai/quiz',quizPrompt(command),60000,'quiz');
        const [content,rawQuiz]=await Promise.all([lessonPromise,quizPromise]);
        const quiz=sanitizeAiQuiz(rawQuiz??{questions:[]});
        if(!content||content.refusal||!quiz)return genericBaseline;
        const steps:LessonStep[]=content.steps.slice(0,3).map((step,index)=>({stepId:`ai-s${index+1}`,title:step.title.slice(0,20),body:step.body.slice(0,160),action:step.action.slice(0,120),visualCue:step.visualCue.slice(0,80)}));
        if(steps.length<3)return genericBaseline;
        return{ok:true,data:{...genericBaseline.data,executionMode:'ai-enhanced',proposalId:`ai-lesson-${stableHash(command)}`,objective:content.objective.slice(0,120),steps,quiz,limitation:'本讲解与测验均由 AI 依据你的材料生成（本地代理转发），为候选内容，建议家长抽查复核。',learnerQuestion:command.problemText},meta:this.meta(command.requestId,true)};
      }catch{return genericBaseline;}
    }
    const baseline=await base;
    if(!baseline.ok)return baseline;
    try{
      const content=await callProxy<AiLessonContent>('/api/ai/lesson',lessonPrompt(command),60000,'lesson');
      if(!content||content.refusal)return baseline;
      const steps:LessonStep[]=content.steps.slice(0,3).map((step,index)=>({stepId:`ai-s${index+1}`,title:step.title.slice(0,20),body:step.body.slice(0,160),action:step.action.slice(0,120),visualCue:step.visualCue.slice(0,80)}));
      if(steps.length<3)return baseline;
      return{ok:true,data:{...baseline.data,executionMode:'ai-enhanced',proposalId:`ai-lesson-${stableHash(command)}`,objective:content.objective.slice(0,120),steps,limitation:'本讲解由 AI 生成（本地代理转发），为候选内容，建议家长抽查复核。',learnerQuestion:command.problemText},meta:this.meta(command.requestId,true)};
    }catch{return baseline;}
  }

  public async gradeQuiz(command:GradeQuizCommand):Promise<AdapterResult<GradingProposal>>{
    const base=this.fallback.gradeQuiz(command);
    if(!AI_ENABLED())return base;
    const baseline=await base;
    if(!baseline.ok)return baseline;
    try{
      const content=await callProxy<AiGradingContent>('/api/ai/grading',gradingPrompt(command),20000,'grading');
      if(!content||content.refusal)return baseline;
      const byId=new Map(content.items.map((item)=>[item.questionId,item]));
      /* 只增强反馈文案与错因；对错判定保留 local-demo 确定性逻辑（答案比对），AI 不改判对错 */
      const items=baseline.data.items.map((item)=>{const ai=byId.get(item.questionId);if(!ai)return item;/* AI 错因码必须是合法枚举，否则丢弃保留本地判定，防止幻觉码直达界面 */const aiCause=ai.errorCause&&VALID_ERROR_CAUSES.has(ai.errorCause)?ai.errorCause as typeof item.errorCause:undefined;return{...item,thinkingFeedback:ai.thinkingFeedback.slice(0,160),errorCause:item.correct?item.errorCause:aiCause??item.errorCause};});
      return{ok:true,data:{...baseline.data,executionMode:'ai-enhanced',proposalId:`ai-grade-${stableHash(command)}`,items},meta:this.meta(command.requestId,true)};
    }catch{return baseline;}
  }
}
