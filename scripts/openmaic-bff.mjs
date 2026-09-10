#!/usr/bin/env node
/**
 * OpenMAIC BFF（本地互动课堂运行时）—— 组件 37 的本地落地实现。
 *
 * 角色：模拟 OpenMAIC runtime 的课件会话与互动 callback。webapp 的 OpenMAICAdapter
 * 经此生成课件式微课堂，并把学习者的课件互动回传（callback）。
 *
 * 出 HOLD 五项前置在本服务的对应实现（PRD P2）：
 * 1. callback        —— POST /v1/interactive/callback：互动事件回传，校验后登记并回 ack
 * 2. 乱序/重复/旧版本 —— seq 单调校验（乱序拒绝）、idempotencyKey 去重（重复返回原 ack）、
 *                       baseContextVersion 必须等于会话当前版本（旧版本拒绝 VERSION_STALE）
 * 3. kernel closure   —— 本服务只生成"课件会话与互动记录"，绝不生成下一课/掌握度决策；
 *                       响应中 schedulerAuthority 恒为 'kernel-10'（调用方职责），自身不做调度
 * 4. 24 prepare       —— 互动产物只作为 evidenceCursor 附加材料返回给调用方，
 *                       由调用方走既有 closeLearningUnit → prepareRegistration → HostCommit 链
 * 5. 回滚             —— 会话可显式 rollback：终止会话并作废全部未回调互动，不留半状态
 *
 * 端点：
 * - POST /v1/lessons:open      开课件会话（返回课件步骤 + sessionToken + currentVersion）
 * - POST /v1/interactive/callback  互动事件回传（seq/幂等/版本三重校验）
 * - POST /v1/lessons:rollback  回滚会话（作废互动，状态置 rolled_back）
 * - GET  /health
 *
 * 启动：node scripts/openmaic-bff.mjs --port 4640
 */
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { buildTemplateCourseware, buildCoursewarePrompt, validateCourseware } from './lib/courseware-core.mjs';

function parsePort() {
  const i = process.argv.indexOf('--port');
  if (i > -1 && process.argv[i + 1] && /^\d{2,5}$/.test(process.argv[i + 1])) return Number(process.argv[i + 1]);
  const env = Number(process.env.OPENMAIC_BFF_PORT);
  return Number.isInteger(env) && env > 1024 ? env : 4640;
}
const PORT = parsePort();
const DATA_DIR = join(homedir(), '.openmaic-bff');
const SESSIONS_FILE = join(DATA_DIR, 'sessions.json');

/* ---------- 会话存储 ---------- */
function loadStore() {
  try {
    if (!existsSync(SESSIONS_FILE)) return { version: 1, sessions: {} };
    const parsed = JSON.parse(readFileSync(SESSIONS_FILE, 'utf8'));
    return parsed?.sessions ? parsed : { version: 1, sessions: {} };
  } catch { return { version: 1, sessions: {} }; }
}
function saveStore(store) {
  mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${SESSIONS_FILE}.tmp`;
  writeFileSync(tmp, JSON.stringify(store, null, 2));
  writeFileSync(SESSIONS_FILE, JSON.stringify(store, null, 2));
}

/* ---------- 课件生成：LLM 实时生成优先，本地模板降级 ---------- */
const AI_PROXY_PORT = process.env.AI_PROXY_PORT ?? '4610';
/* 教材库服务端口（提供课程上下文查询）——与 ai-proxy 同进程（host-bff） */
const BFF_API_PORT = process.env.BFF_API_PORT ?? '4610';
/* 从 AI 代理响应解析出课件 JSON（容错：剥 ```json 围栏、截取首个 { 到末个 }） */
function parseAiContent(content) {
  /* 代理已解析好对象则直接用；字符串则剥围栏后抽取 JSON */
  if (content && typeof content === 'object') return content;
  if (typeof content !== 'string' || !content.trim()) return null;
  const text = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first === -1 || last <= first) return null;
  try { return JSON.parse(text.slice(first, last + 1)); } catch { return null; }
}
async function generateCourseware({ lessonId, problemText }) {
  /* 课程上下文：从教材库取本课的标题/目标/步骤/正文摘要，让 LLM 与模板兜底都紧扣本课主题（此前只传 lessonId，厘米和米课降级后错配成竖式加法演示） */
  let lesson;
  if (lessonId) {
    try {
      const res = await fetch(`http://127.0.0.1:${BFF_API_PORT}/api/lesson-context?lessonId=${encodeURIComponent(lessonId)}`);
      if (res.ok) {
        const payload = await res.json().catch(() => null);
        if (payload?.ok && payload.lesson?.objective) lesson = payload.lesson;
      }
    } catch { /* 上下文取不到就用无课程模板，不阻断开课 */ }
  }
  const template = buildTemplateCourseware({ lessonId, problemText, lesson });
  /* LLM 实时生成：经本机 AI 代理（密钥在代理侧，BFF 不持有）；55s 超时，任何失败回退模板 */
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 55000);
    const res = await fetch(`http://127.0.0.1:${AI_PROXY_PORT}/api/ai/lesson`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ prompt: buildCoursewarePrompt({ lessonId, problemText, lesson }) }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    const payload = await res.json().catch(() => null);
    if (payload?.ok && payload.content) {
      const validated = validateCourseware(parseAiContent(payload.content));
      if (validated) {
        /* 主题一致性兜底校验：课程上下文存在时，课件内容至少要提到本课标题/目标中的关键词，否则拒绝（防 LLM 跑题） */
        if (lesson?.title) {
          const keywords = [lesson.title, lesson.topic].filter(Boolean).map((t) => String(t).replace(/\s+/g, ''));
          const content = `${validated.title}${validated.objective}${validated.steps.map((s) => s.title + s.body).join('')}`.replace(/\s+/g, '');
          const onTopic = keywords.some((kw) => content.includes(kw.slice(0, 3)));
          if (!onTopic) {
            console.log(`[openmaic] llm courseware off-topic (expected: ${keywords.join('/')}) -> template fallback`);
            return { ...template, source: 'template' };
          }
        }
        return { ...validated, source: 'llm' };
      }
      console.log('[openmaic] llm courseware rejected by validator -> template fallback');
    }
  } catch { /* 代理离线/超时：静默走模板 */ }
  return { ...template, source: 'template' };
}
/* ---------- HTTP ---------- */
let requests = 0;
/* CORS：预览服务可能只绑 IPv6（应用托管自动拉起），同时放行 127.0.0.1 与 localhost 两个来源 */
const ALLOWED_ORIGINS = new Set(['http://127.0.0.1:4174', 'http://localhost:4174']);
function corsOrigin(req) {
  const origin = req.headers.origin;
  return origin && ALLOWED_ORIGINS.has(origin) ? origin : 'http://127.0.0.1:4174';
}
function json(res, status, body, req) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': corsOrigin(req),
    'access-control-allow-headers': 'content-type',
  });
  res.end(JSON.stringify(body));
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => { data += c; if (data.length > 1_000_000) { reject(new Error('body-too-large')); req.destroy(); } });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

import { createServer } from 'node:http';
createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'access-control-allow-origin': corsOrigin(req),
      'access-control-allow-methods': 'GET,POST',
      'access-control-allow-headers': 'content-type',
    });
    return res.end();
  }
  const url = req.url.split('?')[0];
  try {
    if (req.method === 'GET' && url === '/health') {
      const store = loadStore();
      requests += 1;
      return json(res, 200, { ok: true, configured: true, sessions: Object.keys(store.sessions).length, requests }, req);
    }

    /* 开课件会话 */
    if (req.method === 'POST' && url === '/v1/lessons:open') {
      requests += 1;
      const body = JSON.parse(await readBody(req));
      const { lessonId, learnerId, baseContextVersion, problemText } = body ?? {};
      if (!learnerId || !Number.isInteger(baseContextVersion)) return json(res, 422, { ok: false, error: 'validation', detail: 'learnerId 与 baseContextVersion 必填' }, req);
      const generated = await generateCourseware({ lessonId, problemText });
      /* 会话存储不需要来源标记（source 仅用于日志/诊断），此处排除 */
      const courseware = { ...generated };
      delete courseware.source;
      const sessionToken = `omc-s-${createHash('sha256').update(`${learnerId}:${Date.now()}:${Math.random()}`).digest('hex').slice(0, 14)}`;
      const store = loadStore();
      store.sessions[sessionToken] = {
        sessionToken, learnerId, lessonId: lessonId ?? null,
        baseContextVersion, currentVersion: baseContextVersion,
        expectedSeq: 1, status: 'active',
        callbacks: [], openedAt: new Date().toISOString(),
        coursewareId: courseware.coursewareId,
      };
      saveStore(store);
      console.log(`[openmaic] session opened ${sessionToken} learner=${learnerId}`);
      return json(res, 200, { ok: true, sessionToken, currentVersion: baseContextVersion, courseware }, req);
    }

    /* 互动 callback：乱序/重复/旧版本三重校验（出 HOLD 前置 1+2） */
    if (req.method === 'POST' && url === '/v1/interactive/callback') {
      requests += 1;
      const body = JSON.parse(await readBody(req));
      const { sessionToken, seq, idempotencyKey, baseContextVersion, interaction } = body ?? {};
      const store = loadStore();
      const session = store.sessions[sessionToken];
      if (!session || session.status !== 'active') return json(res, 404, { ok: false, error: 'session-not-found' }, req);
      if (!Number.isInteger(seq)) return json(res, 422, { ok: false, error: 'validation', detail: 'seq 必须是整数' }, req);
      /* 重复：同 idempotencyKey 重放返回原 ack */
      const existing = session.callbacks.find((c) => c.idempotencyKey === idempotencyKey);
      if (existing) return json(res, 200, { ok: true, ack: existing.ack, replayed: true }, req);
      /* 旧版本 */
      if (baseContextVersion !== session.currentVersion) {
        return json(res, 409, { ok: false, error: 'VERSION_STALE', detail: `会话当前版本 ${session.currentVersion}，请求携带 ${baseContextVersion}` }, req);
      }
      /* 乱序 */
      if (seq !== session.expectedSeq) {
        return json(res, 409, { ok: false, error: 'SEQ_OUT_OF_ORDER', detail: `期望 seq=${session.expectedSeq}，收到 seq=${seq}` }, req);
      }
      if (!interaction?.type) return json(res, 422, { ok: false, error: 'validation', detail: 'interaction.type 必填' }, req);
      const ack = `omc-ack-${createHash('sha256').update(`${sessionToken}:${seq}:${idempotencyKey}`).digest('hex').slice(0, 12)}`;
      session.callbacks.push({ seq, idempotencyKey, interactionType: interaction.type, ack, at: new Date().toISOString() });
      session.expectedSeq = seq + 1;
      saveStore(store);
      console.log(`[openmaic] callback ${ack} seq=${seq} type=${interaction.type}`);
      /* kernel closure（前置 3）：ack 只确认"互动已记录"；不返回任何调度决策 */
      return json(res, 200, { ok: true, ack, replayed: false, recorded: session.callbacks.length, schedulerAuthority: 'kernel-10' }, req);
    }

    /* 回滚（出 HOLD 前置 5）：作废全部未确认互动，会话不留半状态 */
    if (req.method === 'POST' && url === '/v1/lessons:rollback') {
      requests += 1;
      const body = JSON.parse(await readBody(req));
      const store = loadStore();
      const session = store.sessions[body?.sessionToken];
      if (!session) return json(res, 404, { ok: false, error: 'session-not-found' }, req);
      const voided = session.callbacks.length;
      session.status = 'rolled_back';
      session.rolledBackAt = new Date().toISOString();
      saveStore(store);
      console.log(`[openmaic] session rolled back ${session.sessionToken} voided=${voided}`);
      return json(res, 200, { ok: true, status: 'rolled_back', voidedCallbacks: voided }, req);
    }

    return json(res, 404, { ok: false, error: 'not-found' }, req);
  } catch (error) {
    return json(res, 500, { ok: false, error: 'internal', detail: String(error?.message ?? error).slice(0, 120) }, req);
  }
}).listen(PORT, '127.0.0.1', () => {
  console.log(`[openmaic] listening on 127.0.0.1:${PORT} store=${SESSIONS_FILE}`);
});
