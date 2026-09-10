import type { LearningSessionState } from './learningSessionReducer'; import { identityKey } from '../contracts/identity';
export function selectLearnerState(sessions:Map<string,LearningSessionState>,workspaceId:string,learnerId:string):LearningSessionState|undefined{return sessions.get(identityKey({workspaceId,learnerId}));}
