import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { WrongQuestionCandidate } from '../../src/contracts/wrongQuestion';
import {
  appendLocalRecord,
  clearLocalRecords,
  collectHistoricalWrongQuestions,
  loadLocalRecords,
  recordFromClose,
  removeLocalRecord,
} from '../../src/services/localRecordStore';

const wrongQuestion = (question: string): WrongQuestionCandidate => ({
  candidateId: `w-${question}`,
  subject: '数学',
  chapter: '100以内的加减法',
  question,
  originalAnswerAndThinking: '答了 76',
  errorCause: 'R3',
  correctEntry: '先看个位',
  avoidanceMethod: '验算',
  recognitionCue: '满十进一',
  repeated: false,
  retestPlan: { timing: '下次', task: '变式一道', state: 'candidate-not-scheduled' },
  registrationState: 'pending-registration',
});

const base = {
  textbookTitle: '数学小侦探·二年级上',
  lessonTitle: '进位与退位',
  mastery: 'L2',
  nextLessonPath: 'P3',
  nextLessonAction: '先完成错题变式',
};

describe('localRecordStore', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('appends and loads records per learner', () => {
    appendLocalRecord('learner-a', { recordId: 'close-1', createdAt: '2026-09-07T20:00:00Z', ...base, wrongQuestions: [wrongQuestion('47+28=?'), wrongQuestion('52-37=?')], chapter: '100以内的加减法' });
    appendLocalRecord('learner-b', { recordId: 'close-2', createdAt: '2026-09-07T20:10:00Z', ...base, wrongQuestions: [], chapter: '' });
    expect(loadLocalRecords('learner-a')).toHaveLength(1);
    expect(loadLocalRecords('learner-b')).toHaveLength(1);
    expect(collectHistoricalWrongQuestions('learner-a')).toHaveLength(2);
    expect(collectHistoricalWrongQuestions('learner-b')).toHaveLength(0);
  });

  it('is idempotent on the same recordId', () => {
    appendLocalRecord('learner-a', { recordId: 'close-1', createdAt: '2026-09-07T20:00:00Z', ...base, wrongQuestions: [], chapter: '' });
    appendLocalRecord('learner-a', { recordId: 'close-1', createdAt: '2026-09-07T20:05:00Z', ...base, wrongQuestions: [], chapter: '' });
    expect(loadLocalRecords('learner-a')).toHaveLength(1);
  });

  it('marks repeated wrong questions against history', () => {
    recordFromClose({ learnerId: 'learner-a', recordId: 'close-1', wrongQuestions: [wrongQuestion('47+28=?')], ...base });
    recordFromClose({ learnerId: 'learner-a', recordId: 'close-2', wrongQuestions: [wrongQuestion('47+28=?'), wrongQuestion('81-45=?')], ...base });
    const records = loadLocalRecords('learner-a');
    const second = records.find((r) => r.recordId === 'close-2');
    const repeated = second?.wrongQuestions.find((w) => w.question === '47+28=?');
    const fresh = second?.wrongQuestions.find((w) => w.question === '81-45=?');
    expect(repeated?.repeated).toBe(true);
    expect(fresh?.repeated).toBe(false);
  });

  it('does not share records across learners and supports removal', () => {
    recordFromClose({ learnerId: 'learner-a', recordId: 'close-1', wrongQuestions: [wrongQuestion('47+28=?')], ...base });
    expect(loadLocalRecords('learner-b')).toHaveLength(0);
    removeLocalRecord('learner-a', 'close-1');
    expect(loadLocalRecords('learner-a')).toHaveLength(0);
    recordFromClose({ learnerId: 'learner-a', recordId: 'close-2', wrongQuestions: [], ...base });
    clearLocalRecords('learner-a');
    expect(loadLocalRecords('learner-a')).toHaveLength(0);
  });
});
