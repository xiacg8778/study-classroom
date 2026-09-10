/**
 * 课程上下文覆盖完整性（回归根因：语文课降级出数学竖式）。
 *
 * 事故链：LESSON_CONTEXTS（ai-proxy.mjs）只覆盖 19 节数学课 → 语文课 /api/lesson-context 返回
 * lesson-not-found → BFF template fallback 拿不到 lesson → legacy 分支无条件套 {a:47,b:28} 加法
 * 模板 → 语文课课件出现「47+28 竖式计算」。
 *
 * 本测试从源文件静态提取两侧清单做对齐检查（不启动 ai-proxy 进程）：
 * - 左侧：教材实际课程（localDemoFixtures.ts 的 lessonId）
 * - 右侧：ai-proxy 上下文表（LESSON_CONTEXTS 的 key）
 * 任一课程缺上下文即失败——新增课程时必须同步补上下文，否则该课降级必然错配。
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(__dirname, '../..');
const read = (p: string) => readFileSync(resolve(root, p), 'utf-8');

const fixturesLessonIds = (): string[] => {
  const src = read('src/adapters/local-demo/localDemoFixtures.ts');
  return [...new Set([...src.matchAll(/lessonId:'([a-z0-9-]+)'/g)].map((m) => m[1]))].sort();
};

const contextKeys = (): string[] => {
  const src = read('scripts/ai-proxy.mjs');
  const start = src.indexOf('const LESSON_CONTEXTS');
  const end = src.indexOf('\n};', start);
  const block = src.slice(start, end);
  return [...new Set([...block.matchAll(/^ {2}'([^']+)':/gm)].map((m) => m[1]))].sort();
};

describe('课程上下文覆盖完整性（防降级错配）', () => {
  it('教材每一课都能在 ai-proxy 上下文表取到上下文', () => {
    const lessons = fixturesLessonIds();
    const contexts = new Set(contextKeys());
    const missing = lessons.filter((id) => !contexts.has(id));
    expect(missing, `以下课程缺上下文，其降级课件必然错配：${missing.join('、')}`).toEqual([]);
  });

  it('上下文表不含教材里不存在的孤儿课程（防拼写漂移）', () => {
    const lessons = new Set(fixturesLessonIds());
    const orphans = contextKeys().filter((id) => !lessons.has(id));
    expect(orphans, `以下上下文条目在教材中不存在：${orphans.join('、')}`).toEqual([]);
  });

  it('语文课上下文形状完整（title/objective/三条 stepBriefs 齐全）', () => {
    const src = read('scripts/ai-proxy.mjs');
    const start = src.indexOf('const LESSON_CONTEXTS');
    const end = src.indexOf('\n};', start);
    const block = src.slice(start, end);
    const ywEntries = [...block.matchAll(/^ {2}'(yw[^']+)':\s*\{([\s\S]*?)\},\s*$/gm)];
    expect(ywEntries.length).toBeGreaterThanOrEqual(18);
    for (const [, id, body] of ywEntries) {
      expect(body, `${id} 缺 objective`).toMatch(/objective:/);
      expect(body, `${id} 缺 stepBriefs`).toMatch(/stepBriefs:/);
      const briefCount = (body.match(/\{ title:/g) ?? []).length;
      expect(briefCount, `${id} 的 stepBriefs 应恰好 3 条，实际 ${briefCount}`).toBe(3);
    }
  });
});
