export type ExecutionMode = 'local-demo' | 'ai-enhanced' | 'host-connected';
export type PersistenceState = 'local-draft' | 'not-submitted' | 'submitted' | 'committed' | 'rejected' | 'conflict';
export interface ResponseMeta { requestId: string; correlationId: string; schemaVersion: string; deduplicated?: boolean; }
export type AdapterResult<T> = { ok: true; data: T; meta: ResponseMeta } | { ok: false; error: import('./errors').AdapterError; meta: ResponseMeta };
/* executionMode 如实标注本次提案的真实链路：ai-enhanced=LLM 生成内容、local-demo=本地确定性引擎、host-connected=正式宿主（当前不可达）。
   proposalOnly 边界不受 mode 影响：任何模式下提案都不自动提交，登记与调度权威仍在 kernel-10 契约。 */
export interface ProposalTruth { executionMode: 'local-demo' | 'ai-enhanced'; proposalOnly: true; schedulerAuthority: 'kernel-10'; formalKernelRouteActivated: false; persistenceState: 'not-submitted'; }
