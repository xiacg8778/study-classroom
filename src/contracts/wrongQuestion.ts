export type ErrorCause = 'R1'|'R2'|'R3'|'R4'|'R5'|'R6'|'R7'|'R8'|'R9'|'R10'|'R11'|'undetermined';
export interface RetestPlan { timing: string; task: string; state: 'candidate-not-scheduled'; }
export interface WrongQuestionCandidate { candidateId: string; subject: string; chapter: string; question: string; originalAnswerAndThinking: string; errorCause: ErrorCause; correctEntry: string; avoidanceMethod: string; recognitionCue: string; repeated: boolean; retestPlan: RetestPlan; registrationState: 'pending-registration'; }
