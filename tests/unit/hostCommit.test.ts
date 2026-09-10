import { describe, expect, it } from 'vitest';
import { RealHostCommitAdapter } from '../../src/adapters/host-bff/RealHostCommitAdapter';
import { UnavailableHostCommitAdapter } from '../../src/adapters/local-demo/UnavailableHostCommitAdapter';
import type { RegistrationProposal } from '../../src/contracts/registration';

const baseProposal: RegistrationProposal = {
  schemaVersion: 'registration-proposal@1.0.0',
  proposalId: 'reg-1',
  workspaceId: 'ws',
  learnerId: 'stu-001',
  sessionId: 's1',
  baseContextVersion: 0,
  evidenceCursor: 'cur-1',
  promptBundleRef: 'bundle-1',
  idempotencyKey: 'idem-1',
  persistenceIntent: 'propose',
  mutations: [{ entity: 'wrong-question', operation: 'propose', referenceId: 'w-1' }],
};

describe('UnavailableHostCommitAdapter（未连接兜底）', () => {
  it('availability 为 unavailable 且 commit 返回 typed error', async () => {
    const adapter = new UnavailableHostCommitAdapter();
    expect(adapter.availability()).toBe('unavailable');
    const result = await adapter.commit(baseProposal);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('HOST_COMMIT_UNAVAILABLE');
  });
});

describe('RealHostCommitAdapter（宿主 BFF 客户端）', () => {
  it('availability 为 available（真实可用性由 commit 时探活决定）', () => {
    expect(new RealHostCommitAdapter().availability()).toBe('available');
  });

  it('BFF 离线时返回 HOST_COMMIT_UNREACHABLE（不假成功）', async () => {
    /* 使用一个几乎不可能有服务的端口 */
    const { saveHostConfig } = await import('../../src/services/hostRuntimeConfig');
    saveHostConfig({ enabled: true, port: '49999' });
    const adapter = new RealHostCommitAdapter();
    const result = await adapter.commit(baseProposal);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(['HOST_COMMIT_UNREACHABLE', 'HOST_COMMIT_REJECTED']).toContain(result.error.code);
    saveHostConfig({ port: '4630' });
  });
});

describe('提交回执的防伪（reducer 契约层面）', () => {
  it('receipt 必须含 commitId 与 committed 状态才有效（RealHostCommitAdapter 校验）', async () => {
    /* 模拟 BFF 返回坏回执：用不可达端口 + mocked fetch 验证拒绝路径 */
    const { saveHostConfig } = await import('../../src/services/hostRuntimeConfig');
    saveHostConfig({ enabled: true, port: '4630' });
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => new Response(JSON.stringify({ ok: true, receipt: { commitId: '', status: 'committed' } }), { status: 200 })) as typeof fetch;
    try {
      const result = await new RealHostCommitAdapter().commit(baseProposal);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe('HOST_COMMIT_REJECTED');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
