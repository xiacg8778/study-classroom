import {describe,expect,it} from 'vitest';import {createInitialState,learningSessionReducer} from '../../src/state/learningSessionReducer';
const identity={workspaceId:'w',learnerId:'a',sessionId:'s',baseContextVersion:1,consentScopeRef:'c'};
describe('session reducer',()=>{it('allows consent transition',()=>{expect(learningSessionReducer(createInitialState(identity),{type:'CONSENT'}).phase).toBe('catalog_ready')});it('rejects illegal transition',()=>{const state=learningSessionReducer(createInitialState(identity),{type:'SET_PHASE',phase:'review'});expect(state.phase).toBe('consent_required');expect(state.error).toContain('非法')});it('clears all sensitive state',()=>{const state={...createInitialState(identity),consented:true,restatement:'sentinel',phase:'catalog_ready' as const};expect(learningSessionReducer(state,{type:'CLEAR_SENSITIVE'}).restatement).toBe('')});});
;
describe('registration commit (host closure)',()=>{
  const registration={schemaVersion:'registration-proposal@1.0.0' as const,proposalId:'reg-1',workspaceId:'w',learnerId:'a',sessionId:'s',baseContextVersion:1,evidenceCursor:'cur',promptBundleRef:'bundle',idempotencyKey:'idem',persistenceIntent:'propose' as const,mutations:[{entity:'wrong-question' as const,operation:'propose' as const,referenceId:'w1'}]};
  const withClose={...createInitialState(identity),registration};
  it('stores receipt only when registration proposal exists',()=>{
    const bare=createInitialState(identity);
    const noProposal=learningSessionReducer(bare,{type:'REGISTRATION_COMMITTED',receipt:{commitId:'c1',status:'committed'}});
    expect(noProposal.registrationReceipt).toBeUndefined();
    const ok=learningSessionReducer(withClose,{type:'REGISTRATION_COMMITTED',receipt:{commitId:'c1',status:'committed'}});
    expect(ok.registrationReceipt?.commitId).toBe('c1');
    expect(ok.registrationError).toBeUndefined();
  });
  it('records commit error for retry UI',()=>{
    const failed=learningSessionReducer(withClose,{type:'REGISTRATION_FAILED',message:'宿主离线'});
    expect(failed.registrationError).toBe('宿主离线');
    expect(failed.registrationReceipt).toBeUndefined();
  });
});