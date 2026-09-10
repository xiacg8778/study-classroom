#!/usr/bin/env node
/**
 * AI 本地代理（宿主为家庭本机；浏览器永不持有密钥）。
 *
 * 职责：接收 webapp 的 /api/ai 讲解与批改请求 → 附密钥转发 OpenAI 兼容接口
 * （默认智谱 bigmodel）→ 严格 JSON 返回。安全约束：
 * - 只绑 127.0.0.1；不写任何日志含题目/作答原文（只记状态码与耗时）。
 * - 密钥从环境变量 AI_PROXY_API_KEY 读取；未配置则 /health 报 not-configured。
 * - 未成年人安全：system prompt 明确小学辅导边界；输出仅做格式校验，不执行任何指令。
 *
 * 用法：AI_PROXY_API_KEY=xxx node scripts/ai-proxy.mjs [--port 4610]
 */
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const PORT = Number(process.argv.includes('--port') ? process.argv[process.argv.indexOf('--port') + 1] : 4610);
const DEFAULT_BASE = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

/* 本机配置文件（webapp「AI 接入设置」面板写入）：~/.ai-proxy/config.json，权限 0600。
   优先级：文件（UI 保存）> 环境变量 > 内置默认。密钥只落本机文件，浏览器不持久保存。 */
const CONFIG_DIR = path.join(os.homedir(), '.ai-proxy');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
function loadFileConfig() {
  try { return JSON.parse(readFileSync(CONFIG_FILE, 'utf8')); } catch { return {}; }
}
let fileConfig = loadFileConfig();
function persistFileConfig(patch) {
  fileConfig = { ...fileConfig, ...patch };
  try {
    mkdirSync(CONFIG_DIR, { recursive: true });
    writeFileSync(CONFIG_FILE, JSON.stringify(fileConfig, null, 2), { mode: 0o600 });
    return true;
  } catch { return false; }
}
let API_KEY = typeof fileConfig.apiKey === 'string' ? fileConfig.apiKey : (process.env.AI_PROXY_API_KEY ?? '');
let API_BASE = typeof fileConfig.apiBase === 'string' ? fileConfig.apiBase : (process.env.AI_PROXY_BASE ?? DEFAULT_BASE);
let MODEL = typeof fileConfig.model === 'string' ? fileConfig.model : (process.env.AI_PROXY_MODEL ?? 'glm-4-flash');

const SYSTEM_PROMPT = [
  '你是一名面向中国小学二三年级学生家庭辅导的助教，只输出符合 JSON Schema 的结构化结果。',
  '规则：讲解口语化、每步一个动作；不得输出恐怖/色情/自杀/政治等内容，遇到即拒绝（refusal 字段说明）；',
  '不得自称掌握权威学术结论；批改只判断对错与思路，不给孩子贴标签；禁止出现「粗心」作为错因。',
].join('');

const lessonSchema = {
  type: 'object',
  properties: {
    objective: { type: 'string', maxLength: 120 },
    steps: {
      type: 'array', minItems: 3, maxItems: 3,
      items: {
        type: 'object',
        properties: {
          title: { type: 'string', maxLength: 20 },
          body: { type: 'string', maxLength: 160 },
          action: { type: 'string', maxLength: 120 },
          visualCue: { type: 'string', maxLength: 80 },
        },
        required: ['title', 'body', 'action', 'visualCue'],
        additionalProperties: false,
      },
    },
    refusal: { type: 'string' },
  },
  required: ['objective', 'steps'],
  additionalProperties: false,
};

const quizSchema = {
  type: 'object',
  properties: {
    quizId: { type: 'string', maxLength: 40, pattern: '^ai-generic-[a-z0-9-]*$' },
    questions: {
      type: 'array', minItems: 3, maxItems: 5,
      items: {
        type: 'object',
        properties: {
          questionId: { type: 'string', maxLength: 12 },
          type: { type: 'string', enum: ['choice', 'fill', 'steps'] },
          prompt: { type: 'string', maxLength: 200 },
          options: { type: 'array', maxItems: 6, items: { type: 'string', maxLength: 40 } },
          expectedAnswer: { type: 'string', maxLength: 80 },
          rationale: { type: 'string', maxLength: 160 },
          keyPoints: { type: 'array', maxItems: 4, items: { type: 'array', maxItems: 8, items: { type: 'string', maxLength: 40 } } },
          keyPointLabels: { type: 'array', maxItems: 4, items: { type: 'string', maxLength: 20 } },
        },
        required: ['questionId', 'type', 'prompt', 'expectedAnswer', 'rationale'],
        additionalProperties: false,
      },
    },
    refusal: { type: 'string' },
  },
  required: ['questions'],
  additionalProperties: false,
};

const gradingSchema = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          questionId: { type: 'string' },
          thinkingFeedback: { type: 'string', maxLength: 160 },
          errorCause: { type: 'string', enum: ['R1','R2','R3','R4','R5','R6','R7','R8','R9','R10','R11','undetermined'] },
          rationale: { type: 'string', maxLength: 200 },
        },
        required: ['questionId', 'thinkingFeedback'],
        additionalProperties: false,
      },
    },
    refusal: { type: 'string' },
  },
  required: ['items'],
  additionalProperties: false,
};

function json(res, code, body) {
  const payload = JSON.stringify(body);
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'content-length': Buffer.byteLength(payload) });
  res.end(payload);
}

async function callUpstream(messages) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 90000);
  /* 供应商习惯给 base URL（如 https://api.deepseek.com 或 .../v1），此处自动补全 /chat/completions */
  const endpoint = /\/chat\/completions\/?$/.test(API_BASE) ? API_BASE : `${API_BASE.replace(/\/$/, '')}/chat/completions`;
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${API_KEY}` },
      body: JSON.stringify({ model: MODEL, messages, temperature: 0.4, response_format: { type: 'json_object' } }),
      signal: controller.signal,
    });
    const text = await response.text();
    if (!response.ok) return { ok: false, status: response.status, detail: text.slice(0, 200) };
    const parsed = JSON.parse(text);
    const content = parsed.choices?.[0]?.message?.content;
    if (typeof content !== 'string') return { ok: false, status: 502, detail: 'empty content' };
    return { ok: true, content };
  } catch (error) {
    return { ok: false, status: 502, detail: error.name === 'AbortError' ? 'timeout' : 'network' };
  } finally {
    clearTimeout(timer);
  }
}

let requests = 0;
let failures = 0;

/* ---------- 课程上下文（OpenMAIC BFF 课件生成用）----------
   问题背景：课件生成此前只拿到 lessonId 与用户输入文字，AI 代理超时/失败时的模板兜底
   是「加法竖式」专属模板——厘米和米这类非计算课降级后内容完全错配。
   现在 BFF 生成课件前先按 lessonId 查询本课上下文，注入提示词与课程化模板。 */
const LESSON_CONTEXTS = {
  /* 数学二上（10 课） */
  'sj2a-unit1-addsub': { title: '100以内的加法和减法：进位与退位', topic: '进位加法与退位减法', objective: '掌握两位数加减法中进位与退位的关键步骤，能正确计算并验算', outline: ['列竖式对齐数位', '个位满十进1', '个位不够减退1', '加减互逆验算'], stepBriefs: [{ title: '先看个位', body: '个位相加满十要向十位进1；个位不够减要从十位退1当10。' }, { title: '再算十位', body: '十位计算时别忘了进上来的1或借出去的1。' }, { title: '验算确认', body: '减法用差+减数=被减数，加法用和-一个加数=另一个加数来验算。' }] },
  'sj2a-unit1-practice': { title: '100以内加减法：连加连减与验算', topic: '连加连减', objective: '掌握连加连减的计算顺序，会用加减互逆验算并避免抄错数', outline: ['连加从左往右算', '连减逐次减', '验算防抄错数'], stepBriefs: [{ title: '按顺序算', body: '连加连减从左往右，一步一步算，每步写清结果。' }, { title: '小心连续退位', body: '个位要连着两次退位时，每借一次十位都要减1。' }, { title: '验算防错', body: '用最后结果倒回去加（减）一遍，对得上才算稳。' }] },
  'sj2a-unit2-quadrilateral': { title: '平行四边形的初步认识', topic: '平行四边形', objective: '初步认识四边形与平行四边形：有4条边4个角，对边平行且相等', outline: ['认一认四边形', '找平行的一组对边', '拼一拼平行四边形'], stepBriefs: [{ title: '认一认四边形', body: '长方形、正方形、平行四边形都是四边形：都有4条边、4个角。' }, { title: '找平行的一组对边', body: '平行四边形最特别：两组对边分别平行且长度相等。' }, { title: '拼一拼、拉一拉', body: '把长方形框架轻轻一拉，角变了、边没变，就成了平行四边形。' }] },
  'sj2a-unit3-multiply1': { title: '表内乘法一：乘法的初步认识', topic: '乘法的初步认识', objective: '理解乘法是相同加数连加的简便算法，会读写乘法算式', outline: ['相同加数连加', '改写成乘法算式', '把生活问题写成乘法'], stepBriefs: [{ title: '先数「几个几」', body: '相同加数连加才能写成乘法。先观察加数是否相同，再数一数有几个。' }, { title: '读写乘法算式', body: '4个3相加写成4×3或3×4，乘号前后交换结果一样。' }, { title: '回归加法检查', body: '乘法来自连加，用连加验证：4×3就是3+3+3+3。' }] },
  'sj2a-unit3-multiply2': { title: '表内乘法一：2～6的乘法口诀', topic: '2到6的乘法口诀', objective: '熟记2～6的乘法口诀，能用一句口诀算两道乘法并解决实际问题', outline: ['2的口诀：每次加2', '5的口诀：结果0或5结尾', '用口诀解决问题'], stepBriefs: [{ title: '找口诀的规律', body: '2的口诀每次加2；5的口诀结果总是0或5结尾。' }, { title: '一句口诀两道算式', body: '三五十五，既能算3×5也能算5×3。' }, { title: '用口诀解决问题', body: '一双筷子2根，6口人要几根？想「二六十二」马上知道是12根。' }] },
  'sj2a-unit4-division': { title: '表内除法一：平均分与除法', topic: '平均分与除法', objective: '理解平均分的含义，认识除号会读算式，会用1～6的乘法口诀求商', outline: ['认识平均分', '除号与算式读法', '用1～6的口诀求商'], stepBriefs: [{ title: '认识平均分', body: '每份分得同样多，才叫平均分。' }, { title: '认识除法算式', body: '8÷2=4：除号前面是总数，后面是份数，等号后是每份个数。' }, { title: '口诀求商', body: '除法用乘法口诀算最快：12÷3想「三四十二」，商是4。' }] },
  'sj2a-unit4-length': { title: '厘米和米：长度单位与测量', topic: '厘米和米', objective: '认识厘米和米，会正确测量并合理选择长度单位', outline: ['认识刻度尺', '厘米量物体', '米与厘米的关系', '选对单位'], stepBriefs: [{ title: '认识刻度尺', body: '刻度尺上有数字和刻度线，刻度0是测量的起点。' }, { title: '用厘米量', body: '物体一端对准0，尺子放平，另一端对着几就是几厘米。厘米量短的：铅笔、橡皮。' }, { title: '米与选单位', body: '1米=100厘米；量黑板、教室用米。听到「铅笔18米」要能发现不对劲。' }] },
  'sj2a-unit6-recipe7to9': { title: '表内乘法和表内除法二：7～9的口诀', topic: '7到9的乘法口诀', objective: '熟记7～9的乘法口诀，会用口诀求积求商，会算连乘连除', outline: ['7～9的乘法口诀', '一句口诀四道算式', '连乘连除和乘除混合'], stepBriefs: [{ title: '7～9的口诀', body: '7的口诀每次加7，8的每次加8，9的每次加9。' }, { title: '一句口诀四道算式', body: '七八五十六：能算7×8、8×7、56÷7、56÷8四道题。' }, { title: '连乘连除和混合', body: '连乘连除从左往右算：2×3×4先算2×3=6，再算6×4=24。' }] },
  'sj2a-unit7-observe': { title: '观察物体：从前后左右看', topic: '观察物体', objective: '能从前、后、左、右不同位置观察物体，说出看到的不同形状', outline: ['站在不同位置看', '前后左右四个方向', '根据形状猜位置'], stepBriefs: [{ title: '站在不同位置看', body: '同一个物体，站在不同位置看到的形状可能不一样。' }, { title: '前后左右四个方向', body: '每次只看到一面。前后看到的常常相反，左右看到的也常常相反。' }, { title: '根据形状猜位置', body: '看到正面图，就知道观察者在正面；看到侧面图，观察者就在侧面。' }] },
  'sj2a-unit8-review': { title: '期末复习：加减乘除单位与图形', topic: '二年级上册期末复习', objective: '复习100以内加减法、表内乘除法、厘米和米、图形与观察物体', outline: ['加减法查漏', '乘除法查漏', '单位与图形查漏'], stepBriefs: [{ title: '加减法查漏', body: '两位数加减先看个位：满十进1，不够减退1，做完用加减互逆验算。' }, { title: '乘除法查漏', body: '乘除法都靠口诀：想「几个几」用乘法，平均分用除法。' }, { title: '单位与图形查漏', body: '短的用厘米、长的用米，1米=100厘米；平行四边形对边平行且相等。' }] },
  /* 数学二下（9 课） */
  'sj2b-unit1-remainder': { title: '有余数的除法', topic: '有余数的除法', objective: '理解有余数除法的含义，会写除法竖式，知道余数一定比除数小', outline: ['认识余数', '除法竖式', '余数必须比除数小'], stepBriefs: [{ title: '分不完怎么办', body: '13颗糖平均分给4人，每人3颗还剩1颗，剩下的1颗叫余数。' }, { title: '认识除法竖式', body: '除法竖式：商在上面，商乘除数的积，被除数减掉它得到余数。' }, { title: '余数必须比除数小', body: '余数如果比除数大，说明还能再分一次。检查：余数<除数。' }] },
  'sj2b-unit2-time': { title: '时分秒：会看钟表', topic: '时分秒', objective: '认识时、分、秒，会看钟表读时间，知道1时=60分、1分=60秒', outline: ['认识钟面', '读几时几分', '1时=60分，1分=60秒'], stepBriefs: [{ title: '认识钟面', body: '时针最短、分针较长、秒针最细。时针走1大格是1小时，分针走1小格是1分。' }, { title: '读几时几分', body: '先看时针过了几就是几时；再看分针从12起走了几小格就是几分。' }, { title: '时分秒的关系', body: '1时=60分，1分=60秒。分针走一圈是1小时；秒针走一圈是1分。' }] },
  'sj2b-unit3-direction': { title: '认识方向：东南西北与平面图', topic: '认识方向', objective: '认识东南西北和四个斜方向，会看平面图定方向', outline: ['认东南西北', '平面图上的方向', '东南、西南、东北、西北'], stepBriefs: [{ title: '认东南西北', body: '太阳从东方升起。面向东，后面是西，左面是北，右面是南。' }, { title: '看平面图', body: '平面图上的方向口诀：上北下南，左西右东。' }, { title: '认识四个斜方向', body: '东和北之间是东北，东和南之间是东南，西和北之间是西北，西和南之间是西南。' }] },
  'sj2b-unit3-recognize-numbers': { title: '认识万以内的数：数位与组成', topic: '万以内数的认识', objective: '认识千位与数位顺序，正确读写万以内的数', outline: ['认识新的计数单位', '数位顺序表', '读写万以内的数'], stepBriefs: [{ title: '认识千位', body: '10个一百是一千。千位在数位顺序表右边第四位。' }, { title: '数位决定大小', body: '同一个数字站不同数位大小完全不同：5555里四个5依次是五千、五百、五十、五。' }, { title: '读写有0的数', body: '中间的0要读（3056读三千零五十六），末尾的0不读（5600读五千六百）；写数时0要占位。' }] },
  'sj2b-unit5-dm-mm': { title: '分米和毫米', topic: '分米和毫米', objective: '认识分米和毫米，掌握米、分米、厘米、毫米之间的换算', outline: ['认识分米', '认识毫米', '单位换算'], stepBriefs: [{ title: '认识分米', body: '1分米=10厘米。分米比厘米大、比米小。' }, { title: '认识毫米', body: '1厘米=10毫米。毫米很小，量硬币厚度用它。' }, { title: '单位换算', body: '1米=10分米=100厘米=1000毫米。2分米=20厘米，30毫米=3厘米。' }] },
  'sj2b-unit6-addsub': { title: '两三位数的加法和减法', topic: '两三位数加减法', objective: '会口算两位数加减，会笔算三位数进位加法和退位减法', outline: ['两位数口算', '三位数进位加法', '三位数退位减法'], stepBriefs: [{ title: '口算两位数加减', body: '凑整口算：38+45，先算38+40=78，再算78+5=83。' }, { title: '笔算进位加法', body: '数位对齐从个位加起，哪一位满十就向前一位进1，连续进位每步都要加进上来的1。' }, { title: '笔算退位减法', body: '从个位减起，不够减向前一位借1当10；中间是0时隔位退位要先变9。' }] },
  'sj2b-unit7-angle': { title: '角的初步认识：直角锐角和钝角', topic: '角', objective: '认识角，会比较角的大小，会区分直角、锐角和钝角', outline: ['角的组成', '角的大小', '直角、锐角、钝角'], stepBriefs: [{ title: '认识角', body: '角由一个顶点和两条边组成。' }, { title: '角的大小', body: '角的大小和两条边张开的程度有关，和边的长短无关。' }, { title: '认识直角、锐角、钝角', body: '用三角尺上的直角去比：一样是直角；比直角小是锐角；比直角大是钝角。' }] },
  'sj2b-unit8-data': { title: '数据的收集和整理一', topic: '数据整理', objective: '会按不同标准分类，会用简单方法收集和整理数据', outline: ['按不同标准分类', '收集数据的方法', '整理成表格'], stepBriefs: [{ title: '按标准分类', body: '同样的东西可以按不同标准分类：同学可按性别分，也可按戴不戴眼镜分。' }, { title: '收集数据', body: '收集数据可以用举手、打勾、画正字。一个正字就是5个。' }, { title: '整理并看结果', body: '把数据整理成表格或条形图，一眼看出哪类最多最少。' }] },
  'sj2b-unit9-review': { title: '期末复习：数量方向与图形', topic: '二年级下册期末复习', objective: '复习有余数除法、万以内数、两三位数加减法、时分秒、方向、单位与角', outline: ['数与计算查漏', '单位与方向查漏', '图形与时间查漏'], stepBriefs: [{ title: '数与计算查漏', body: '有余数除法先求商再看余数；两三位数加减从个位起，满十进1、不够借10。' }, { title: '量与方向查漏', body: '毫米<厘米<分米<米，相邻进率10；上北下南左西右东。' }, { title: '图形与时间查漏', body: '角分直角锐角钝角；读时间先看时针过几再数分针小格。' }] },
  /* ---- 语文（统编版对齐，二年级上/下）：与数学同构，供降级模板与 LLM 提示词共用 ---- */
  'yw2a-unit1-reading': { title: '课文阅读：抓关键词读懂一句话', topic: '抓关键词读懂一句话', objective: '读懂一句话的秘诀：先找出句子里的生字词，读准它们；再想一想，哪个词最重要。能按「找出生字词、抓住关键词、连起来说句意」三步完成本课练习。', outline: ['找出生字词', '抓住关键词', '连起来说句意'], stepBriefs: [{ title: '找出生字词', body: '读懂一句话的秘诀：先找出句子里的生字词，读准它们；再想一想，哪个词最重要？把重要的词圈出来，句子的意思就清楚了。' } , { title: '抓住关键词', body: '比如「小松鼠把秋天藏进了松果里」这句话：圈出「藏」，想一想——松果怎么会有秋天？原来是松鼠在秋天储存松果过冬。抓住一个词，读懂一句话。' } , { title: '连起来说句意', body: '试着用这个方法读课文：先读准，再圈词，最后用自己的话说一说。说的时候别背原句，换成自己的话才说明真的读懂了。' }] },
  'yw2a-unit2-sentences': { title: '句子练习：把话说完整、说生动', topic: '把话说完整、说生动', objective: '把话说完整，要有「谁」和「做什么」：小鸟飞、小明写字。能按「谁+在做什么、加上「怎么样」、用比喻让句子活起来」三步完成本课练习。', outline: ['谁+在做什么', '加上「怎么样」', '用比喻让句子活起来'], stepBriefs: [{ title: '谁+在做什么', body: '把话说完整，要有「谁」和「做什么」：小鸟飞、小明写字。再进一步，加上「怎么样」：小鸟快乐地飞、小明认真地写字。句子马上就生动了。' } , { title: '加上「怎么样」', body: '让句子活起来的另一个办法是打比方：「月亮弯弯的，像一只小船」「红红的苹果像妹妹的脸蛋」。比方的两边要有相似的地方，不能乱比。' } , { title: '用比喻让句子活起来', body: '练一练：把「太阳升起来了」这句话说生动。可以说「太阳慢慢地从山后爬起来了」，也可以说「太阳像个红气球，从山后升了起来」。说的和别人不一样，才是好句子。' }] },
  'yw2a-unit3-story': { title: '看图讲故事：按顺序说清楚', topic: '按顺序说清楚', objective: '看图讲故事，先看整体：图上是什么时间、什么地方、有谁。能按「先看整体、按顺序说、加上想法」三步完成本课练习。', outline: ['先看整体', '按顺序说', '加上想法'], stepBriefs: [{ title: '先看整体', body: '看图讲故事，先看整体：图上是什么时间、什么地方、有谁？再按顺序看：先发生了什么，接着怎么样，最后怎样了。' } , { title: '按顺序说', body: '讲故事的小法宝：用上「先……接着……然后……最后……」，听起来就有条有理。别忘了说清「为什么」，让听的人明白道理。' } , { title: '加上想法', body: '说给别人听，是最棒的练习。说完了问一问：我讲清楚了吗？漏了什么？下一次讲得更好。' }] },
  'yw2a-unit4-scenery': { title: '古诗与写景：抓住景物特点', topic: '抓住景物特点', objective: '读古诗先读通顺，再想画面。能按「读通顺、找景物特点、想象画面」三步完成本课练习。', outline: ['读通顺', '找景物特点', '想象画面'], stepBriefs: [{ title: '读通顺', body: '读古诗先读通顺，再想画面。「白日依山尽，黄河入海流」——太阳靠着山慢慢落下，黄河向着大海奔流，两句就是一幅画。' } , { title: '找景物特点', body: '写景的文章要抓住景物的特点：黄山奇石「奇」在哪？日月潭「美」在哪？找出最能表现特点的句子，圈出关键词。' } , { title: '想象画面', body: '读景物的文章可以边读边想象：颜色、形状、声音、动静。把想到的画面说给别人听，就是读懂了。' }] },
  'yw2a-unit5-fable': { title: '寓言故事：读懂藏在故事里的道理', topic: '读懂藏在故事里的道理', objective: '寓言故事短小，却藏着道理。能按「读故事、想因果、说道理」三步完成本课练习。', outline: ['读故事', '想因果', '说道理'], stepBriefs: [{ title: '读故事', body: '寓言故事短小，却藏着道理。《坐井观天》里青蛙只看到井口那么大的天，《寒号鸟》里寒号鸟总说明天就做窝——它们都错在只看眼前。' } , { title: '想因果', body: '读寓言要想三件事：故事里的人物做了什么？结果怎样？为什么会这样？把这三个问题想清楚，道理就浮出来了。' } , { title: '说道理', body: '道理常常藏在最后一句，也可能要自己总结。读完用自己的话说说：这个故事告诉我什么？' }] },
  'yw2a-unit6-hero': { title: '伟人故事：按顺序复述', topic: '按顺序复述', objective: '写人物的故事常按事情发展的顺序写：先发生什么，接着怎样，最后结果如何。能按「理清顺序、抓住细节、完整复述」三步完成本课练习。', outline: ['理清顺序', '抓住细节', '完整复述'], stepBriefs: [{ title: '理清顺序', body: '写人物的故事常按事情发展的顺序写：先发生什么，接着怎样，最后结果如何。读的时候理清顺序，就不容易乱。' } , { title: '抓住细节', body: '《大禹治水》里大禹三次路过家门都没有进去；《朱德的扁担》里朱德和战士们一起挑粮。抓住这些具体的事，人物就立起来了。' } , { title: '完整复述', body: '复述故事可以用「先……接着……然后……最后……」，还可以加上「为什么」，让听的人明白这件事的意义。' }] },
  'yw2a-unit7-imagine': { title: '想象世界：古诗与童话中的想象', topic: '古诗与童话中的想象', objective: '「危楼高百尺，手可摘星辰」——楼高得能摘到星星，这是诗人的想象。能按「找出想象、分辨真假、体会妙处」三步完成本课练习。', outline: ['找出想象', '分辨真假', '体会妙处'], stepBriefs: [{ title: '找出想象', body: '「危楼高百尺，手可摘星辰」——楼高得能摘到星星，这是诗人的想象。古诗常用夸张的想象写出奇特的感觉。' } , { title: '分辨真假', body: '《雾在哪里》把雾当成人来写，雾会藏东西；《雪孩子》里雪孩子会跑会救人。把物当人写，故事就有了生命。' } , { title: '体会妙处', body: '读想象的故事，要分清哪些是真实的、哪些是想象的，再想想作者为什么这样想象——想象是为了把感受写得更真切。' }] },
  'yw2a-unit8-animal': { title: '动物故事：读对话懂性格', topic: '读对话懂性格', objective: '动物故事里，动物会说话、会思考。能按「读对话、看提示语、想对错」三步完成本课练习。', outline: ['读对话', '看提示语', '想对错'], stepBriefs: [{ title: '读对话', body: '动物故事里，动物会说话、会思考。读对话就能看出它们是什么性格：《狐假虎威》里狐狸狡猾，《纸船和风筝》里小熊和松鼠真诚。' } , { title: '看提示语', body: '读对话要注意提示语：狐狸「神气活现」地说，松鼠「高兴」地喊。提示语里的词，就是性格的线索。' } , { title: '想对错', body: '读完后想一想：这些动物的做法对不对？如果是你，你会怎么做？' }] },
  'yw2b-unit1-findinfo': { title: '课文（一）春天：提取信息，从短文里找答案', topic: '提取信息，从短文里找答案', objective: '做题先读问题，带着问题去读短文——知道要找什么，眼睛才会「搜索」。能按「读清问题、回原文定位、圈出答案依据」三步完成本课练习。', outline: ['读清问题', '回原文定位', '圈出答案依据'], stepBriefs: [{ title: '读清问题', body: '做题先读问题，带着问题去读短文——知道要找什么，眼睛才会「搜索」。问题问「什么时候」，就盯表示时间的词；问「谁」，就盯人名。' } , { title: '回原文定位', body: '找到相关的句子别急着写，先把那句话完整读一遍，再圈出能回答问题的词语。答案要「有据可查」，依据就在原文里。' } , { title: '圈出答案依据', body: '回答时尽量用上原文的词，再补上自己的话把意思说完整。「因为……所以……」是说出依据的好帮手。' }] },
  'yw2b-unit2-guess-words': { title: '阅读方法：猜词义，联系上下文懂新词', topic: '猜词义，联系上下文懂新词', objective: '遇到不认识的词，先别查字典——读读它的前后句。能按「读前后句、找近义或解释、代回去验证」三步完成本课练习。', outline: ['读前后句', '找近义或解释', '代回去验证'], stepBriefs: [{ title: '读前后句', body: '遇到不认识的词，先别查字典——读读它的前后句。词语不是孤单的，前后的句子常常在悄悄解释它。' } , { title: '找近义或解释', body: '找线索的办法：前后句里有没有意思相近的词？有没有「就是说」「也就是」这样的解释信号？有没有例子可以推想？' } , { title: '代回去验证', body: '猜出意思后，把猜的意思代回句子里读一遍：通顺、合理，就说明猜对了。这个办法管用一辈子，越用越熟练。' }] },
  'yw2b-unit2-care': { title: '课文（二）关爱：从细节体会情感', topic: '从细节体会情感', objective: '写关爱的故事，都在写一件具体的事：雷锋叔叔帮助迷路的孩子，千人糕要很多人一起做。能按「读事情、找细节、体会情感」三步完成本课练习。', outline: ['读事情', '找细节', '体会情感'], stepBriefs: [{ title: '读事情', body: '写关爱的故事，都在写一件具体的事：雷锋叔叔帮助迷路的孩子，千人糕要很多人一起做。先读清事情，再体会情感。' } , { title: '找细节', body: '情感藏在细节里：一个动作、一句话、一个眼神。「一匹出色的马」里妹妹骑在爸爸背上的笑，就是家人之间的爱。' } , { title: '体会情感', body: '读完后想一想：这件事让你感动在哪里？如果换成你，你会怎么做？' }] },
  'yw2b-unit3-culture': { title: '识字与传统：在词语中认识文化', topic: '在词语中认识文化', objective: '识字课要先把字音读准、字形记牢。能按「读准字音、理解词义、联系文化」三步完成本课练习。', outline: ['读准字音', '理解词义', '联系文化'], stepBriefs: [{ title: '读准字音', body: '识字课要先把字音读准、字形记牢。「神州谣」里的「神州」指中国，「传统节日」里的节日都有来历。' } , { title: '理解词义', body: '理解词义可以联系生活：你过年时做过什么？端午吃什么？把词语和自己的生活连起来，记得更牢。' } , { title: '联系文化', body: '很多词语背后是文化：算盘是祖先的发明，「贝」字原来表示钱。学词语也是了解我们的文化。' }] },
  'yw2b-unit4-childhood': { title: '童年生活：读出童真童趣', topic: '读出童真童趣', objective: '写童年的文章都很有趣：彩色的梦、沙滩上的童话、变成小虫子。能按「读趣事、找想象、说感受」三步完成本课练习。', outline: ['读趣事', '找想象', '说感受'], stepBriefs: [{ title: '读趣事', body: '写童年的文章都很有趣：彩色的梦、沙滩上的童话、变成小虫子。读的时候要读出那份天真和快乐。' } , { title: '找想象', body: '童趣常常来自想象：把梦涂成彩色，把沙滩上的城堡当成真的国家。找出这些想象，就能读懂童心。' } , { title: '说感受', body: '读完后说说：哪件事让你想起自己的童年？把自己的感受说出来，就是和作者对话。' }] },
  'yw2b-unit5-lesson': { title: '寓言与道理：从故事中悟道理', topic: '从故事中悟道理', objective: '寓言故事里的人常常会犯错：《亡羊补牢》里羊丢了才修羊圈，《揠苗助长》里把禾苗拔高。能按「读故事、想错在哪、说道理」三步完成本课练习。', outline: ['读故事', '想错在哪', '说道理'], stepBriefs: [{ title: '读故事', body: '寓言故事里的人常常会犯错：《亡羊补牢》里羊丢了才修羊圈，《揠苗助长》里把禾苗拔高。先读清他们错在哪。' } , { title: '想错在哪', body: '想清楚错误的后果：羊又丢了，禾苗枯死了。从后果往回推，就明白故事想告诉我们什么。' } , { title: '说道理', body: '道理要能用在生活里：犯错后及时改正，做事不能违背规律。用自己的话把道理说出来。' }] },
  'yw2b-unit6-nature': { title: '自然与科学：读懂科普文章', topic: '读懂科普文章', objective: '科普文章讲的是自然现象和科学道理：《雷雨》写下雨前后的变化，《要是你在野外迷了路》讲怎么。能按「读懂现象、找出道理、说出依据」三步完成本课练习。', outline: ['读懂现象', '找出道理', '说出依据'], stepBriefs: [{ title: '读懂现象', body: '科普文章讲的是自然现象和科学道理：《雷雨》写下雨前后的变化，《要是你在野外迷了路》讲怎么用太阳和北极星辨方向。' } , { title: '找出道理', body: '读科普文要找出「为什么会这样」：雷雨前为什么闷？大树为什么能指方向？答案常常就在文章里。' } , { title: '说出依据', body: '读完后要能说出依据：不是「我觉得」，而是「文章里说」。这和大自然打交道一样，要有证据。' }] },
  'yw2b-unit7-change': { title: '改变故事：读懂成长与变化', topic: '读懂成长与变化', objective: '这类故事都在写「改变」：大象把耳朵竖起来又放下，蜘蛛开店一次次换招牌，小毛虫变成了蝴蝶。能按「读变化、想原因、说启示」三步完成本课练习。', outline: ['读变化', '想原因', '说启示'], stepBriefs: [{ title: '读变化', body: '这类故事都在写「改变」：大象把耳朵竖起来又放下，蜘蛛开店一次次换招牌，小毛虫变成了蝴蝶。' } , { title: '想原因', body: '想清楚为什么会变：大象听了别人的话，蜘蛛嫌麻烦，小毛虫努力长大。变化背后都有原因。' } , { title: '说启示', body: '从变化里想启示：适合别人的不一定适合自己；坚持做对的事，慢慢就会变好。' }] },
  'yw2b-unit8-myth': { title: '神话与想象：感受奇特的想象', topic: '感受奇特的想象', objective: '神话故事充满神奇的想象：羿射下九个太阳，当世界年纪还小的时候万物会说话。能按「读神奇、找想象、想妙处」三步完成本课练习。', outline: ['读神奇', '找想象', '想妙处'], stepBriefs: [{ title: '读神奇', body: '神话故事充满神奇的想象：羿射下九个太阳，当世界年纪还小的时候万物会说话。读的时候要感受那份神奇。' } , { title: '找想象', body: '找出文中不真实却让人觉得美的想象：祖先的摇篮是大森林，太阳会慢慢长大。这些想象让故事有了光彩。' } , { title: '想妙处', body: '想一想作者为什么这样想象：是为了让故事更美、更有力量，也让我们对世界多一些好奇。' }] },
  'yw2b-unit3-imagine': { title: '写话与想象：续编小故事', topic: '续编小故事', objective: '续编故事先抓住「故事线」：主角是谁、想要什么、遇到了什么困难。能按「抓住故事线、合理想象、结尾点题」三步完成本课练习。', outline: ['抓住故事线', '合理想象', '结尾点题'], stepBriefs: [{ title: '抓住故事线', body: '续编故事先抓住「故事线」：主角是谁、想要什么、遇到了什么困难。新编的内容要顺着这条线走，不能另起炉灶。' } , { title: '合理想象', body: '想象要大胆也要合理：主角可以用新的办法解决问题，但不能突然多出与开头无关的人物或法宝。' } , { title: '结尾点题', body: '好结尾会让故事「落地」：困难解决了没有？主角明白了什么？用一两句话点一点题，故事就完整了。' }] },
};
function getLessonContext(lessonId) {
  return LESSON_CONTEXTS[lessonId] ?? null;
}

/* CORS：webapp 预览(4174)/dev(4173) 跨源调用本代理；只放行本机来源，预检直接短路 */
const ALLOWED_ORIGINS = new Set(['http://127.0.0.1:4173', 'http://127.0.0.1:4174', 'http://localhost:4173', 'http://localhost:4174']);
function withCors(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('access-control-allow-origin', origin);
    res.setHeader('vary', 'origin');
  }
  res.setHeader('access-control-allow-methods', 'GET,POST,OPTIONS');
  res.setHeader('access-control-allow-headers', 'content-type');
  res.setHeader('access-control-max-age', '86400');
}

const server = createServer((req, res) => {
  withCors(req, res);
  if (req.method === 'OPTIONS') return json(res, 204, {});
  if (req.method === 'GET' && req.url === '/health') {
    return json(res, 200, { ok: true, configured: Boolean(API_KEY), model: MODEL, requests, failures });
  }
  /* 课程上下文查询（OpenMAIC BFF 课件生成用）：按 lessonId 返回本课标题/目标/目录/步骤摘要 */
  if (req.method === 'GET' && req.url.startsWith('/api/lesson-context')) {
    const q = new URL(req.url, 'http://x').searchParams;
    const lessonId = q.get('lessonId');
    const lesson = lessonId ? getLessonContext(lessonId) : null;
    return json(res, 200, lesson ? { ok: true, lesson } : { ok: false, error: 'lesson-not-found' });
  }
  /* 配置读写（UI 面板用）：密钥只返回是否存在与末 4 位，不回传原文 */
  if (req.method === 'GET' && req.url === '/config') {
    return json(res, 200, {
      ok: true,
      hasKey: Boolean(API_KEY),
      keyHint: API_KEY ? `${API_KEY.slice(0, 4)}****${API_KEY.slice(-4)}` : '',
      apiBase: API_BASE,
      model: MODEL,
      configFile: CONFIG_FILE,
    });
  }
  /* 上游探活：真实调用一次上游（最小 prompt），提前暴露密钥错误/地址不对/模型不存在 */
  if (req.method === 'POST' && req.url === '/probe') {
    if (!API_KEY) return json(res, 200, { ok: false, error: 'not-configured', detail: '代理尚未配置密钥' });
    void (async () => {
      try {
        const upstream = await callUpstream([{ role: 'user', content: '请输出 json 对象 {"ok":true}。' }]);
        if (!upstream.ok) {
          console.log(`[ai-proxy] probe upstream-${upstream.status} fail`);
          return json(res, 200, { ok: false, error: 'upstream', detail: `上游 ${upstream.status}：${upstream.detail.slice(0, 160)}` });
        }
        console.log('[ai-proxy] probe ok');
        return json(res, 200, { ok: true, model: MODEL });
      } catch { return json(res, 200, { ok: false, error: 'probe-crashed', detail: '探活过程异常' }); }
    })();
    return;
  }
  if (req.method === 'POST' && req.url === '/config') {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; if (raw.length > 64 * 1024) req.destroy(); });
    req.on('end', () => {
      try {
        const body = JSON.parse(raw);
        const patch = {};
        if (typeof body.apiKey === 'string' && body.apiKey.trim()) patch.apiKey = body.apiKey.trim();
        if (typeof body.apiBase === 'string' && /^https?:\/\/.+/.test(body.apiBase)) patch.apiBase = body.apiBase.trim();
        if (typeof body.model === 'string' && body.model.trim()) patch.model = body.model.trim();
        if (Object.keys(patch).length === 0) return json(res, 400, { ok: false, error: 'no valid fields' });
        if (!persistFileConfig(patch)) return json(res, 500, { ok: false, error: 'persist-failed' });
        if (patch.apiKey) API_KEY = patch.apiKey;
        if (patch.apiBase) API_BASE = patch.apiBase;
        if (patch.model) MODEL = patch.model;
        console.log(`[ai-proxy] config updated: model=${MODEL} hasKey=${Boolean(API_KEY)}`);
        return json(res, 200, { ok: true, hasKey: Boolean(API_KEY), keyHint: API_KEY ? `${API_KEY.slice(0, 4)}****${API_KEY.slice(-4)}` : '', apiBase: API_BASE, model: MODEL });
      } catch { return json(res, 400, { ok: false, error: 'bad-json' }); }
    });
    return;
  }
  if (req.method !== 'POST' || !req.url.startsWith('/api/ai/')) {
    return json(res, 404, { ok: false, error: 'not found' });
  }
  if (!API_KEY) {
    return json(res, 503, { ok: false, error: 'not-configured', message: '未配置 AI_PROXY_API_KEY，降级为本地演示。' });
  }
  let raw = '';
  req.on('data', (chunk) => { raw += chunk; if (raw.length > 256 * 1024) req.destroy(); });
    req.on('end', async () => {
    const startedAt = Date.now();
    requests += 1;
    let kind = 'lesson';
    try {
      const body = JSON.parse(raw);
      kind = body.kind === 'grading' ? 'grading' : body.kind === 'quiz' ? 'quiz' : 'lesson';
      /* quiz 附加约束：选择题必须有恰好 4 个选项；步驟题建议给踩点（keyPoints），供本地确定性批改踩点给分 */
      const quizHint = kind === 'quiz' ? '选择题必须给出恰好 4 个选项；步骤题请提供 keyPoints（每组为可接受的同义表达）与 keyPointLabels。' : '';
      const messages = [
        { role: 'system', content: `${SYSTEM_PROMPT}\n输出 JSON 必须符合：${JSON.stringify(kind === 'grading' ? gradingSchema : kind === 'quiz' ? quizSchema : lessonSchema)}${quizHint}` },
        /* DeepSeek 等供应商要求 'json' 出现在用户消息中才允许 response_format:json_object */
        { role: 'user', content: `${body.prompt ?? ''}\n（请以 json 对象形式输出，字段符合上述要求。）` },
      ];
      const upstream = await callUpstream(messages);
      if (!upstream.ok) {
        failures += 1;
        console.log(`[ai-proxy] ${kind} upstream-${upstream.status} ${Date.now() - startedAt}ms`);
        return json(res, 502, { ok: false, error: 'upstream', detail: upstream.detail });
      }
      let content;
      try { content = JSON.parse(upstream.content); } catch { failures += 1; return json(res, 502, { ok: false, error: 'bad-json' }); }
      console.log(`[ai-proxy] ${kind} ok ${Date.now() - startedAt}ms`);
      return json(res, 200, { ok: true, kind, content });
    } catch {
      failures += 1;
      return json(res, 400, { ok: false, error: 'bad-request' });
    }
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[ai-proxy] listening on 127.0.0.1:${PORT} model=${MODEL} configured=${Boolean(API_KEY)}`);
});
