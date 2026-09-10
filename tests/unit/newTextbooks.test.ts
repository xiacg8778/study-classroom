import {describe,expect,it} from 'vitest';import {LocalDemoProposalEngine} from '../../src/adapters/local-demo/LocalDemoProposalEngine';import {demoTextbooks,sj2bLessonPacks,ywLessonPacks,yw2bLessonPacks,ywQuizByLesson,yw2bQuizByLesson,sj2bQuizByLesson} from '../../src/adapters/local-demo/localDemoFixtures';
const identity={workspaceId:'w',learnerId:'a',sessionId:'s',baseContextVersion:1,consentScopeRef:'c'};
const mat=(lessonId:string)=>({referenceId:'r',origin:'original-demo' as const,documentId:'doc',lessonId,page:1,startOffset:0,endOffset:10,quote:'q',quoteDigest:'d',trustLevel:'untrusted-material' as const});
describe('new textbooks full chain (yw2a + sj2b)',()=>{
  const engine=new LocalDemoProposalEngine();
  const chain=(lessonId:string,quizId:string)=>{
    const lesson=engine.buildMicroLesson({requestId:'l',idempotencyKey:'l',identity,intent:'problem',material:mat(lessonId),problemText:'测试'});
    expect(lesson.quiz.quizId).toBe(quizId);
    expect(lesson.steps).toHaveLength(3);
    const quiz=lesson.quiz;
    const exposures=quiz.questions.map(q=>({exposureId:`e-${q.questionId}`,quizId:quiz.quizId,questionId:q.questionId,shownAt:new Date().toISOString()}));
    const grading=engine.buildGrading({requestId:'g',idempotencyKey:'g',identity,quiz,lessonId,exposures,responses:quiz.questions.map(q=>({responseId:`r-${q.questionId}`,exposureId:`e-${q.questionId}`,rawAnswer:q.expectedAnswer,reasoningSteps:[],elapsedMs:1,hintCount:0,answeredAt:new Date().toISOString()})),restatement:'我会按课上的方法说一说。'});
    expect(grading.items.every(i=>i.correct)).toBe(true);
    const close=engine.close({requestId:'c',idempotencyKey:'c',identity,grading,quiz,lessonId});
    expect(close.nextLesson.primaryPath).toMatch(/^P[1-9]$/);
    return {lesson,grading,close};
  };
  it('yw2a lessons: pack-driven lesson, keyed grading hint, chinese subject',()=>{
    for(const lessonId of Object.keys(ywLessonPacks)){
      const {grading,close}=chain(lessonId,ywQuizByLesson[lessonId].quizId);
      expect(close.wrongQuestions.every(w=>w.subject==='语文')).toBe(true);
      expect(grading.items.every(i=>!i.thinkingFeedback.includes('进位'))).toBe(true);
    }
  });
  it('sj2b lessons: pack-driven lesson, division hints, math subject',()=>{
    for(const lessonId of Object.keys(sj2bLessonPacks)){
      expect(sj2bQuizByLesson[lessonId]).toBeDefined();
      const {close}=chain(lessonId,sj2bQuizByLesson[lessonId].quizId);
      expect(close.wrongQuestions.every(w=>w.subject==='数学')).toBe(true);
    }
  });
  it('yw2b lessons: pack-driven lesson, chinese subject, evidence-based hints',()=>{
    for(const lessonId of Object.keys(yw2bLessonPacks)){
      expect(yw2bQuizByLesson[lessonId]).toBeDefined();
      const {grading,close}=chain(lessonId,yw2bQuizByLesson[lessonId].quizId);
      expect(close.wrongQuestions.every(w=>w.subject==='语文')).toBe(true);
      expect(grading.items.every(i=>!i.thinkingFeedback.includes('进位'))).toBe(true);
    }
  });
  it('four textbooks exposed in catalog',()=>{
    expect(demoTextbooks.map(b=>b.textbookId)).toEqual(['sj-math-2a-original','yw-2a-original','sj-math-2b-original','yw-2b-original']);
    expect(demoTextbooks.every(b=>b.lessons.length>=3)).toBe(true);
  });
});
