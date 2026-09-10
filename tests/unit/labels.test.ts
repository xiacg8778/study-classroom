import { describe, expect, it } from 'vitest';
import { evidenceKindLabel, masteryLabel, pathLabel, errorCauseLabel } from '../../src/contracts/labels';

/* 回归锁：UI 展示一律经 labels 映射，不允许内部裸码直达用户（labels.ts 顶部纪律）。
   背景：下一课候选页曾把 ev-response-o1、ev-restatement-fnv1a-35992085 这类内部契约 ID
   直接拼进「证据」栏，用户完全看不懂；L3 黑话同理。 */
describe('internal code → user-facing label mapping', () => {
  it('evidence kinds map to plain Chinese, unknown falls back to readable text', () => {
    expect(evidenceKindLabel('response')).toBe('答题记录');
    expect(evidenceKindLabel('restatement')).toBe('向监护人复述');
    expect(evidenceKindLabel('transfer')).toBe('新情境迁移');
    expect(evidenceKindLabel('ev-response-o1')).toBe('学习记录'); /* 未知码不给裸码 */
  });

  it('mastery/path/error-cause labels contain no bare L/P/R codes as full value', () => {
    for (const code of ['L1', 'L2', 'L3', 'L4']) {
      const label = masteryLabel(code);
      expect(label.length).toBeGreaterThan(2); /* 不是裸码 */
      expect(label).toContain(code); /* 括注保留可追溯性 */
    }
    expect(pathLabel('P5')).toBe('同链推进下一节');
    expect(errorCauseLabel('R10')).toBe('注意力或状态波动');
  });
});
