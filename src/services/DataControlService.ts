import type { LearningSessionState } from '../state/learningSessionReducer';
export class DataControlService {
  public createExport(state: LearningSessionState): Blob { const safe={ schemaVersion:'local-candidate-export@1.0.0', workspaceId:state.identity.workspaceId, learnerId:state.identity.learnerId, exportedAt:new Date().toISOString(), source:'browser-session', lesson:state.lesson, grading:state.grading, close:state.close, registration:state.registration }; return new Blob([JSON.stringify(safe,null,2)],{type:'application/json'}); }
  public download(state: LearningSessionState): void { const blob=this.createExport(state); const url=URL.createObjectURL(blob); const anchor=document.createElement('a'); anchor.href=url; anchor.download=`learning-candidates-${state.identity.learnerId}.json`; anchor.click(); URL.revokeObjectURL(url); }
}
