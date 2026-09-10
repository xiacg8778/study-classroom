import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LearningIntentCommand } from '../../src/contracts/learning';
import type { IdentityContext } from '../../src/contracts/identity';
import type { MaterialReference } from '../../src/contracts/textbook';
import { AiHybridEducationCenterAdapter } from '../../src/adapters/ai-hybrid/AiHybridEducationCenterAdapter';
import { saveAiConfig } from '../../src/services/aiRuntimeConfig';

const identity: IdentityContext = { workspaceId: 'family-local', learnerId: 'learner-a', sessionId: 's1', baseContextVersion: 1, consentScopeRef: 'guardian-local-consent@1' };
const material: MaterialReference = { referenceId: 'r1', origin: 'original-demo', documentId: 'sj-math-2a-original', lessonId: 'sj2a-unit1-addsub', page: 1, startOffset: 0, endOffset: 10, quote: '进位加法', quoteDigest: 'd', trustLevel: 'untrusted-material' };
const command: LearningIntentCommand = { requestId: 'req-1', idempotencyKey: 'k1', identity, intent: 'problem', material, problemText: '47+28 怎么算？' };

describe('AiHybridEducationCenterAdapter', () => {
  beforeEach(() => {
    localStorage.clear();
    saveAiConfig({ enabled: true, port: '4610' });
    vi.restoreAllMocks();
    /* 代理不可用：fetch 直接拒绝，模拟未启动代理 */
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('connection refused')));
  });

  it('delegates bootstrap to local-demo and stays ok', async () => {
    const adapter = new AiHybridEducationCenterAdapter();
    const result = await adapter.bootstrap(identity);
    expect(result.ok).toBe(true);
  });

  it('skips enhancement entirely when runtime config disables AI', async () => {
    saveAiConfig({ enabled: false });
    const fetchSpy = vi.fn().mockRejectedValue(new TypeError('connection refused'));
    vi.stubGlobal('fetch', fetchSpy);
    const adapter = new AiHybridEducationCenterAdapter();
    const result = await adapter.routeLearningIntent(command);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.proposalId.startsWith('ai-')).toBe(false);
    }
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('falls back to local-demo lesson when proxy is unreachable', async () => {
    const adapter = new AiHybridEducationCenterAdapter();
    const result = await adapter.routeLearningIntent(command);
    expect(result.ok).toBe(true);
    if (result.ok) {
      /* 降级时保持 local-demo 原貌：无 ai- 前缀；limitation 为本地演示的诚实说明（非 AI 文案） */
      expect(result.data.proposalId.startsWith('ai-')).toBe(false);
      expect(result.data.limitation).not.toBeUndefined();
      expect(result.data.limitation).toContain('本地演示');
      expect(result.data.limitation).not.toContain('AI 生成');
    }
  });

  it('enhances lesson with proxy content when available', async () => {
    const aiBody = { ok: true, content: { objective: '理解进位加法', steps: [{ title: '看个位', body: '7+8=15 满 10', action: '圈出个位', visualCue: '标进 1' }, { title: '算十位', body: '4+2+1=7', action: '写十位', visualCue: '加进位' }, { title: '验算', body: '75-28=47', action: '倒算一遍', visualCue: '差加减数' }] } };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(aiBody), { status: 200, headers: { 'content-type': 'application/json' } })));
    const adapter = new AiHybridEducationCenterAdapter();
    const result = await adapter.routeLearningIntent(command);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.proposalId.startsWith('ai-lesson-')).toBe(true);
      expect(result.data.objective).toBe('理解进位加法');
      expect(result.data.steps).toHaveLength(3);
      expect(result.data.limitation).toContain('家长抽查复核');
    }
  });

  it('degrades grading to deterministic local-demo when proxy fails', async () => {
    const adapter = new AiHybridEducationCenterAdapter();
    const quiz = { quizId: 'sj2a-addsub-quiz-01', questions: [{ questionId: 's1', type: 'choice' as const, prompt: '47+28', options: ['75'], expectedAnswer: '75', rationale: '进位' }] };
    const exposures = [{ exposureId: 'e1', quizId: quiz.quizId, questionId: 's1', shownAt: '2026-09-08T08:00:00Z' }];
    const responses = [{ responseId: 'r1', exposureId: 'e1', rawAnswer: '75', reasoningSteps: [], elapsedMs: 1000, hintCount: 0, answeredAt: '2026-09-08T08:01:00Z' }];
    const result = await adapter.gradeQuiz({ requestId: 'req-2', idempotencyKey: 'k2', identity, quiz, exposures, responses, restatement: '两位数加法个位满十向十位进一。' });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.proposalId.startsWith('ai-')).toBe(false);
      expect(result.data.items[0].correct).toBe(true);
    }
  });

  /* 任意材料路径（#6/#8 切换）：local-pdf 等不再套用演示分数题，讲解+Quiz 全由 AI 生成 */
  const pdfMaterial: MaterialReference = { ...material, origin: 'local-pdf', documentId: 'doc-1', referenceId: 'r2', lessonId: undefined };
  const pdfCommand: LearningIntentCommand = { ...command, material: pdfMaterial, problemText: '这篇材料讲了植物向光生长的原因' };
  const aiQuizBody = { ok: true, content: { quizId: 'ai-generic-abc123', questions: [{ questionId: 'q1', type: 'choice', prompt: '植物向光生长主要因为？', options: ['生长素分布不均', '光合作用强', '水分多的缘故', '温度更高'], expectedAnswer: '生长素分布不均', rationale: '向光侧生长素少' }, { questionId: 'q2', type: 'steps', prompt: '说明向光生长的两个条件', expectedAnswer: '单侧光与生长素', rationale: '材料原文', keyPoints: [['单侧光', '一侧光'], ['生长素']], keyPointLabels: ['光照条件', '激素条件'] }] } };

  it('generates AI lesson + AI quiz for arbitrary material path', async () => {
    const aiLesson = { ok: true, content: { objective: '理解向光生长', steps: [{ title: '看现象', body: '植物弯向光源', action: '指出弯的方向', visualCue: '画一株弯苗' }, { title: '找原因', body: '生长素分布不均', action: '说出原因', visualCue: '标出两侧' }, { title: '再举例', body: '窗台植物案例', action: '举一个例子', visualCue: '窗台图' }] } };
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: unknown) => {
      const path = String(url);
      return Promise.resolve(new Response(JSON.stringify(path.includes('/quiz') ? aiQuizBody : aiLesson), { status: 200, headers: { 'content-type': 'application/json' } }));
    }));
    const adapter = new AiHybridEducationCenterAdapter();
    const result = await adapter.routeLearningIntent(pdfCommand);
    expect(result.ok).toBe(true);
    if (result.ok) {
      /* 链路如实打标 + Quiz 为 AI 生成（非演示分数题） */
      expect(result.data.executionMode).toBe('ai-enhanced');
      expect(result.data.quiz.quizId.startsWith('ai-generic-')).toBe(true);
      expect(result.data.quiz.questions[0].prompt).toContain('植物向光生长');
      expect(result.data.limitation).toContain('讲解与测验均由 AI');
    }
  });

  it('falls back entirely when quiz generation fails on arbitrary material (no fake-fraction mismatch)', async () => {
    const aiLesson = { ok: true, content: { objective: '理解向光生长', steps: [{ title: '看现象', body: '植物弯向光源', action: '指出弯的方向', visualCue: '画一株弯苗' }, { title: '找原因', body: '生长素分布不均', action: '说出原因', visualCue: '标出两侧' }, { title: '再举例', body: '窗台植物案例', action: '举一个例子', visualCue: '窗台图' }] } };
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: unknown) => {
      const path = String(url);
      if (path.includes('/quiz')) return Promise.resolve(new Response(JSON.stringify({ ok: false, error: 'upstream' }), { status: 502, headers: { 'content-type': 'application/json' } }));
      return Promise.resolve(new Response(JSON.stringify(aiLesson), { status: 200, headers: { 'content-type': 'application/json' } }));
    }));
    const adapter = new AiHybridEducationCenterAdapter();
    const result = await adapter.routeLearningIntent(pdfCommand);
    expect(result.ok).toBe(true);
    if (result.ok) {
      /* 全有或全无：Quiz 失败 → 整体回到本地基线（通用支架），不出现 AI 讲解配演示分数题的混搭 */
      expect(result.data.executionMode).toBe('local-demo');
      expect(result.data.quiz.quizId).toBe('fraction-quiz-01');
      expect(result.data.limitation).toContain('通用分步支架');
    }
  });

  it('marks ai-enhanced on grading proposals too', async () => {
    const aiBody = { ok: true, content: { items: [{ questionId: 's1', thinkingFeedback: '思路正确，进位处理到位。' }] } };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(aiBody), { status: 200, headers: { 'content-type': 'application/json' } })));
    const adapter = new AiHybridEducationCenterAdapter();
    const quiz = { quizId: 'sj2a-addsub-quiz-01', questions: [{ questionId: 's1', type: 'choice' as const, prompt: '47+28', options: ['75'], expectedAnswer: '75', rationale: '进位' }] };
    const exposures = [{ exposureId: 'e1', quizId: quiz.quizId, questionId: 's1', shownAt: '2026-09-08T08:00:00Z' }];
    const responses = [{ responseId: 'r1', exposureId: 'e1', rawAnswer: '75', reasoningSteps: [], elapsedMs: 1000, hintCount: 0, answeredAt: '2026-09-08T08:01:00Z' }];
    const result = await adapter.gradeQuiz({ requestId: 'req-3', idempotencyKey: 'k3', identity, quiz, exposures, responses, restatement: '个位满十进一。' });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.executionMode).toBe('ai-enhanced');
  });

  /* OpenMAIC 互动课堂路径（skipAiEnhance）：课件由本地 BFF 供给，AI 增强会被课件覆盖——
     此前该路径仍等最长 60s 的 AI 响应，用户感知为「点了生成没反应」。回归锁：跳过时绝不发 AI 请求。 */
  it('skips all AI calls when skipAiEnhance is set (OpenMAIC courseware-driven path)', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true, content: { objective: 'x', steps: [] } }), { status: 200, headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchSpy);
    const adapter = new AiHybridEducationCenterAdapter();
    const result = await adapter.routeLearningIntent({ ...command, skipAiEnhance: true });
    expect(result.ok).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
    if (result.ok) {
      /* 保持本地基线原貌：非 AI 前缀、非 ai-enhanced */
      expect(result.data.proposalId.startsWith('ai-')).toBe(false);
      expect(result.data.executionMode).not.toBe('ai-enhanced');
    }
  });
});
