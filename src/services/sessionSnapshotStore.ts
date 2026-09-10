/**
 * 会话进度快照（sessionStorage，仅当前标签页，随「退出会话」清除）。
 *
 * 解决：刷新后只恢复到「选好教材」，微课堂第几步/复述内容/Quiz 作答/批改收单结果全丢，从第一步重来。
 *
 * 边界（与既有隐私边界一致，不扩大）：
 * - 存：当前学习环节、步骤序号、复述文本、Quiz 作答、批改/收单候选——这些本就存在于当前标签页内存中。
 * - 不存：PDF 字节、OCR 草稿（维持现状不恢复）；身份仅 learnerId 指针用于匹配校验。
 * - 生命周期：退出会话（exit → sessionStorage.clear）与切换学习者时清除；刷新时恢复。
 * - 恢复校验：学习者或课程不一致、环节数据不完整时一律降级为「从头开始本课」，绝不半套状态混搭。
 */
import type { SessionPhase } from '../state/learningSessionMachine';
import type { MicroLessonProposal, CloseUnitProposal } from '../contracts/learning';
import type { GradingProposal } from '../contracts/evidence';
import type { RegistrationProposal } from '../contracts/registration';

export type StoredQuizAnswers = Record<string, { value: string; hints: number }>;

export interface SessionSnapshot {
  learnerId: string;
  textbookId: string;
  lessonId: string;
  phase: SessionPhase;
  currentStep: number;
  restatement: string;
  lesson?: MicroLessonProposal;
  grading?: GradingProposal;
  close?: CloseUnitProposal;
  registration?: RegistrationProposal;
  registrationReceipt?: { commitId: string; status: 'committed' };
  registrationError?: string;
  /** OpenMAIC 课件会话状态：刷新后恢复，否则互动 callback 因内存会话丢失失败 */
  omcSession?: { sessionToken: string; baseContextVersion: number; expectedSeq: number; coursewareId: string };
  quizAnswers?: StoredQuizAnswers;
  savedAt: number;
}

const KEY = 'paper-desk.session-snapshot';

export function saveSessionSnapshot(snapshot: Omit<SessionSnapshot, 'savedAt'>): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ ...snapshot, savedAt: Date.now() }));
  } catch {/* 存储不可用时静默降级：当次会话仍完整可用，仅刷新不恢复进度 */}
}

export function readSessionSnapshot(): SessionSnapshot | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SessionSnapshot;
    if (!parsed || typeof parsed.savedAt !== 'number' || !parsed.lessonId || !parsed.phase) return null;
    return parsed;
  } catch { return null; }
}

export function clearSessionSnapshot(): void {
  try { sessionStorage.removeItem(KEY); } catch {/* 同上 */}
}

/**
 * 快照可用性校验：返回可安全恢复到的相位；数据不完整时返回 material_ready（从头开始本课）。
 * 规则：每个相位依赖的最小数据集必须齐备，缺一件就整体降级，不做半套恢复。
 */
export function resolveRestorablePhase(snapshot: SessionSnapshot): SessionPhase {
  const needsLesson: SessionPhase[] = ['lesson_active', 'restatement_needed', 'quiz_active', 'grading'];
  const needsGrading: SessionPhase[] = ['review', 'closing', 'next_proposed'];
  if (snapshot.phase === 'generating') return 'material_ready';
  if (needsLesson.includes(snapshot.phase) && !snapshot.lesson) return 'material_ready';
  if (needsGrading.includes(snapshot.phase) && (!snapshot.lesson || !snapshot.grading)) return 'material_ready';
  if (snapshot.phase === 'next_proposed' && !snapshot.close) return 'material_ready';
  if (!needsLesson.includes(snapshot.phase) && !needsGrading.includes(snapshot.phase) && snapshot.phase !== 'material_ready') return 'material_ready';
  return snapshot.phase;
}
