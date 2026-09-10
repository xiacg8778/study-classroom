import {describe,expect,it} from 'vitest';import {nextLessonSchema,wrongQuestionSchema,learningIntentSchema} from '../../src/contracts/schemas';
const truth={executionMode:'local-demo',proposalOnly:true,schedulerAuthority:'kernel-10',formalKernelRouteActivated:false,persistenceState:'not-submitted'};
describe('domain contracts',()=>{it('accepts one primary path and rejects duplicate support',()=>{const base={...truth,proposalId:'n',primaryPath:'P3',rationale:'证据不足',evidenceRefs:[],durationMinutes:10,action:'复习',doNotDo:'不推进'};expect(nextLessonSchema.safeParse(base).success).toBe(true);expect(nextLessonSchema.safeParse({...base,supportPath:'P3'}).success).toBe(false)});it('requires all eight wrong question fields',()=>{const candidate={candidateId:'w',subject:'数学',chapter:'分数',question:'题目',originalAnswerAndThinking:'原答',errorCause:'R3',correctEntry:'入口',avoidanceMethod:'方法',recognitionCue:'线索',repeated:false,retestPlan:{timing:'下次',task:'一题',state:'candidate-not-scheduled'},registrationState:'pending-registration'};expect(wrongQuestionSchema.safeParse(candidate).success).toBe(true);expect(wrongQuestionSchema.safeParse({...candidate,recognitionCue:''}).success).toBe(false)});});


describe('learningIntentSchema previousLesson (follow-up context)', () => {
  const baseIdentity = { workspaceId: 'ws', learnerId: 'stu-001', sessionId: 's1', baseContextVersion: 0, consentScopeRef: 'ref-1' };
  const base = { requestId: 'r1', idempotencyKey: 'k1', identity: baseIdentity, intent: 'rephrase', problemText: '换种讲法' };

  it('accepts previousLesson follow-up context', () => {
    const result = learningIntentSchema.safeParse({ ...base, previousLesson: { objective: '理解2的口诀', stepTitles: ['认一认', '找规律', '拼一拼'] } });
    expect(result.success).toBe(true);
  });

  it('accepts command without previousLesson', () => {
    expect(learningIntentSchema.safeParse(base).success).toBe(true);
  });

  it('still rejects unknown extra keys (strict)', () => {
    const result = learningIntentSchema.safeParse({ ...base, unknownField: 'x' });
    expect(result.success).toBe(false);
  });

  it('rejects malformed previousLesson (empty stepTitles)', () => {
    const result = learningIntentSchema.safeParse({ ...base, previousLesson: { objective: 'x', stepTitles: [] } });
    expect(result.success).toBe(false);
  });
});
