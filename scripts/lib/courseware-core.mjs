/**
 * OpenMAIC 课件内容核心（纯函数，无副作用）——供 openmaic-bff.mjs 与单元测试共用。
 *
 * 三条来源路径：
 * - LLM 实时生成（经本机 AI 代理）：buildCoursewarePrompt 产出提示词，validateCourseware 严格校验返回
 * - 本地模板降级：buildTemplateCourseware（AI 代理不可用/超时/输出不合法时）
 * - 学习者问题中的算式实时提取：extractAddition（模板与 LLM 都可用）
 *
 * 校验纪律：LLM 输出不可信——互动类型白名单（3 种渲染器）、演示类型白名单（2 种渲染器）、
 * 步数必须恰好 3、数字必须为正整数；任何字段不合法整体拒绝（返回 null → 模板兜底）。
 */
import { createHash } from 'node:crypto';

export const INTERACTION_TYPES = ['observe-confirm', 'attempt-confirm', 'summarize-input'];
export const DEMO_KINDS = ['column-addition', 'make-ten', 'column-subtraction', 'multiplication-groups', 'step-reveal', 'keyword-mark', 'story-sequence', 'sentence-build'];
const INTERACTION_SET = new Set(INTERACTION_TYPES);
const DEMO_SET = new Set(DEMO_KINDS);

function safeStr(v, max) {
  return typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null;
}

/** 从文本提取两位数/三位数加法算式（如 47+28 / 63 加 28） */
export function extractAddition(text) {
  const m = (text || '').match(/(\d{2,3})\s*[+＋加]\s*(\d{2,3})/);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    if (a > 0 && b > 0) return { a, b };
  }
  return null;
}

/**
 * 本地模板课件（AI 不可用时的降级；仍是完整可互动的课件）。
 * 有课程上下文（lesson）时按课程学习包生成——步骤来自本课内容，主题必然匹配；
 * 无课程上下文（任意材料/自选题）才用加法演示模板（legacy 行为，仅数学计算场景合理）。
 * lesson 兼容两种形状：steps（含 action/visualCue，适配器侧）或 stepBriefs（title+body，ai-proxy 上下文端点）。
 * 形状不一致会导致降级永远错配——这是「厘米和米课出现竖式加法」的第二根因（已修）。
 */
export function buildTemplateCourseware({ lessonId, problemText, lesson } = {}) {
  const topic = problemText?.trim() ? problemText.trim().slice(0, 40) : (lessonId ?? '本课');
  /* 课程驱动模板：内容来自本课学习包，禁止塞入任何与主题无关的演示 */
  const rawSteps = Array.isArray(lesson?.steps) && lesson.steps.length === 3 ? lesson.steps
    : Array.isArray(lesson?.stepBriefs) && lesson.stepBriefs.length === 3 ? lesson.stepBriefs
    : null;
  if (lesson?.objective && rawSteps && rawSteps.every((s) => safeStr(s?.body, 120))) {
    const interactions = ['observe-confirm', 'attempt-confirm', 'summarize-input'];
    /* 语文课补「事件顺序」演示：三步标题本身就是一个有序方法（先…再…最后…），
       真实可演、零幻觉。数学课的学习包不含具体算式，数值演示宁缺毋滥保持 null。 */
    const isChinese = typeof lessonId === 'string' && /^yw/.test(lessonId);
    const seqEvents = rawSteps.map((s, i) => `${['先', '再', '最后', '接着'][i] ?? '然后'}${safeStr(s.title, 16) ?? ''}`);
    const seqDemo = isChinese && seqEvents.every((e) => e.length > 1) ? { kind: 'story-sequence', events: seqEvents } : null;
    const steps = rawSteps.map((s, i) => ({
      title: safeStr(s.title, 16) ?? `第${i + 1}步`,
      body: safeStr(s.body, 120),
      visualCue: safeStr(s.visualCue, 30) ?? '演示区',
      demo: seqDemo && i === 0 ? seqDemo : null, /* 只在首步挂一次，避免三步重复同一演示 */
      interaction: {
        type: interactions[i],
        prompt: safeStr(s.action, 80) ?? (i === 2 ? '请输入你总结的最关键一步。' : '完成这一步互动。'),
      },
    }));
    return {
      coursewareId: `omc-cw-${createHash('sha256').update(`tpl-lesson:${lessonId}:${lesson.title ?? topic}`).digest('hex').slice(0, 10)}`,
      title: safeStr(lesson.title, 24) ?? `互动课堂：${topic}`,
      objective: lesson.objective,
      steps,
    };
  }
  /* legacy 分支（无课程上下文时的降级）：
     ① 仅当能从用户文本里提取出明确算式时，才使用加法演示——这是「用户真的在做计算题」的唯一证据；
     ② 提取不到算式（语文/英语/阅读/表达等任何非计算场景）时，走学科中立的通用分步模板，demo 一律为 null。
     此前无条件套 `{a:47,b:28}` 加法模板，导致语文课降级即错配出「47+28 竖式」——本函数的核心教训。 */
  const picked = extractAddition(problemText);
  if (picked) {
    const col = picked;
    const toNext = (10 - (picked.a % 10)) % 10;
    const makeTen = picked.b >= toNext && toNext > 0 ? picked : { a: 63, b: 28 };
    return {
      coursewareId: `omc-cw-${createHash('sha256').update(`tpl:${lessonId}:${topic}`).digest('hex').slice(0, 10)}`,
      title: `互动课堂：${topic}`,
      objective: `通过互动课件理解「${topic}」的关键步骤，并完成每步互动确认。`,
      steps: [
        { title: '看一看', body: `观察「${col.a}+${col.b}」的竖式计算演示：先算个位，满十向十位进一。`, visualCue: '竖式逐位演示（自动播放，可重播）', demo: { kind: 'column-addition', a: col.a, b: col.b }, interaction: { type: 'observe-confirm', prompt: '看完演示，确认你看懂了「满十进一」发生在哪一步。' } },
        { title: '试一试', body: `再看凑整的巧办法：「${makeTen.a}+${makeTen.b}」，先把 ${makeTen.b} 拆开凑出整十数。看完自己在纸上试一道。`, visualCue: '凑十法演示（自动播放，可重播）', demo: { kind: 'make-ten', a: makeTen.a, b: makeTen.b }, interaction: { type: 'attempt-confirm', prompt: '在纸上用同样的方法试一道题，然后告诉我们你做到了哪一步。' } },
        { title: '说一说', body: `用自己的话总结「${topic}」里最重要的一步。`, visualCue: '总结区', interaction: { type: 'summarize-input', prompt: '请输入你总结的最关键一步。' } },
      ],
    };
  }
  /* 通用分步模板（学科中立）：三步认知支架适用于任何学科与题型，不掺入任何学科特定内容 */
  return {
    coursewareId: `omc-cw-${createHash('sha256').update(`tpl-generic:${lessonId}:${topic}`).digest('hex').slice(0, 10)}`,
    title: `互动课堂：${topic}`,
    objective: `围绕「${topic}」，先弄懂要做什么，再动手试一步，最后用自己的话说清关键。`,
    steps: [
      { title: '弄懂要做什么', body: `读一读「${topic}」，用自己的话说清它要我们做什么、已经知道了什么。`, visualCue: '题干回顾', demo: null, interaction: { type: 'observe-confirm', prompt: '说说这道题/这一课要我们做什么？' } },
      { title: '动手试第一步', body: `先做第一步，边做边说出你是怎么想的。卡住了就说卡在哪一步。`, visualCue: '动手区', demo: null, interaction: { type: 'attempt-confirm', prompt: '先做第一步，然后告诉我们你做到了哪里。' } },
      { title: '说一说关键', body: `用自己的话总结「${topic}」里最关键的一步，以及为什么它最关键。`, visualCue: '总结区', demo: null, interaction: { type: 'summarize-input', prompt: '请输入你总结的最关键一步。' } },
    ],
  };
}

/** LLM 课件生成提示词（输出 JSON，字段与 validateCourseware 对齐）。有课程上下文时强制紧扣本课主题 */
export function buildCoursewarePrompt({ lessonId, problemText, lesson } = {}) {
  const lines = [
    '你是小学互动课件设计师，覆盖数学、语文等各学科。根据下面的课程内容，生成一节三步互动课件的 JSON。',
    `课程：${lessonId ?? '未指定'}`,
  ];
  if (lesson?.title) lines.push(`课程标题：${lesson.title}`);
  if (lesson?.objective) lines.push(`本课学习目标：${lesson.objective}`);
  if (Array.isArray(lesson?.outline) && lesson.outline.length) lines.push(`本课目录要点：${lesson.outline.join('、')}`);
  if (Array.isArray(lesson?.stepBriefs) && lesson.stepBriefs.length) {
    lines.push(`本课预设讲解步骤（内容必须围绕这些知识点，表达可优化但主题不得偏离）：`);
    for (const s of lesson.stepBriefs) lines.push(`- ${s.title}：${s.body}`);
  }
  lines.push(
    `学习者的问题/材料：${(problemText ?? '').slice(0, 400)}`,
    '',
    '输出 JSON 对象，字段要求：',
    '{ "title": "课件标题（不超过 20 字）",',
    '  "objective": "一句话学习目标（不超过 50 字）",',
    '  "steps": [ { "title": "步骤名（2-5 字）", "body": "这一步看什么/做什么（不超过 70 字）", "visualCue": "视觉提示（不超过 24 字）", "interaction": { "type": "observe-confirm 或 attempt-confirm 或 summarize-input", "prompt": "给孩子的互动指令（不超过 50 字）" } }, … 恰好 3 步 ]',
    '  "demo": { "kind": "column-addition 或 make-ten", "a": 正整数, "b": 正整数 } 或 null }',
    '',
    '硬性规则：',
    '1. 恰好 3 步；interaction.type 只能用 observe-confirm（观察确认）/ attempt-confirm（动手尝试确认）/ summarize-input（总结输入）三种，第 1 步建议 observe-confirm，第 2 步建议 attempt-confirm，第 3 步必须 summarize-input。',
    '2. demo 规则——顶层 demo 字段，step 标注挂到第几步（0/1/2，默认 0）：',
    '   - column-addition：两位数加法竖式逐位演示 {kind:"column-addition",a,b,step}',
    '   - make-ten：凑十法演示 {kind:"make-ten",a,b,step}',
    '   - column-subtraction：两位数减法（含退位）竖式演示 {kind:"column-subtraction",a,b,step}，要求 a>b',
    '   - multiplication-groups：乘法「几个几」分组圆点演示 {kind:"multiplication-groups",a,b,step}，a=组数(2-9)，b=每组个数(2-9)',
    '   - step-reveal：通用分步演示——任何题型都能用 {kind:"step-reveal",step,steps:["第1句","第2句",…]}，steps 为 2-5 句话、每句一个动作或变化、二年级口语',
    '   - keyword-mark：语文阅读课专用——给一句话并圈出关键词 {kind:"keyword-mark",step,sentence:"完整的一句话",keywords:["关键词1","关键词2"]}；keywords 为 2-4 个、**每个都必须是 sentence 里原样出现的子串**（不能改字或加标点），否则演示不显示。适合「抓关键词读懂句子」「提取信息找依据」「联系上下文猜词义」类课文',
    '   - story-sequence：语文复述/叙事课专用——把故事按先后排成一列 {kind:"story-sequence",step,events:["先发生…","接着…","然后…","最后…"]}；events 为 2-5 条、每条一句话、含时间连接词。适合「按顺序复述」「理清顺序」「读懂变化」类课文',
    '   - sentence-build：语文表达课专用——把句子逐层说生动 {kind:"sentence-build",step,base:"骨架句（谁+做什么）",addHow:"加上「怎么样」后的句子",addMetaphor:"再用比喻说一遍（可选）"}。适合「把话说完整说生动」「续编故事」类课文',
    '   - 演示必须与题型/学科匹配：加法用 column-addition/make-ten，减法用 column-subtraction，乘法用 multiplication-groups；语文课按课型选 keyword-mark（阅读）/ story-sequence（复述叙事）/ sentence-build（表达）；其他题型优先 step-reveal；确实不需要演示时 demo 为 null。',
    '3. 语言面向小学二年级学生，口语化、鼓励式；只输出 JSON，不要输出任何其他文字。',
  );
  if (lesson?.title || lesson?.objective) {
    lines.push(`4. 主题红线：课件三步必须紧扣「${lesson.title ?? lessonId}」这一课的内容（目标：${lesson.objective ?? '见上'}）；本课与竖式计算无关时，demo 必须为 null 或用 step-reveal 呈现本课知识，禁止出现与本课无关的加法/减法/乘法演示。`);
  }
  return lines.join('\n');
}

/**
 * 严格校验并规范化 LLM 生成的课件。任何字段不合法返回 null（调用方回退模板）。
 * 通过时返回与模板同构的对象（title/objective/steps[3]/demo|null）。
 */
export function validateCourseware(content) {
  if (!content || typeof content !== 'object') return null;
  const c = content;
  const title = safeStr(c.title, 24);
  const objective = safeStr(c.objective, 60);
  if (!title || !objective) return null;
  if (!Array.isArray(c.steps) || c.steps.length !== 3) return null;
  const steps = [];
  for (const raw of c.steps) {
    if (!raw || typeof raw !== 'object') return null;
    const s = raw;
    const st = safeStr(s.title, 16);
    const body = safeStr(s.body, 120);
    const visualCue = safeStr(s.visualCue, 30) ?? '演示区';
    const it = s.interaction;
    if (!st || !body || !it || typeof it !== 'object' || !INTERACTION_SET.has(String(it.type))) return null;
    const prompt = safeStr(it.prompt, 80) ?? '完成这一步互动。';
    /* 步骤级 demo 不接受（演示只挂全局），忽略即可 */
    steps.push({ title: st, body, visualCue, demo: null, interaction: { type: String(it.type), prompt } });
  }
  /* 全局 demo：类型白名单 + 按类型的数值约束；不合法置 null（演示缺失可接受，互动坏掉不可接受） */
  let demo = null;
  const d = c.demo;
  if (d && typeof d === 'object' && DEMO_SET.has(String(d.kind))) {
    const kind = String(d.kind);
    if (kind === 'step-reveal') {
      /* 通用分步演示：LLM 提供 2-6 句话，任何题型都能用 */
      const raw = Array.isArray(d.steps) ? d.steps : [];
      const lines = raw.map((s) => safeStr(s && typeof s === 'object' ? s.text : s, 80)).filter(Boolean).slice(0, 6);
      if (lines.length >= 2) demo = { kind, steps: lines };
    } else if (kind === 'keyword-mark') {
      /* 关键词圈画（语文阅读课）：一句话 + 2-4 个关键词；关键词必须是句子的子串，否则圈不出来 */
      const sentence = safeStr(d.sentence, 120);
      const raw = Array.isArray(d.keywords) ? d.keywords : [];
      const keywords = raw.map((k) => safeStr(k, 20)).filter(Boolean).slice(0, 4);
      const valid = sentence && keywords.length >= 2 && keywords.every((k) => sentence.includes(k));
      if (valid) demo = { kind, sentence, keywords };
    } else if (kind === 'story-sequence') {
      /* 事件顺序（语文复述课）：2-5 个事件，按给定次序即为故事线 */
      const raw = Array.isArray(d.events) ? d.events : [];
      const events = raw.map((e) => safeStr(e && typeof e === 'object' ? e.text : e, 60)).filter(Boolean).slice(0, 5);
      if (events.length >= 2) demo = { kind, events };
    } else if (kind === 'sentence-build') {
      /* 句子扩写（语文表达课）：骨架句必填，两层扩写至少给一层 */
      const base = safeStr(d.base, 60);
      const addHow = safeStr(d.addHow, 80);
      const addMetaphor = safeStr(d.addMetaphor, 80) ?? null;
      if (base && (addHow || addMetaphor)) demo = { kind, base, addHow: addHow ?? '', ...(addMetaphor ? { addMetaphor } : {}) };
    } else {
      const a = Number(d.a);
      const b = Number(d.b);
      if (Number.isInteger(a) && Number.isInteger(b) && a > 0 && b > 0 && a <= 999 && b <= 999) {
        if (kind === 'column-subtraction' && a > b) demo = { kind, a, b };
        else if (kind === 'multiplication-groups' && a >= 2 && a <= 9 && b >= 2 && b <= 9) demo = { kind, a, b };
        else if (kind === 'column-addition' || kind === 'make-ten') demo = { kind, a, b };
      }
    }
    if (demo) {
      let idx = Number(d.step);
      /* 未指定挂载步时的默认位：凑十/扩写属「动手试」（第 2 步），其余演示在第 1 步呈现 */
      const defaultSecond = kind === 'make-ten' || kind === 'sentence-build';
      if (!Number.isInteger(idx) || idx < 0 || idx > 2) idx = defaultSecond ? 1 : 0;
      steps[idx].demo = demo;
    }
  }
  const coursewareId = `omc-cw-${createHash('sha256').update(`llm:${title}:${objective}`).digest('hex').slice(0, 10)}`;
  return { coursewareId, title, objective, steps, demo };
}
