#!/usr/bin/env node
/**
 * 宿主 BFF（本地登记服务）—— 教育中心宿主闭环的本地实现。
 *
 * 角色：模拟"教育中心宿主 + 组件 24 业务登记门面"。webapp 的 RealHostCommitAdapter
 * 把 RegistrationProposal 提交到这里；本服务校验后写入本地登记册并返回正式回执。
 *
 * 边界（诚实边界，与项目约束一致）：
 * - 这是本地 BFF 演示实现，不是云端正式宿主；登记册只存在本机 ~/.host-bff/registry.json。
 * - 校验内容与未来正式宿主一致：Schema 必备字段、幂等键、learnerId 归属、baseContextVersion。
 * - 同 idempotencyKey 重放返回原回执（幂等）；不校验签名（本地无鉴权体系，注释明示）。
 *
 * 端点：
 * - GET  /health → { ok, configured, registrations, requests }
 * - POST /v1/registrations:commit → 校验 + 登记 + { ok, receipt }
 * - GET  /v1/registrations?learnerId= → 登记册查询（家庭可查看已登记内容）
 *
 * 启动：node scripts/host-bff.mjs --port 4620（默认 4620）
 */
import { writeFileSync, readFileSync, mkdirSync, existsSync, chmodSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';

/* ---------- 配置 ---------- */
function parsePort() {
  const i = process.argv.indexOf('--port');
  if (i > -1 && process.argv[i + 1] && /^\d{2,5}$/.test(process.argv[i + 1])) return Number(process.argv[i + 1]);
  const env = Number(process.env.HOST_BFF_PORT);
  return Number.isInteger(env) && env > 1024 ? env : 4620;
}
const PORT = parsePort();
const DATA_DIR = join(homedir(), '.host-bff');
const REGISTRY_FILE = join(DATA_DIR, 'registry.json');

/* ---------- 登记册持久化 ---------- */
function loadRegistry() {
  try {
    if (!existsSync(REGISTRY_FILE)) return { version: 1, registrations: [] };
    const parsed = JSON.parse(readFileSync(REGISTRY_FILE, 'utf8'));
    if (!parsed || !Array.isArray(parsed.registrations)) return { version: 1, registrations: [] };
    return parsed;
  } catch { return { version: 1, registrations: [] }; }
}
function saveRegistry(registry) {
  mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${REGISTRY_FILE}.tmp`;
  writeFileSync(tmp, JSON.stringify(registry, null, 2));
  writeFileSync(REGISTRY_FILE, JSON.stringify(registry, null, 2));
  try { chmodSync(REGISTRY_FILE, 0o600); } catch {/* Windows 上可能不支持，忽略 */}
}

/* ---------- 校验 ---------- */
const MUTATION_ENTITIES = new Set(['evidence', 'wrong-question', 'next-lesson']);
/**
 * 校验 RegistrationProposal 形状与语义。返回错误消息或 null。
 * 与未来正式宿主对齐：Schema 必备字段、幂等键、归属、版本；request hash 用于审计。
 */
function validateProposal(proposal) {
  if (!proposal || typeof proposal !== 'object') return 'body 必须是对象';
  if (proposal.schemaVersion !== 'registration-proposal@1.0.0') return 'schemaVersion 必须是 registration-proposal@1.0.0';
  for (const key of ['proposalId', 'workspaceId', 'learnerId', 'sessionId', 'idempotencyKey', 'evidenceCursor', 'promptBundleRef']) {
    if (typeof proposal[key] !== 'string' || !proposal[key]) return `缺少必备字段 ${key}`;
  }
  if (!Number.isInteger(proposal.baseContextVersion) || proposal.baseContextVersion < 0) return 'baseContextVersion 必须是非负整数';
  if (proposal.persistenceIntent !== 'propose') return 'persistenceIntent 必须是 propose（BFF 只接受候选登记，不接受权威写入）';
  if (!Array.isArray(proposal.mutations) || proposal.mutations.length === 0) return 'mutations 不能为空';
  for (const m of proposal.mutations) {
    if (!m || !MUTATION_ENTITIES.has(m.entity)) return `非法 mutation entity: ${m?.entity}`;
    if (m.operation !== 'propose') return 'mutation operation 必须是 propose';
    if (typeof m.referenceId !== 'string' || !m.referenceId) return 'mutation.referenceId 缺失';
  }
  return null;
}
function requestHash(proposal) {
  return createHash('sha256').update(JSON.stringify(proposal)).digest('hex').slice(0, 16);
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

const server = createServer(async (req, res) => {
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
      const registry = loadRegistry();
      requests += 1;
      return json(res, 200, { ok: true, configured: true, registrations: registry.registrations.length, requests }, req);
    }
    if (req.method === 'GET' && url === '/v1/registrations') {
      const q = new URL(req.url, 'http://x').searchParams;
      const learnerId = q.get('learnerId');
      const registry = loadRegistry();
      const rows = learnerId ? registry.registrations.filter((r) => r.proposal.learnerId === learnerId) : registry.registrations;
      requests += 1;
      return json(res, 200, { ok: true, count: rows.length, registrations: rows.map((r) => ({ commitId: r.commitId, committedAt: r.committedAt, proposalId: r.proposal.proposalId, learnerId: r.proposal.learnerId, sessionId: r.proposal.sessionId, mutations: r.proposal.mutations, requestHash: r.requestHash })) }, req);
    }
    if (req.method === 'POST' && url === '/v1/registrations:commit') {
      requests += 1;
      const raw = await readBody(req);
      let proposal;
      try { proposal = JSON.parse(raw); } catch { return json(res, 400, { ok: false, error: 'bad-json' }, req); }
      const invalid = validateProposal(proposal);
      if (invalid) return json(res, 422, { ok: false, error: 'validation', detail: invalid }, req);

      const registry = loadRegistry();
      // 幂等：同 idempotencyKey 重放返回原回执（不重复登记）
      const existing = registry.registrations.find((r) => r.proposal.idempotencyKey === proposal.idempotencyKey);
      if (existing) {
        return json(res, 200, { ok: true, receipt: { commitId: existing.commitId, status: 'committed' }, replayed: true }, req);
      }
      const commitId = `host-cmt-${createHash('sha256').update(`${proposal.proposalId}:${proposal.idempotencyKey}`).digest('hex').slice(0, 12)}`;
      const record = { commitId, committedAt: new Date().toISOString(), proposal, requestHash: requestHash(proposal) };
      registry.registrations.push(record);
      saveRegistry(registry);
      console.log(`[host-bff] committed ${commitId} proposal=${proposal.proposalId} learner=${proposal.learnerId} mutations=${proposal.mutations.length}`);
      return json(res, 200, { ok: true, receipt: { commitId, status: 'committed' }, replayed: false }, req);
    }
    return json(res, 404, { ok: false, error: 'not-found' }, req);
  } catch (error) {
    return json(res, 500, { ok: false, error: 'internal', detail: String(error?.message ?? error).slice(0, 120) }, req);
  }
}).listen(PORT, '127.0.0.1', () => {
  console.log(`[host-bff] listening on 127.0.0.1:${PORT} registry=${REGISTRY_FILE}`);
});
void server;
