/**
 * RealHostCommitAdapter —— 宿主 BFF（本地登记服务）的 Commit 实现。
 *
 * 与 UnavailableHostCommitAdapter 的关系：运行时按 hostConfig（localStorage）选择；
 * BFF 不可用时 commit 返回 typed error（不静默假成功），availability 探活供 UI 显示。
 *
 * 校验边界与文档一致：真实提交只可能发生在 BFF 端（校验 Schema、幂等键、归属、版本）；
 * 本适配器只做转发与回执校验，不本地伪造 committed receipt。
 */
import type { AdapterResult } from '../../contracts/common';
import type { RegistrationProposal } from '../../contracts/registration';
import type { CommitAvailability, CommitReceipt, HostCommitPort } from '../ports/HostCommitPort';
import { loadHostConfig } from '../../services/hostRuntimeConfig';

export class RealHostCommitAdapter implements HostCommitPort {
  public availability(): CommitAvailability {
    return 'available';
  }

  public async commit(proposal: RegistrationProposal): Promise<AdapterResult<CommitReceipt>> {
    const config = loadHostConfig();
    const requestId = `host-commit-${proposal.proposalId}`;
    const meta = { requestId, correlationId: requestId, schemaVersion: 'commit@1.0.0' };
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(`http://127.0.0.1:${config.port}/v1/registrations:commit`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(proposal),
        signal: controller.signal,
      });
      const payload = await response.json().catch(() => null) as { ok?: boolean; receipt?: CommitReceipt; detail?: string } | null;
      if (!payload || payload.ok !== true || !payload.receipt || payload.receipt.status !== 'committed' || !payload.receipt.commitId) {
        return { ok: false, error: { code: 'HOST_COMMIT_REJECTED', message: payload?.detail ? `宿主拒绝登记：${payload.detail}` : '宿主未返回有效回执。', retryable: response.status >= 500, requestId, correlationId: requestId }, meta };
      }
      return { ok: true, data: payload.receipt, meta };
    } catch (error) {
      const aborted = error instanceof DOMException && error.name === 'AbortError';
      return { ok: false, error: { code: 'HOST_COMMIT_UNREACHABLE', message: aborted ? '宿主服务响应超时（15 秒），候选仍未提交。' : '无法连接宿主服务，候选尚未提交。', retryable: true, requestId, correlationId: requestId }, meta };
    } finally {
      clearTimeout(timer);
    }
  }
}
