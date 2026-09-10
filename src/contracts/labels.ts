/* 内部码 → 界面中文标签映射。
   内部码本身是对外契约（日志/AI 协议/宿主登记保留原码），UI 展示一律经此映射，不允许裸码直达用户。 */
import type { ErrorCause } from './wrongQuestion';

export const ERROR_CAUSE_LABELS: Record<ErrorCause, string> = {
  R1: '概念理解偏差',
  R2: '方法选择不当',
  R3: '计算步骤出错',
  R4: '数位与进退位处理失误',
  R5: '口诀或事实记忆偏差',
  R6: '单位或分数单位混淆',
  R7: '审题不完整',
  R8: '步骤跳跃或过程不完整',
  R9: '缺少检验习惯',
  R10: '注意力或状态波动',
  R11: '新情境迁移困难',
  undetermined: '证据不足，暂无法判断',
};
export const errorCauseLabel = (code: string): string => ERROR_CAUSE_LABELS[code as ErrorCause] ?? code;

export const PATH_LABELS: Record<string, string> = {
  P1: '概念重讲',
  P2: '例题示范',
  P3: '同结构变式练习',
  P4: '分步支架引导',
  P5: '同链推进下一节',
  P6: '口诀记忆巩固',
  P7: '验算习惯训练',
  P8: '审题训练',
  P9: '短任务状态调整',
};
export const pathLabel = (code: string): string => PATH_LABELS[code] ?? code;

export const MASTERY_LABELS: Record<string, string> = {
  L1: '需重点巩固（L1）',
  L2: '初步掌握（L2）',
  L3: '掌握良好（L3）',
  L4: '掌握扎实，有迁移证据（L4）',
  undetermined: '暂无法判断',
};
export const masteryLabel = (code: string): string => MASTERY_LABELS[code] ?? code;

export const EVIDENCE_STATUS_LABELS: Record<string, string> = {
  'single-observation': '仅单次观察',
  'initial-judgment': '初步判断',
  'repeated-validation': '多次验证',
  confirmed: '已确认',
  insufficient: '证据不足',
};
export const evidenceStatusLabel = (code: string): string => EVIDENCE_STATUS_LABELS[code] ?? code;

/* 证据事件 → 用户可读描述（evidenceId 是内部契约，仅供登记/日志，禁止裸码直达 UI） */
export const EVIDENCE_KIND_LABELS: Record<string, string> = {
  response: '答题记录',
  restatement: '向监护人复述',
  transfer: '新情境迁移',
};
export const evidenceKindLabel = (kind: string): string => EVIDENCE_KIND_LABELS[kind] ?? '学习记录';
