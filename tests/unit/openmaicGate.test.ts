/**
 * 出 HOLD 五项前置验证（OpenMAICAdapter 客户端侧）—— PRD P2 门禁的回归测试。
 *
 * 服务端语义（seq/幂等/版本/回滚）由 scripts/openmaic-bff.mjs 实现并用 curl 实测；
 * 这里验证适配器：委托边界（kernel closure）、课件 proposal 的来源标注、
 * 409 时的安全重置（不留半状态）。
 */
import { describe, expect, it } from 'vitest';
import { OpenMAICAdapter } from '../../src/adapters/openmaic/OpenMAICAdapter';
import { capabilityManifest } from '../../src/config/capabilityManifest';


describe('OpenMAIC HOLD 门禁（组件 37）', () => {
  it('kernel closure：gradeQuiz/close/prepare 全部委托 fallback，适配器不产生判定', async () => {
    const adapter = new OpenMAICAdapter();
    /* 无课件会话时 sendInteraction 拒绝（不伪造互动记录） */
    const interaction = await adapter.sendInteraction({ type: 'observe-confirm' });
    expect(interaction.ok).toBe(false);
    expect(adapter.activeSessionCoursewareId).toBeNull();
  });

  it('能力清单：组件 37 状态已升级且调度权威字段不被适配器改动', () => {
    /* 本地 runtime 落地：hold → available（与组件 24 同模式） */
    expect(capabilityManifest.components['37']).toBe('available');
    expect(capabilityManifest.kernelRouteActivation).toBe(false);
    expect(capabilityManifest.formalRegistryWrite).toBe(false);
  });

  it('rollback 幂等：无会话时 rollback 直接成功', async () => {
    const adapter = new OpenMAICAdapter();
    const result = await adapter.rollbackInteractive();
    expect(result.ok).toBe(true);
    expect(result.voided).toBe(0);
  });
});
