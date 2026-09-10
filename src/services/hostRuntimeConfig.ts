/**
 * 宿主连接运行时配置（localStorage，当前标签页持久）。
 *
 * 与 aiRuntimeConfig 同模式：UI 可改端口/开关；enabled=false 或 BFF 探活失败时
 * 回退 UnavailableHostCommitAdapter 行为（候选不提交）。
 *
 * 边界：宿主 BFF 是本机服务，登记册在本机 ~/.host-bff/registry.json；无跨设备同步。
 */
export interface HostRuntimeConfig {
  enabled: boolean;
  port: string;
}

const STORAGE_KEY = 'paper-desk.host-config';

function defaultConfig(): HostRuntimeConfig {
  return {
    enabled: false,
    port: '4630',
  };
}

function normalize(raw: Partial<HostRuntimeConfig> | null): HostRuntimeConfig {
  const base = defaultConfig();
  if (!raw) return base;
  return {
    enabled: typeof raw.enabled === 'boolean' ? raw.enabled : base.enabled,
    port: typeof raw.port === 'string' && /^\d{2,5}$/.test(raw.port) ? raw.port : base.port,
  };
}

export function loadHostConfig(): HostRuntimeConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return normalize(raw ? (JSON.parse(raw) as Partial<HostRuntimeConfig>) : null);
  } catch { return defaultConfig(); }
}

export function saveHostConfig(patch: Partial<HostRuntimeConfig>): HostRuntimeConfig {
  const next = normalize({ ...loadHostConfig(), ...patch });
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {/* 存储不可用时仅当前会话生效 */}
  return next;
}

export interface HostProbeResult { online: boolean; registrations?: number; error?: string; }

/** 探活宿主 BFF：返回在线状态与登记数（不抛异常） */
export async function probeHostBff(port: string): Promise<HostProbeResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const response = await fetch(`http://127.0.0.1:${port}/health`, { signal: controller.signal });
    const payload = await response.json().catch(() => null) as { ok?: boolean; registrations?: number } | null;
    if (payload?.ok) return { online: true, registrations: payload.registrations };
    return { online: false, error: '响应异常' };
  } catch (error) {
    return { online: false, error: error instanceof DOMException && error.name === 'AbortError' ? '超时' : '无法连接' };
  } finally {
    clearTimeout(timer);
  }
}
