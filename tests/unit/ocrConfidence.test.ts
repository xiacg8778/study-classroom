import { describe, expect, it } from 'vitest';
import { gradeOcrConfidence } from '../../src/services/ocrConfidence';

describe('gradeOcrConfidence', () => {
  it('marks high-confidence long text as trusted', () => {
    expect(gradeOcrConfidence(92, '商店运来苹果 128 千克。').tier).toBe('trusted');
  });

  it('rejects trusted tier for near-empty text even at high confidence', () => {
    // 空文本/残片不允许走"较好"提示，避免误导向
    expect(gradeOcrConfidence(95, '  ').tier).toBe('distrusted');
    expect(gradeOcrConfidence(95, '12').tier).toBe('distrusted');
  });

  it('marks mid-band as suspect with actionable guidance', () => {
    const grade = gradeOcrConfidence(68, 'Solve: 12 + 7 x 3 = ?');
    expect(grade.tier).toBe('suspect');
    expect(grade.guidance).toContain('手写体');
    expect(grade.guidance).toContain('运算符');
  });

  it('marks low band as distrusted with manual-entry advice', () => {
    const grade = gradeOcrConfidence(30, '难认的手写片段');
    expect(grade.tier).toBe('distrusted');
    expect(grade.guidance).toContain('手动输入');
  });

  it('keeps boundary behavior stable at thresholds', () => {
    expect(gradeOcrConfidence(80, '有效长度的识别文本').tier).toBe('trusted');
    expect(gradeOcrConfidence(79.9, '有效长度的识别文本').tier).toBe('suspect');
    expect(gradeOcrConfidence(60, '有效长度的识别文本').tier).toBe('suspect');
    expect(gradeOcrConfidence(59.9, '有效长度的识别文本').tier).toBe('distrusted');
  });
});
