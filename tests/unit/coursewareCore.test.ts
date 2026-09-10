/**
 * 课件内容校验器护栏（courseware-core.mjs）。
 *
 * 固化以下 bug 的回归约束：
 * - LLM 幻觉防护：互动类型/演示类型白名单、步数必须 3、数字范围——任何字段不合法整体拒绝
 * - 按类型数据约束：退位减法 a>b、乘法表内 2-9、step-reveal 至少 2 句
 * - demo 挂载位：step 字段指定挂到哪一步
 */
import { describe, expect, it } from 'vitest';
import {
  extractAddition,
  buildTemplateCourseware,
  buildCoursewarePrompt,
  validateCourseware,
} from '../../scripts/lib/courseware-core.mjs';

const okSteps = () => [
  { title: '看一看', body: '观察演示', visualCue: '演示区', interaction: { type: 'observe-confirm', prompt: '看清楚了吗' } },
  { title: '试一试', body: '自己试一次', visualCue: '练习区', interaction: { type: 'attempt-confirm', prompt: '试了吗' } },
  { title: '说一说', body: '总结关键', visualCue: '总结区', interaction: { type: 'summarize-input', prompt: '说说看' } },
];

describe('算式提取（演示数据实时性）', () => {
  it('从问题文本提取加法算式（47+28 含全角加号/汉字加）', () => {
    expect(extractAddition('47+28 怎么算')).toEqual({ a: 47, b: 28 });
    expect(extractAddition('63＋21')).toEqual({ a: 63, b: 21 });
    expect(extractAddition('52 加 37 等于几')).toEqual({ a: 52, b: 37 });
  });
  it('无算式返回 null（模板用默认示例）', () => {
    expect(extractAddition('退位减法怎么教')).toBeNull();
  });
});

describe('LLM 输出严格校验（幻觉防护）', () => {
  const base = { title: '课件', objective: '目标' };

  it('合法课件通过且 demo 挂到指定步', () => {
    const r = validateCourseware({ ...base, steps: okSteps(), demo: { kind: 'column-subtraction', a: 52, b: 37, step: 0 } });
    expect(r).toBeTruthy();
    expect(r!.steps[0].demo).toEqual({ kind: 'column-subtraction', a: 52, b: 37 });
  });

  it('拒绝：步数不是 3', () => {
    expect(validateCourseware({ ...base, steps: okSteps().slice(0, 2) })).toBeNull();
    expect(validateCourseware({ ...base, steps: [...okSteps(), ...okSteps()] })).toBeNull();
  });

  it('拒绝：互动类型白名单外（防渲染器幻觉）', () => {
    const steps = okSteps();
    (steps[0].interaction as { type: string }).type = 'drag-and-drop';
    expect(validateCourseware({ ...base, steps })).toBeNull();
  });

  it('拒绝：演示类型白名单外', () => {
    expect(validateCourseware({ ...base, steps: okSteps(), demo: { kind: '3d-rotation', a: 1, b: 2 } })!.demo).toBeNull();
  });

  it('乘法数据约束：表内(2-9)通过、表外拒绝', () => {
    const ok = validateCourseware({ ...base, steps: okSteps(), demo: { kind: 'multiplication-groups', a: 3, b: 4, step: 1 } });
    expect(ok!.steps[1].demo).toEqual({ kind: 'multiplication-groups', a: 3, b: 4 });
    const bad = validateCourseware({ ...base, steps: okSteps(), demo: { kind: 'multiplication-groups', a: 12, b: 99 } });
    expect(bad!.steps.every((s: { demo: unknown }) => !s.demo)).toBe(true);
  });

  it('减法数据约束：a 必须 > b（退位/不退位都要求被减数大）', () => {
    const ok = validateCourseware({ ...base, steps: okSteps(), demo: { kind: 'column-subtraction', a: 52, b: 37 } });
    expect(ok!.steps[0].demo).toBeTruthy();
    const bad = validateCourseware({ ...base, steps: okSteps(), demo: { kind: 'column-subtraction', a: 30, b: 50 } });
    expect(bad!.steps.every((s: { demo: unknown }) => !s.demo)).toBe(true);
  });

  it('step-reveal：至少 2 句、最多 6 句、可含对象形态', () => {
    const ok = validateCourseware({ ...base, steps: okSteps(), demo: { kind: 'step-reveal', step: 2, steps: ['有5个苹果', '去掉2个', '5-2=3'] } });
    expect(ok!.steps[2].demo).toEqual({ kind: 'step-reveal', steps: ['有5个苹果', '去掉2个', '5-2=3'] });
    const tooFew = validateCourseware({ ...base, steps: okSteps(), demo: { kind: 'step-reveal', steps: ['只有一句'] } });
    expect(tooFew!.steps.every((s: { demo: unknown }) => !s.demo)).toBe(true);
  });

  /* ---------- 语文专属演示（阅读/复述/表达三类课型） ---------- */
  it('keyword-mark：关键词必须是句子子串，否则不渲染（避免圈不出任何字）', () => {
    const ok = validateCourseware({ ...base, steps: okSteps(), demo: { kind: 'keyword-mark', step: 0, sentence: '小松鼠把秋天藏进了松果里', keywords: ['松鼠', '藏', '松果'] } });
    expect(ok!.steps[0].demo).toEqual({ kind: 'keyword-mark', sentence: '小松鼠把秋天藏进了松果里', keywords: ['松鼠', '藏', '松果'] });
    /* 关键词改了字/加了标点 → 在句中定位不到 → 拒绝（宁可不显示演示，也不显示圈错的演示） */
    const notSubstring = validateCourseware({ ...base, steps: okSteps(), demo: { kind: 'keyword-mark', sentence: '小松鼠把秋天藏进了松果里', keywords: ['小松鼠，', '藏'] } });
    expect(notSubstring!.steps.every((s: { demo: unknown }) => !s.demo)).toBe(true);
    const tooFew = validateCourseware({ ...base, steps: okSteps(), demo: { kind: 'keyword-mark', sentence: '小松鼠把秋天藏进了松果里', keywords: ['松鼠'] } });
    expect(tooFew!.steps.every((s: { demo: unknown }) => !s.demo)).toBe(true);
  });

  it('story-sequence：2-5 条事件；单条不成立（顺序演示需至少两个先后项）', () => {
    const ok = validateCourseware({ ...base, steps: okSteps(), demo: { kind: 'story-sequence', step: 0, events: ['先理清顺序', '再抓住细节', '最后完整复述'] } });
    expect(ok!.steps[0].demo).toEqual({ kind: 'story-sequence', events: ['先理清顺序', '再抓住细节', '最后完整复述'] });
    const one = validateCourseware({ ...base, steps: okSteps(), demo: { kind: 'story-sequence', events: ['只有一条'] } });
    expect(one!.steps.every((s: { demo: unknown }) => !s.demo)).toBe(true);
    const many = validateCourseware({ ...base, steps: okSteps(), demo: { kind: 'story-sequence', events: ['1', '2', '3', '4', '5', '6', '7'] } });
    const manyDemo = many!.steps[0].demo;
    expect(manyDemo?.kind === 'story-sequence' && manyDemo.events).toHaveLength(5); /* 截断到 5 条 */
  });

  it('sentence-build：骨架句必填，两层扩写至少一层', () => {
    const ok = validateCourseware({ ...base, steps: okSteps(), demo: { kind: 'sentence-build', step: 1, base: '小鸟飞。', addHow: '小鸟快乐地飞。', addMetaphor: '小鸟像箭一样飞。' } });
    expect(ok!.steps[1].demo).toEqual({ kind: 'sentence-build', base: '小鸟飞。', addHow: '小鸟快乐地飞。', addMetaphor: '小鸟像箭一样飞。' });
    /* 只给骨架、没有任何扩写 → 无教学价值，拒绝 */
    const noLayer = validateCourseware({ ...base, steps: okSteps(), demo: { kind: 'sentence-build', base: '小鸟飞。' } });
    expect(noLayer!.steps.every((s: { demo: unknown }) => !s.demo)).toBe(true);
    /* 只给一层也成立（addMetaphor 可选） */
    const oneLayer = validateCourseware({ ...base, steps: okSteps(), demo: { kind: 'sentence-build', step: 1, base: '小鸟飞。', addHow: '小鸟快乐地飞。' } });
    expect(oneLayer!.steps[1].demo).toEqual({ kind: 'sentence-build', base: '小鸟飞。', addHow: '小鸟快乐地飞。' });
  });

  it('语文课降级模板自动配「事件顺序」演示；数学课不受影响', () => {
    const yw = buildTemplateCourseware({ lessonId: 'yw2a-unit6-hero', problemText: '伟人故事：按顺序复述', lesson: { title: '伟人故事：按顺序复述', objective: '按顺序复述', stepBriefs: [{ title: '理清顺序', body: 'a' }, { title: '抓住细节', body: 'b' }, { title: '完整复述', body: 'c' }] } });
    const ywDemo = yw.steps.map((s) => s.demo).find(Boolean);
    expect(ywDemo?.kind).toBe('story-sequence');
    expect(ywDemo?.kind === 'story-sequence' ? ywDemo.events : []).toEqual(['先理清顺序', '再抓住细节', '最后完整复述']);
    /* 只在首步挂一次，不重复 */
    expect(yw.steps.filter((s) => s.demo).length).toBe(1);
    /* 数学课学习包不含具体算式 → 保持 null（数值演示宁缺毋滥） */
    const sj = buildTemplateCourseware({ lessonId: 'sj2a-unit4-length', problemText: '厘米和米', lesson: { title: '厘米和米', objective: '认识长度单位', stepBriefs: [{ title: '认识刻度尺', body: 'a' }, { title: '用厘米量', body: 'b' }, { title: '米与选单位', body: 'c' }] } });
    expect(sj.steps.every((s) => !s.demo)).toBe(true);
  });

  it('模板课件兜底：无 AI 时也是完整可互动结构', () => {
    const tpl = buildTemplateCourseware({ lessonId: 'x', problemText: '63+28' });
    expect(tpl.steps.length).toBe(3);
    expect(tpl.steps[0].demo!.kind).toBe('column-addition');
    expect(tpl.steps[1].demo!.kind).toBe('make-ten');
  });

  it('课程驱动模板：有课程上下文时按学习包生成，禁止无关演示（厘米和米不出现加法竖式）', () => {
    const lesson = {
      title: '厘米和米：长度单位与测量',
      objective: '认识厘米和米，会正确测量并合理选择长度单位',
      steps: [
        { title: '认识刻度尺', body: '刻度尺上有数字和刻度线，刻度0是测量的起点。', action: '指出尺子上的刻度0。', visualCue: '0刻度用红笔圈出。' },
        { title: '用厘米量', body: '物体一端对准0，尺子放平，另一端对着几就是几厘米。', action: '说出量物体时尺子怎么放。', visualCue: '一端对0的示意图。' },
        { title: '米与选单位', body: '1米=100厘米；量黑板、教室用米。', action: '判断两个物体的长度单位。', visualCue: '短的标厘米，长的标米。' },
      ],
    };
    const tpl = buildTemplateCourseware({ lessonId: 'sj2a-unit4-length', problemText: '厘米和米', lesson });
    expect(tpl.title).toContain('厘米和米');
    expect(tpl.objective).toBe(lesson.objective);
    expect(tpl.steps.map((s) => s.title)).toEqual(['认识刻度尺', '用厘米量', '米与选单位']);
    /* 主题红线：任何一步的文案里都不允许出现加法竖式演示（历史 bug：降级后错配成 47+28） */
    const allText = tpl.steps.map((s) => s.title + s.body).join('');
    expect(allText).not.toMatch(/竖式|满十进一|47\+28|凑十/);
    /* 学习包内容无对应动画渲染器：宁缺毋滥，demo 必须为 null 而不是错配演示 */
    expect(tpl.steps.every((s) => s.demo === null)).toBe(true);
    /* 互动三连完整：观察→尝试→总结 */
    expect(tpl.steps.map((s) => s.interaction.type)).toEqual(['observe-confirm', 'attempt-confirm', 'summarize-input']);
  });

  it('课程驱动模板：结构不完整时回退通用分步模板（不再无条件套加法）', () => {
    const badLesson = { title: 'x', objective: 'y', steps: [{ title: 'a', body: 'b' }] } as never;
    const tpl = buildTemplateCourseware({ lessonId: 'x', problemText: '抓关键词读懂一句话', lesson: badLesson });
    /* 无算式 → 学科中立通用模板：三步认知支架完整，但不得出现任何学科特定演示 */
    expect(tpl.steps).toHaveLength(3);
    expect(tpl.steps.every((s) => s.demo === null)).toBe(true);
    expect(tpl.steps.map((s) => s.interaction.type)).toEqual(['observe-confirm', 'attempt-confirm', 'summarize-input']);
    const allText = tpl.title + tpl.objective + tpl.steps.map((s) => s.title + s.body).join('');
    expect(allText).not.toMatch(/竖式|满十进一|47\+28|凑十/);
  });

  it('语文课降级不得出现数学竖式——学科守卫回归（上下文缺失时的错配根因）', () => {
    /* 回归：语文课在 LESSON_CONTEXTS 中缺失 → lesson 取不到 → 旧代码无条件套 {a:47,b:28} 加法模板 */
    const tpl = buildTemplateCourseware({ lessonId: 'yw2a-unit1-reading', problemText: '课文阅读：抓关键词读懂一句话', lesson: undefined });
    const allText = tpl.title + tpl.objective + tpl.steps.map((s) => s.title + s.body).join('');
    expect(allText).not.toMatch(/竖式|满十进一|47\+28|凑十|63\+28/);
    expect(tpl.steps.every((s) => s.demo === null)).toBe(true);
  });

  it('用户确实输入加法算式时，加法演示模板仍然保留（合法场景不被误伤）', () => {
    const tpl = buildTemplateCourseware({ lessonId: '任意材料', problemText: '47+28 怎么算？', lesson: undefined });
    expect(tpl.steps[0].demo).toEqual({ kind: 'column-addition', a: 47, b: 28 });
  });

  it('课程驱动模板：stepBriefs 形状（ai-proxy 上下文端点）同样生效——字段名不匹配曾导致降级永远错配', () => {
    /* 回归：ai-proxy /api/lesson-context 返回 stepBriefs，模板只认 steps → 判断失败 → 厘米和米课降级成竖式加法 */
    const lesson = {
      title: '厘米和米：长度单位与测量',
      topic: '厘米和米',
      objective: '认识厘米和米，会正确测量并合理选择长度单位',
      stepBriefs: [
        { title: '认识刻度尺', body: '刻度尺上有数字和刻度线，刻度0是测量的起点。' },
        { title: '用厘米量', body: '物体一端对准0，另一端对着几就是几厘米。' },
        { title: '米与选单位', body: '1米=100厘米；量黑板、教室用米。' },
      ],
    };
    const tpl = buildTemplateCourseware({ lessonId: 'sj2a-unit4-length', problemText: '厘米和米', lesson });
    expect(tpl.title).toContain('厘米和米');
    expect(tpl.steps.map((s) => s.title)).toEqual(['认识刻度尺', '用厘米量', '米与选单位']);
    const allText = tpl.title + tpl.objective + tpl.steps.map((s) => s.title + s.body).join('');
    expect(allText).not.toMatch(/竖式|满十进一|47\+28|凑十/);
  });

  it('LLM 提示词必须含字面 json（DeepSeek response_format 约束）', () => {
    expect(buildCoursewarePrompt({ problemText: 'x' })).toMatch(/json/i);
  });

  it('LLM 提示词：注入课程上下文并声明主题红线', () => {
    const lesson = { title: '厘米和米：长度单位与测量', topic: '厘米和米', objective: '认识厘米和米', outline: ['认识刻度尺', '认识厘米'], stepBriefs: [{ title: '认识刻度尺', body: '刻度0是起点。' }] };
    const prompt = buildCoursewarePrompt({ lessonId: 'sj2a-unit4-length', problemText: '厘米和米', lesson });
    expect(prompt).toContain('厘米和米：长度单位与测量');
    expect(prompt).toContain('认识厘米和米');
    expect(prompt).toContain('认识刻度尺');
    expect(prompt).toContain('主题红线');
    /* 无课程上下文时不注入红线（保持 legacy 行为） */
    const bare = buildCoursewarePrompt({ problemText: 'x' });
    expect(bare).not.toContain('主题红线');
  });
});
