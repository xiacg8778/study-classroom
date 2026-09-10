/* courseware-core.mjs 的类型声明（供 tests 引用；BFF 运行时直接用 .mjs 无需声明） */
/* 演示联合类型与 src/contracts/learning.ts 的 CoursewareDemo 对齐；新增演示类型必须两处同步 */
export type CoursewareDemo =
  | { kind: 'column-addition' | 'make-ten' | 'column-subtraction' | 'multiplication-groups'; a: number; b: number }
  | { kind: 'step-reveal'; steps: string[] }
  | { kind: 'keyword-mark'; sentence: string; keywords: string[] }
  | { kind: 'story-sequence'; events: string[] }
  | { kind: 'sentence-build'; base: string; addHow: string; addMetaphor?: string };
export declare const DEMO_KINDS: string[];
export declare const INTERACTION_TYPES: string[];
export declare function extractAddition(text: string | null | undefined): { a: number; b: number } | null;
/** 课程上下文：来自教材库学习包，供课程化模板与 LLM 提示词注入 */
export interface LessonContext {
  title: string;
  topic?: string;
  objective: string;
  outline?: string[];
  stepBriefs?: Array<{ title: string; body: string }>;
  steps?: Array<{ title: string; body: string; action?: string; visualCue?: string }>;
}
export declare function buildTemplateCourseware(opts: { lessonId?: string | null; problemText?: string | null; lesson?: LessonContext }): {
  coursewareId: string;
  title: string;
  objective: string;
  steps: Array<{ title: string; body: string; visualCue: string; demo: CoursewareDemo | null; interaction: { type: string; prompt: string } }>;
};
export declare function buildCoursewarePrompt(opts: { lessonId?: string | null; problemText?: string | null; lesson?: LessonContext }): string;
export interface ValidatedCourseware {
  title: string;
  objective: string;
  steps: Array<{ title: string; body: string; visualCue: string; demo: CoursewareDemo | null; interaction: { type: string; prompt: string } }>;
  demo: unknown;
}
export declare function validateCourseware(content: unknown): ValidatedCourseware | null;
