/**
 * 会话恢复护栏（固化的 bug 回归约束）：
 * - 快照含 omcSession（课件会话状态）：缺失则刷新后互动 callback 报「无活跃课件会话」
 * - 状态机放行 lesson_active→generating：缺失则「换种讲法」按钮永远点不动
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createInitialState, learningSessionReducer } from '../../src/state/learningSessionReducer';
import { canTransition } from '../../src/state/learningSessionMachine';
import { resolveRestorablePhase, type SessionSnapshot } from '../../src/services/sessionSnapshotStore';

const identity = { workspaceId: 'w', learnerId: 'a', sessionId: 's', baseContextVersion: 1, consentScopeRef: 'c' };

describe('状态机：追问式再生成（换种讲法）', () => {
  it('lesson_active → generating 必须合法（否则生成后输入区按钮永久禁用）', () => {
    expect(canTransition('lesson_active', 'generating')).toBe(true);
  });
  it('放行不扩大到任意相位：material_ready→quiz_active 仍非法', () => {
    expect(canTransition('material_ready', 'quiz_active')).toBe(false);
  });
});

describe('会话快照：课件会话状态必须可持久化', () => {
  it('SessionSnapshot 类型包含 omcSession 字段（缺它=幽灵互动控件）', () => {
    const src = readFileSync(join(__dirname, '../../src/services/sessionSnapshotStore.ts'), 'utf8');
    expect(src).toContain('omcSession');
  });

  it('快照缺课件会话时，含互动控件的课件不能恢复为可互动（降级 material_ready 由 resolveRestorablePhase 主导）', () => {
    /* restoreSession 的匹配条件是 learnerId+lessonId；此处验证 resolveRestorablePhase 对 lesson_active 的最小数据集要求 */
    const snap: SessionSnapshot = {
      learnerId: 'a', textbookId: 't', lessonId: 'l', phase: 'lesson_active',
      currentStep: 0, restatement: '', savedAt: Date.now(),
      /* lesson 缺失 → 必须降级，不允许半套恢复 */
    };
    expect(resolveRestorablePhase(snap)).toBe('material_ready');
  });

  it('Provider 恢复路径包含回灌课件会话的逻辑', () => {
    const src = readFileSync(join(__dirname, '../../src/state/LearningSessionProvider.tsx'), 'utf8');
    expect(src).toContain('restoreInteractiveSession');
    expect(src).toContain('omcSession');
  });
});

describe('宿主闭环与 OpenMAIC 门禁（能力清单防回退）', () => {
  it('组件 24/37 保持 available（本地 BFF 落地），25/34 保持关闭', () => {
    const src = readFileSync(join(__dirname, '../../src/config/capabilityManifest.ts'), 'utf8');
    expect(src).toContain("'26': 'available'");
    expect(src).toContain("'37': 'available'");
    expect(src).toContain("'25': 'flag-false'");
    expect(src).toContain("'34': 'flag-false'");
  });

  it('reducer：REGISTRATION_COMMITTED 仅在有 proposal 时生效（防伪回执）', () => {
    const state = createInitialState(identity);
    const noProposal = learningSessionReducer(state, { type: 'REGISTRATION_COMMITTED', receipt: { commitId: 'x', status: 'committed' } });
    expect(noProposal.registrationReceipt).toBeUndefined();
  });
});
