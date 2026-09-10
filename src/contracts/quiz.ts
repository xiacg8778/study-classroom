export type QuizQuestionType = 'choice' | 'fill' | 'steps';
export interface QuizQuestion { questionId: string; type: QuizQuestionType; prompt: string; options?: string[]; expectedAnswer: string; rationale: string; /** 步骤题踩点给分：每个关键点是一组可接受的同义表达，全覆盖才算对 */ keyPoints?: string[][]; /** 与 keyPoints 平行的关键点名称，用于「还差哪一步」反馈 */ keyPointLabels?: string[]; }
export interface Quiz { quizId: string; questions: QuizQuestion[]; }
export interface QuizExposure { exposureId: string; quizId: string; questionId: string; shownAt: string; }
export interface LearnerResponse { responseId: string; exposureId: string; rawAnswer: string; reasoningSteps: string[]; elapsedMs: number; hintCount: number; answeredAt: string; }
export interface ItemFeedback { questionId: string; exposureId: string; correct: boolean; originalAnswer: string; rationale: string; thinkingFeedback: string; errorCause: import('./wrongQuestion').ErrorCause; evidenceGap: string; }
export interface GradeQuizCommand { requestId: string; idempotencyKey: string; identity: import('./identity').IdentityContext; quiz: Quiz; exposures: QuizExposure[]; responses: LearnerResponse[]; restatement: string; transferEvidence?: string; lessonId?: string; }
