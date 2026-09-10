/**
 * OpenMAICAdapter —— 组件 37（互动课堂）的 EducationCenterAdapter 实现（本地 runtime）。
 *
 * 出 HOLD 五项前置的客户端对应：
 * - callback：课件互动经 InteractiveSession 逐条回传（seq 单调 + 幂等键 + 版本）
 * - 乱序/重复/旧版本：BFF 409 拒绝时本适配器将互动队列重置于当前 ack 状态
 * - kernel closure：本适配器只产出课件式微课堂（lesson proposal），调度仍全由
 *   教育中心既有链路（gradeQuiz/close/prepare）完成，绝不返回调度决策
 * - 24 prepare：互动记录作为 evidenceRefs 附加进 proposal，走既有 close→prepare→commit 链
 * - 回滚：rollbackInteractive() 显式终止会话并作废互动，交互状态不留半套
 *
 * 非课件路径（gradeQuiz/closeLearningUnit/prepareRegistration）直接委托 AI 混合适配器：
 * OpenMAIC 只增强「学」的表现层，不改「判」的任何逻辑。
 */
import type { AdapterResult } from '../../contracts/common';
import type { EducationCenterAdapter } from '../ports/EducationCenterAdapter';
import type { LearningIntentCommand, CloseUnitCommand, CloseUnitProposal, MicroLessonProposal } from '../../contracts/learning';
import type { GradeQuizCommand } from '../../contracts/quiz';
import type { PrepareRegistrationCommand, RegistrationProposal } from '../../contracts/registration';
import type { IdentityContext } from '../../contracts/identity';
import { AiHybridEducationCenterAdapter } from '../ai-hybrid/AiHybridEducationCenterAdapter';
import { loadOpenmaicConfig } from '../../services/openmaicRuntimeConfig';

export interface OpenmaicCoursewareStep {
  title: string;
  body: string;
  visualCue: string;
  interaction: { type: string; prompt: string };
  demo?: import('../../contracts/learning').CoursewareDemo;
}
export interface OpenmaicCourseware {
  coursewareId: string;
  title: string;
  objective: string;
  steps: OpenmaicCoursewareStep[];
  schedulerAuthority: 'kernel-10';
  runtimeNote: string;
}

interface OpenCallbackPayload { sessionToken: string; seq: number; idempotencyKey: string; baseContextVersion: number; interaction: { type: string; prompt?: string; answer?: string }; }
/** 课件会话的可持久化状态：随会话快照保存，刷新后恢复（否则互动 callback 会因内存会话丢失而失败） */
export interface OpenmaicSessionState { sessionToken: string; baseContextVersion: number; expectedSeq: number; coursewareId: string; }

export class OpenMAICAdapter implements EducationCenterAdapter {
  private readonly fallback: AiHybridEducationCenterAdapter;
  /* 会话状态：内存持有，刷新丢失（课件会话非学习证据，不需跨刷新恢复） */
  private session: { sessionToken: string; baseContextVersion: number; expectedSeq: number; coursewareId: string } | null = null;

  constructor(fallback?: AiHybridEducationCenterAdapter) {
    this.fallback = fallback ?? new AiHybridEducationCenterAdapter();
  }

  private bffBase(): string {
    return `http://127.0.0.1:${loadOpenmaicConfig().port}`;
  }

  public async bootstrap(identity: IdentityContext) {
    return this.fallback.bootstrap(identity);
  }

  /** routeLearningIntent：请求时实时判定开关（装配期快照会过期）；启用且 BFF 正常开课 → 课件驱动；否则回退 AI 混合适配器 */
  public async routeLearningIntent(command: LearningIntentCommand): Promise<AdapterResult<MicroLessonProposal>> {
    const config = loadOpenmaicConfig();
    if (!config.enabled) return this.fallback.routeLearningIntent(command);
    let sessionToken: string | undefined;
    let courseware: OpenmaicCourseware | undefined;
    let baseVersion = command.identity.baseContextVersion;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(`${this.bffBase()}/v1/lessons:open`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          lessonId: command.material?.lessonId ?? null,
          learnerId: command.identity.learnerId,
          baseContextVersion: command.identity.baseContextVersion,
          problemText: command.problemText,
        }),
        signal: controller.signal,
      });
      const payload = await response.json().catch(() => null) as { ok?: boolean; sessionToken?: string; currentVersion?: number; courseware?: OpenmaicCourseware } | null;
      /* 课件号必须存在：缺失说明 BFF 版本过旧或返回结构异常，视为本次开课失败（回退），不让 undefined 混入 proposalId */
      if (!payload?.ok || !payload.courseware || !payload.courseware.coursewareId || !payload.sessionToken) {
        console.warn('[openmaic] lessons:open 返回不完整（缺 coursewareId/sessionToken），回退 AI 微课堂', payload);
        return this.fallback.routeLearningIntent(command);
      }
      sessionToken = payload.sessionToken;
      courseware = payload.courseware;
      baseVersion = payload.currentVersion ?? command.identity.baseContextVersion;
      const cw: OpenmaicCourseware = courseware;
      this.session = { sessionToken, baseContextVersion: baseVersion, expectedSeq: 1, coursewareId: cw.coursewareId };
      const baseline = await this.fallback.routeLearningIntent({ ...command, idempotencyKey: `${command.idempotencyKey}-omc`, skipAiEnhance: true });
      if (!baseline.ok) return baseline;
      /* 课件驱动：objective 与三步来自课件；保留原 Quiz（判定仍走本地链） */
      return { ok: true, data: {
        ...baseline.data,
        proposalId: `omc-lesson-${cw.coursewareId}`,
        objective: cw.objective,
        steps: cw.steps.map((step, index) => ({ stepId: `omc-${cw.coursewareId}-${index + 1}`, title: step.title, body: step.body, action: step.interaction.prompt, visualCue: step.visualCue })),
        learnerQuestion: command.problemText,
        interactive: {
          sessionNote: `课件会话 ${sessionToken}（课件号 ${cw.coursewareId}）`,
          interactions: cw.steps.map((step) => ({ kind: step.interaction.type as 'observe-confirm' | 'attempt-confirm' | 'summarize-input', prompt: step.interaction.prompt })),
          /* 完整透传 demo（含 step-reveal 的 steps 文案）：此前强转为加法类型丢失字段，step-reveal 演示到前端即崩溃 */
          demos: cw.steps.map((step) => (step.demo ? step.demo : null)),
        },
        limitation: `互动课件由 OpenMAIC 本地运行时生成（组件 37 本地落地，课件号 ${cw.coursewareId}）；互动记录经 callback 回传本机运行时，仅作学习证据候选，掌握度与下一课仍由本地判定链生成。${baseline.data.limitation ?? ''}`,
      }, meta: { ...baseline.meta, schemaVersion: 'lesson@omc-1.0.0' } };
    } catch {
      return this.fallback.routeLearningIntent(command);
    } finally {
      clearTimeout(timer);
    }
  }

  /** 互动回传（callback 前置）：seq 单调、幂等键、版本三重校验由 BFF 执行；409 时重置队列 */
  public async sendInteraction(interaction: { type: string; answer?: string }): Promise<{ ok: boolean; ack?: string; detail?: string }> {
    if (!this.session) return { ok: false, detail: '课件会话已失效（如刚刷新页面且为旧版快照）。重新生成一次微课堂即可恢复互动记录。' };
    const payload: OpenCallbackPayload = {
      sessionToken: this.session.sessionToken,
      seq: this.session.expectedSeq,
      idempotencyKey: crypto.randomUUID(),
      baseContextVersion: this.session.baseContextVersion,
      interaction,
    };
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(`${this.bffBase()}/v1/interactive/callback`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload), signal: controller.signal,
      });
      const data = await response.json().catch(() => null) as { ok?: boolean; ack?: string; error?: string; detail?: string } | null;
      if (data?.ok && data.ack) {
        this.session.expectedSeq += 1;
        return { ok: true, ack: data.ack };
      }
      if (response.status === 409) {
        /* 乱序/旧版本：保守放弃本地会话（下次生成重新开课），不留半状态 */
        this.session = null;
        return { ok: false, detail: data?.error === 'VERSION_STALE' ? '课件会话版本过期，已安全重置' : '互动顺序异常，已安全重置' };
      }
      return { ok: false, detail: data?.detail ?? '互动回传失败' };
    } catch {
      return { ok: false, detail: '无法连接 OpenMAIC 运行时' };
    } finally {
      clearTimeout(timer);
    }
  }

  /** 回滚（前置 5）：显式终止会话；BFF 作废全部互动，本地状态清空 */
  public async rollbackInteractive(): Promise<{ ok: boolean; voided?: number; detail?: string }> {
    if (!this.session) return { ok: true, voided: 0 };
    const token = this.session.sessionToken;
    this.session = null;
    try {
      const response = await fetch(`${this.bffBase()}/v1/lessons:rollback`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sessionToken: token }),
      });
      const data = await response.json().catch(() => null) as { ok?: boolean; voidedCallbacks?: number } | null;
      return data?.ok ? { ok: true, voided: data.voidedCallbacks } : { ok: false, detail: '回滚请求失败' };
    } catch {
      return { ok: true, voided: 0 }; /* 本地状态已清，BFF 侧会话随下次覆盖，无半状态 */
    }
  }

  public get activeSessionCoursewareId(): string | null { return this.session?.coursewareId ?? null; }
  public getInteractiveSessionState(): OpenmaicSessionState | null { return this.session ? { ...this.session } : null; }
  public restoreInteractiveSession(state: OpenmaicSessionState): void { this.session = { ...state }; }

  /* 判定链三方法：一律委托 AI 混合适配器（kernel closure——OpenMAIC 不参与判定与调度） */
  public async gradeQuiz(command: GradeQuizCommand) { return this.fallback.gradeQuiz(command); }
  public async closeLearningUnit(command: CloseUnitCommand): Promise<AdapterResult<CloseUnitProposal>> { return this.fallback.closeLearningUnit(command); }
  public async prepareRegistration(command: PrepareRegistrationCommand): Promise<AdapterResult<RegistrationProposal>> { return this.fallback.prepareRegistration(command); }
}
