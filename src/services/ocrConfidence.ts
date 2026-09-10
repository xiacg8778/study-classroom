export type OcrConfidenceTier = 'trusted' | 'suspect' | 'distrusted';

export interface OcrConfidenceGrade {
  tier: OcrConfidenceTier;
  headline: string;
  guidance: string;
}

/**
 * OCR 置信度分级（纯函数，便于单测与基线复测）。
 *
 * Tesseract 整图置信度 0-100：清晰印刷体通常 85+，整洁手写体多在 40-70，
 * 模糊照片与复杂公式会更低。阈值经基线样本实测校准（见 docs/QA_REPORT.md）。
 * 阈值只影响提示强度，不改变「识别文本一律按 untrusted 处理、须人工确认」的边界。
 */
export function gradeOcrConfidence(confidence: number, text: string): OcrConfidenceGrade {
  const effectiveLength = text.trim().length;
  if (effectiveLength < 4) {
    return {
      tier: 'distrusted',
      headline: '几乎未识别到文字',
      guidance: '本地引擎未从图片中读出有效内容。建议：确认照片对焦清晰、文字占画面比例足够；或直接在下方手动输入题目。',
    };
  }
  if (confidence >= 80) {
    return {
      tier: 'trusted',
      headline: '识别质量较好，仍需快速核对',
      guidance: '请快速核对数字、单位与题目条件后确认。',
    };
  }
  if (confidence >= 60) {
    return {
      tier: 'suspect',
      headline: '识别结果存疑，请重点核对易错处',
      guidance: '常见误识：手写体字形相近的数字/字母（如 1、l、7、9）、上下标、运算符（× 与 x、÷ 与 +）、单位与小数点。请逐段核对后再确认。',
    };
  }
  return {
    tier: 'distrusted',
    headline: '识别可信度低，建议逐字核对或手动输入',
    guidance: '本地引擎对手写体和复杂公式的识别能力有限。建议：逐字核对全部文字；或直接在下方手动输入题目；模糊照片可重新对焦拍摄后重试。',
  };
}
