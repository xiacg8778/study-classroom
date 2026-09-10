/**
 * OpenMAIC 交互会话配置（localStorage，当前标签页持久）。
 * 与 hostRuntimeConfig 同模式：enabled/port，数据控制页可改。
 */
export interface OpenmaicRuntimeConfig {
  enabled: boolean;
  port: string;
}

const STORAGE_KEY = 'paper-desk.openmaic-config';

function defaultConfig(): OpenmaicRuntimeConfig {
  return { enabled: false, port: '4640' };
}

function normalize(raw: Partial<OpenmaicRuntimeConfig> | null): OpenmaicRuntimeConfig {
  const base = defaultConfig();
  if (!raw) return base;
  return {
    enabled: typeof raw.enabled === 'boolean' ? raw.enabled : base.enabled,
    port: typeof raw.port === 'string' && /^\d{2,5}$/.test(raw.port) ? raw.port : base.port,
  };
}

export function loadOpenmaicConfig(): OpenmaicRuntimeConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return normalize(raw ? (JSON.parse(raw) as Partial<OpenmaicRuntimeConfig>) : null);
  } catch { return defaultConfig(); }
}

export function saveOpenmaicConfig(patch: Partial<OpenmaicRuntimeConfig>): OpenmaicRuntimeConfig {
  const next = normalize({ ...loadOpenmaicConfig(), ...patch });
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {/* 当前会话生效即可 */}
  return next;
}

export interface OpenmaicProbeResult { online: boolean; sessions?: number; error?: string; }

export async function probeOpenmaicBff(port: string): Promise<OpenmaicProbeResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const response = await fetch(`http://127.0.0.1:${port}/health`, { signal: controller.signal });
    const payload = await response.json().catch(() => null) as { ok?: boolean; sessions?: number } | null;
    if (payload?.ok) return { online: true, sessions: payload.sessions };
    return { online: false, error: '响应异常' };
  } catch (error) {
    return { online: false, error: error instanceof DOMException && error.name === 'AbortError' ? '超时' : '无法连接' };
  } finally {
    clearTimeout(timer);
  }
}
