/**
 * 朗读覆盖完整性（回归根因：教材正文没有朗读）。
 *
 * 事故链：TTS 只加在「生成课件之后」的五个环节 → 用户打开课先看到的教材正文反而没有朗读
 * → 连续两轮反馈「朗诵功能并没有看到 / 哪里有朗读」。
 *
 * 本测试静态检查所有「含正文的阅读面」都接入了朗读能力：
 * 任一阅读面缺朗读即失败——新增阅读界面时必须同步接入，否则该界面等于对不识字的孩子不可用。
 */
import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(__dirname, '../..');

/* 含正文、孩子需要「听」的阅读面（相对 webapp 根）。新增此类界面请一并加到这里。 */
const READING_SURFACES = [
  ['src/features/reader/DemoTextbookReader.tsx', '教材正文'],
  ['src/features/reader/PdfReader.tsx', '本地 PDF 阅读'],
  ['src/features/lesson/MicroLesson.tsx', '微课堂讲解'],
  ['src/features/lesson/RestatementCheck.tsx', '复述提示'],
  ['src/features/quiz/QuizPanel.tsx', 'Quiz 题目'],
  ['src/features/quiz/GradingReview.tsx', '批改反馈'],
  ['src/features/next-lesson/NextLessonProposal.tsx', '下一课任务'],
  ['src/features/wrong-questions/WrongQuestionCandidateCard.tsx', '错题卡'],
] as const;

describe('朗读覆盖完整性（每个阅读面都必须可听）', () => {
  for (const [path, label] of READING_SURFACES) {
    it(`${label}（${path}）已接入朗读`, () => {
      const full = resolve(root, path);
      expect(existsSync(full), `${path} 不存在（是否已改名或移动？）`).toBe(true);
      const src = readFileSync(full, 'utf-8');
      /* 两种合法接入方式：通用朗读条 TtsControls，或组件自带 speech 调用（如 PdfReader） */
      const hasTts = /TtsControls/.test(src) || /speech\.(speak|speakSegments)/.test(src);
      expect(hasTts, `${label} 没有朗读能力：低年级学生无法自主阅读该界面内容`).toBe(true);
    });
  }

  it('TtsControls 默认开启自动朗读（低年级识字量不足，朗读是刚需非装饰）', () => {
    const src = readFileSync(resolve(root, 'src/features/lesson/TtsControls.tsx'), 'utf-8');
    /* readAutoPref：无存储记录时必须返回 true（默认开），仅显式关闭过才保持关 */
    expect(src).toMatch(/raw===null\?true/);
  });
});
