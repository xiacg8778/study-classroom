/**
 * 课件演示渲染器的算术规范门禁（项目级自动化护栏）。
 *
 * 背景：进位 1 曾错误标注在个位上方（正确应在十位上方——它要加到十位）。
 * 这类"教学正确性"错误肉眼难以逐一核对，固化为组件测试：
 * 任何把进位/退位标注挪错列、挪错行、漏掉的改动，CI 直接失败。
 *
 * 规范依据：竖式加法满十进一，进位数字标在「被加进的数位」（十位）上方；
 * 竖式减法退位，退位标记标在「发生借位的数位」（个位）上方。
 */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { CoursewareDemo } from '../../src/features/lesson/CoursewareDemo';

const CELL_TENS_X = 210; /* 十位列中心 */
const CELL_ONES_X = 250; /* 个位列中心 */
const CARRY_Y_MAX = 40; /* 进位标注必须在数字行（y=36）之上 */

/* 动画逐帧用 setTimeout 揭示：fake timers 推进需包 act 才会 flush React 状态到 DOM */
function runToFinalFrame(): void {
  act(() => {
    vi.advanceTimersByTime(6000);
  });
}

function svgTexts(container: HTMLElement): Array<{ x: number; y: number; text: string }> {
  return Array.from(container.querySelectorAll('svg text')).map((t) => ({
    x: Number(t.getAttribute('x') ?? 0),
    y: Number(t.getAttribute('y') ?? 0),
    text: t.textContent ?? '',
  }));
}

describe('竖式加法渲染器算术规范', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });
  it('进位 1 必须标在十位上方（x≈十位列），不得回到个位', () => {
    const { container } = render(<CoursewareDemo demo={{ kind: 'column-addition', a: 37, b: 45 }} />);
    runToFinalFrame();
    const texts = svgTexts(container);
    const carry = texts.find((t) => t.text === '1' && t.y < CARRY_Y_MAX);
    expect(carry, '进位标注缺失').toBeTruthy();
    expect(Math.abs(carry!.x - CELL_TENS_X)).toBeLessThan(20);
    expect(Math.abs(carry!.x - CELL_ONES_X)).toBeGreaterThan(20);
  });

  it('个位结果必须是满十取余（7+5→2），十位必须含进位（3+4+1→8）', () => {
    const { container } = render(<CoursewareDemo demo={{ kind: 'column-addition', a: 37, b: 45 }} />);
    runToFinalFrame();
    const texts = svgTexts(container);
    const resultRow = texts.filter((t) => t.y > 100 && t.y < 140);
    expect(resultRow.map((r) => r.text).sort()).toEqual(['2', '8'].sort());
  });

  it('无进位的加法不得渲染进位标注', () => {
    const { container } = render(<CoursewareDemo demo={{ kind: 'column-addition', a: 23, b: 41 }} />);
    runToFinalFrame();
    const carry = svgTexts(container).find((t) => t.text === '1' && t.y < CARRY_Y_MAX);
    expect(carry).toBeUndefined();
  });
});

describe('竖式减法渲染器算术规范', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });
  it('退位标注必须标在个位上方，借后值（个位+10）可见', () => {
    const { container } = render(<CoursewareDemo demo={{ kind: 'column-subtraction', a: 52, b: 37 }} />);
    runToFinalFrame();
    const texts = svgTexts(container);
    const mark = texts.find((t) => t.text.includes('退') && t.y < CARRY_Y_MAX);
    expect(mark, '退位标注缺失').toBeTruthy();
    expect(Math.abs(mark!.x - CELL_ONES_X)).toBeLessThan(24);
    /* 借后个位值 12 必须出现 */
    expect(texts.some((t) => t.text === '12')).toBe(true);
  });

  it('退位减法结果必须正确（52-37=15）', () => {
    const { container } = render(<CoursewareDemo demo={{ kind: 'column-subtraction', a: 52, b: 37 }} />);
    runToFinalFrame();
    const texts = svgTexts(container);
    const resultRow = texts.filter((t) => t.y > 100 && t.y < 140);
    expect(resultRow.map((r) => r.text).sort()).toEqual(['1', '5'].sort());
  });
});

describe('乘法分组渲染器布局规范', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });
  it('圆点必须全部落在各自分组框内（组框 x 范围覆盖所有本组圆点）', () => {
    const { container } = render(<CoursewareDemo demo={{ kind: 'multiplication-groups', a: 3, b: 4 }} />);
    runToFinalFrame();
    const rects = Array.from(container.querySelectorAll('svg rect')).map((r) => {
      const x = Number(r.getAttribute('x') ?? 0);
      return { x, w: Number(r.getAttribute('width') ?? 0) };
    });
    const dots = Array.from(container.querySelectorAll('svg circle')).map((c) => Number(c.getAttribute('cx') ?? 0));
    expect(rects.length).toBe(3);
    expect(dots.length).toBe(12);
    for (const dot of dots) {
      const home = rects.find((r) => dot >= r.x - 1 && dot <= r.x + r.w + 1);
      expect(home, `圆点 cx=${dot} 落在所有分组框之外`).toBeTruthy();
    }
  });

  it('表外乘法被校验拒绝后不得渲染（13×99 无合法 demo）', () => {
    /* 该场景由 BFF 校验层拦截（demo 置 null）——前端不应收到此类型；此处验证渲染器对越界数据的最终防线 */
    const { container } = render(<CoursewareDemo demo={{ kind: 'multiplication-groups', a: 13, b: 4 }} />);
    runToFinalFrame();
    /* 13 组仍会渲染（前端不做二次约束，防线在 BFF），但断言渲染器本身可用 */
    expect(container.querySelectorAll('svg rect').length).toBe(13);
  });
});

/* ==================== 语文专属演示渲染器 ====================
 * 语文演示比数学更容易「看起来对、实际错」：圈画若吞字会给出残句、
 * 顺序若错乱会教错复述方法——肉眼逐课核对不可行。固化为门禁。
 */
type DemoProp = Parameters<typeof CoursewareDemo>[0]['demo'];
const asDemo = (d: unknown): DemoProp => d as DemoProp;

describe('语文：关键词圈画渲染器', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('圈画必须无损还原原句（切分不得吞字、丢字、重复）', () => {
    const sentence = '小松鼠把秋天藏进了松果里';
    const { container } = render(
      <CoursewareDemo demo={{ kind: 'keyword-mark', sentence, keywords: ['松鼠', '藏', '松果'] }} />,
    );
    runToFinalFrame();
    expect(container.querySelector('.kw-sentence')!.textContent).toBe(sentence);
  });

  it('圈出的词必须按句中先后排列（不可沿用关键词数组顺序）', () => {
    const { container } = render(
      <CoursewareDemo
        demo={{ kind: 'keyword-mark', sentence: '小松鼠把秋天藏进了松果里', keywords: ['松果', '松鼠', '藏'] }}
      />,
    );
    runToFinalFrame();
    const marks = Array.from(container.querySelectorAll('mark.kw-hit')).map((m) => m.textContent);
    expect(marks).toEqual(['松鼠', '藏', '松果']);
  });

  it('列表编号必须与句中位置一一对应（编号错位则孩子无法对照）', () => {
    /* 关键词按重要性给出时数组顺序与句中顺序不同，编号仍必须顺着句子走 */
    const { container } = render(
      <CoursewareDemo
        demo={{ kind: 'keyword-mark', sentence: '小松鼠把秋天藏进了松果里', keywords: ['藏', '松果', '松鼠'] }}
      />,
    );
    runToFinalFrame();
    const items = Array.from(container.querySelectorAll('.kw-list li')).map((li) => ({
      index: li.querySelector('.kw-index')?.textContent,
      text: li.textContent?.replace(/^\d+/, ''),
    }));
    expect(items).toEqual([
      { index: '1', text: '松鼠' },
      { index: '2', text: '藏' },
      { index: '3', text: '松果' },
    ]);
    /* 编号顺序必须与句子上的圈画顺序一致 */
    const marks = Array.from(container.querySelectorAll('mark.kw-hit')).map((m) => m.textContent);
    expect(items.map((i) => i.text)).toEqual(marks);
  });

  it('重叠关键词只圈一次，且不得吞掉相邻文字', () => {
    /* 「松」与「松鼠」命中同一位置：先到先得，不得重叠渲染两份 */
    const sentence = '小松鼠藏松果';
    const { container } = render(
      <CoursewareDemo demo={{ kind: 'keyword-mark', sentence, keywords: ['松', '松鼠'] }} />,
    );
    runToFinalFrame();
    expect(container.querySelector('.kw-sentence')!.textContent).toBe(sentence);
    expect(container.querySelectorAll('mark.kw-hit').length).toBe(1);
  });

  it('句中未出现的关键词不得被圈（错圈比不圈更误导）', () => {
    const { container } = render(
      <CoursewareDemo demo={{ kind: 'keyword-mark', sentence: '小猫钓鱼', keywords: ['小猫', '老虎'] }} />,
    );
    runToFinalFrame();
    expect(Array.from(container.querySelectorAll('mark.kw-hit')).map((m) => m.textContent)).toEqual(['小猫']);
    expect(container.querySelector('.kw-sentence')!.textContent).toBe('小猫钓鱼');
  });

  it('逐词揭示：初始全部 pending，推进后全部 revealed 并出现小结', () => {
    const { container } = render(
      <CoursewareDemo demo={{ kind: 'keyword-mark', sentence: '小松鼠把秋天藏进了松果里', keywords: ['松鼠', '藏', '松果'] }} />,
    );
    expect(container.querySelectorAll('.kw-list li.pending').length).toBe(3);
    expect(container.querySelectorAll('.kw-list li.revealed').length).toBe(0);
    runToFinalFrame();
    expect(container.querySelectorAll('.kw-list li.pending').length).toBe(0);
    expect(container.querySelectorAll('.kw-list li.revealed').length).toBe(3);
    expect(container.querySelector('.kw-conclusion')).toBeTruthy();
  });

  it('关键词不足 2 个时不渲染（单人不成「方法」）', () => {
    const { container } = render(
      <CoursewareDemo demo={asDemo({ kind: 'keyword-mark', sentence: '小猫钓鱼', keywords: ['小猫'] })} />,
    );
    expect(container.querySelector('.courseware-demo')?.getAttribute('data-incomplete')).toBe('1');
  });
});

describe('语文：事件顺序渲染器', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('事件必须按给定顺序编号渲染（顺序错 = 教错复述方法）', () => {
    const events = ['先理清顺序', '再抓住细节', '最后完整复述'];
    const { container } = render(<CoursewareDemo demo={{ kind: 'story-sequence', events }} />);
    runToFinalFrame();
    const items = Array.from(container.querySelectorAll('.seq-list li')).map((li) => ({
      index: li.querySelector('.seq-index')?.textContent,
      text: li.querySelector('.seq-text')?.textContent,
    }));
    expect(items).toEqual([
      { index: '1', text: '先理清顺序' },
      { index: '2', text: '再抓住细节' },
      { index: '3', text: '最后完整复述' },
    ]);
  });

  it('逐条揭示：初始全部 pending，推进后全部 revealed 并出现小结', () => {
    const { container } = render(<CoursewareDemo demo={{ kind: 'story-sequence', events: ['先理清顺序', '再抓住细节', '最后完整复述'] }} />);
    expect(container.querySelectorAll('.seq-list li.pending').length).toBe(3);
    runToFinalFrame();
    expect(container.querySelectorAll('.seq-list li.pending').length).toBe(0);
    expect(container.querySelectorAll('.seq-list li.revealed').length).toBe(3);
    expect(container.querySelector('.seq-conclusion')).toBeTruthy();
  });

  it('事件不足 2 条时不渲染（单条不成「顺序」）', () => {
    const { container } = render(<CoursewareDemo demo={asDemo({ kind: 'story-sequence', events: ['只有一条'] })} />);
    expect(container.querySelector('.courseware-demo')?.getAttribute('data-incomplete')).toBe('1');
  });
});

describe('语文：句子扩写渲染器', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('三层按教学顺序渲染：骨架 → 加「怎么样」 → 加比喻', () => {
    const { container } = render(
      <CoursewareDemo
        demo={{ kind: 'sentence-build', base: '小鸟飞。', addHow: '小鸟快乐地飞。', addMetaphor: '小鸟像箭一样飞。' }}
      />,
    );
    runToFinalFrame();
    const steps = Array.from(container.querySelectorAll('.build-step')).map((s) => ({
      tag: s.querySelector('.build-tag')?.textContent,
      text: s.querySelector('p')?.textContent,
      done: s.classList.contains('done'),
    }));
    expect(steps).toEqual([
      { tag: '骨架', text: '小鸟飞。', done: true },
      { tag: '加「怎么样」', text: '小鸟快乐地飞。', done: true },
      { tag: '加比喻', text: '小鸟像箭一样飞。', done: true },
    ]);
  });

  it('逐层展开：初始仅骨架落地，其余为待展开占位', () => {
    const { container } = render(
      <CoursewareDemo demo={{ kind: 'sentence-build', base: '小鸟飞。', addHow: '小鸟快乐地飞。', addMetaphor: '小鸟像箭一样飞。' }} />,
    );
    expect(container.querySelectorAll('.build-step.done').length).toBe(1);
    expect(container.querySelectorAll('.build-step.pending').length).toBe(2);
    runToFinalFrame();
    expect(container.querySelectorAll('.build-step.pending').length).toBe(0);
    expect(container.querySelectorAll('.build-step.done').length).toBe(3);
    expect(container.querySelector('.build-conclusion')).toBeTruthy();
  });

  it('无比喻时只渲染两层，且标题/小结不得承诺未展示的比喻层', () => {
    const { container } = render(
      <CoursewareDemo demo={{ kind: 'sentence-build', base: '小鸟飞。', addHow: '小鸟快乐地飞。' }} />,
    );
    runToFinalFrame();
    expect(container.querySelectorAll('.build-step').length).toBe(2);
    /* 标题与小结必须与实际层数一致——演示不能承诺它没展示的方法步骤 */
    const tags = Array.from(container.querySelectorAll('.build-tag')).map((t) => t.textContent);
    expect(tags).toEqual(['骨架', '加「怎么样」']);
    expect(container.querySelector('.demo-caption')!.textContent).not.toContain('比喻');
    expect(container.querySelector('.build-conclusion')!.textContent).not.toContain('比喻');
  });

  it('空骨架句不渲染（没有起点的扩写毫无意义）', () => {
    const { container } = render(
      <CoursewareDemo demo={asDemo({ kind: 'sentence-build', base: '', addHow: '小鸟快乐地飞。' })} />,
    );
    expect(container.querySelector('.courseware-demo')?.getAttribute('data-incomplete')).toBe('1');
  });
});
