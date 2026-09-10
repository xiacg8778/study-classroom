import type { ProposalTruth } from './common';
import type { IdentityContext } from './identity';
import type { MaterialReference } from './textbook';
import type { Quiz } from './quiz';
export type IntentType = 'explain' | 'example' | 'rephrase' | 'problem';
export interface LearningIntentCommand { requestId: string; idempotencyKey: string; identity: IdentityContext; intent: IntentType; material?: MaterialReference; problemText: string; /** 追问场景：上一轮讲解的摘要（目标+步骤标题），让「换种讲法/举个例子」等请求有可「换」的基线 */ previousLesson?: { objective: string; stepTitles: string[] }; /** OpenMAIC 互动课堂路径：课件由本地 BFF 完整供给，AI 增强结果会被课件整体覆盖，跳过以省去最长 60s 的等待（此前是「点了生成没反应」的主因） */ skipAiEnhance?: boolean; }
export interface LessonStep { stepId: string; title: string; body: string; action: string; visualCue: string; }
/**
 * OpenMAIC 课件演示。分三类：
 * - 数值动画（数学）：加/减/乘
 * - 通用分步揭示（任何学科）：step-reveal
 * - 语文专属：关键词圈画 / 事件顺序 / 句子扩写（覆盖阅读、复述、表达三类课型）
 */
export type CoursewareDemo =
  | { kind: 'column-addition' | 'make-ten' | 'column-subtraction' | 'multiplication-groups'; a: number; b: number }
  | { kind: 'step-reveal'; steps: string[] }
  /* 关键词圈画：给一句话，依次圈出关键词，说明「抓住这个词就懂了」 */
  | { kind: 'keyword-mark'; sentence: string; keywords: string[] }
  /* 事件顺序：把故事按时间顺序排成一条线（复述类课型的核心方法） */
  | { kind: 'story-sequence'; events: string[] }
  /* 句子扩写：骨架句 → 加「怎么样」→ 加比喻，逐层把句子说生动 */
  | { kind: 'sentence-build'; base: string; addHow: string; addMetaphor?: string };
export interface MicroLessonProposal extends ProposalTruth { proposalId: string; paradigm: 'concept-mastery' | 'problem-scaffold'; objective: string; steps: LessonStep[]; quiz: Quiz; limitation?: string; /** 本次学习的问题原文（来自学习者输入），供 UI 呈现「问题 vs 讲解」关系 */ learnerQuestion?: string; /** OpenMAIC 互动课件会话：存在时微课堂以互动控件呈现，互动经 callback 回传运行时 */ interactive?: { sessionNote: string; interactions: Array<{ kind: 'observe-confirm' | 'attempt-confirm' | 'summarize-input'; prompt: string }>; demos: Array<CoursewareDemo | null>; }; }
export interface BootstrapData { identity: IdentityContext; contextVersion: number; manifest: import('../config/capabilityManifest').CapabilityManifest; textbooks: import('./textbook').Textbook[]; }
export interface CloseUnitCommand { requestId: string; idempotencyKey: string; identity: IdentityContext; grading: import('./evidence').GradingProposal; quiz: Quiz; lessonId?: string; }
export interface CloseUnitProposal extends ProposalTruth { proposalId: string; wrongQuestions: import('./wrongQuestion').WrongQuestionCandidate[]; graph: import('./knowledgeGraph').KnowledgeGraphView; nextLesson: import('./nextLesson').NextLessonProposal; }
