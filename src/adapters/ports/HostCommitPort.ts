import type { AdapterResult } from '../../contracts/common'; import type { RegistrationProposal } from '../../contracts/registration';
export type CommitAvailability='available'|'unavailable'; export interface CommitReceipt { commitId:string; status:'committed'; }
export interface HostCommitPort { availability():CommitAvailability; commit(proposal:RegistrationProposal):Promise<AdapterResult<CommitReceipt>>; }
