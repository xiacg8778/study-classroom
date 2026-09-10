import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  loadAiConfig,
  saveAiConfig,
  probeAiProxy,
} from '../../src/services/aiRuntimeConfig';

describe('aiRuntimeConfig', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('defaults to build env and persists patches', () => {
    /* vitest.config.ts 注入 VITE_AI_MODE=ai（供适配器增强路径单测使用），故默认 enabled=true */
    const first = loadAiConfig();
    expect(first.enabled).toBe(true);
    expect(first.port).toBe('4610');

    const saved = saveAiConfig({ enabled: false, port: '5100' });
    expect(saved).toEqual({ enabled: false, port: '5100' });
    expect(loadAiConfig()).toEqual({ enabled: false, port: '5100' });
  });

  it('normalizes invalid port back to default and ignores non-boolean enabled', () => {
    saveAiConfig({ port: 'abc' });
    expect(loadAiConfig().port).toBe('4610');
    saveAiConfig({ port: '12' });
    expect(loadAiConfig().port).toBe('12');
    saveAiConfig({ port: '123456' });
    expect(loadAiConfig().port).toBe('4610');
  });

  it('probes online proxy with configured key and model', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true, configured: true, model: 'glm-4-flash' }), { status: 200 })));
    const result = await probeAiProxy('4610');
    expect(result).toEqual({ online: true, configured: true, model: 'glm-4-flash', error: undefined });
  });

  it('reports offline when proxy is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('connection refused')));
    const result = await probeAiProxy('4610');
    expect(result.online).toBe(false);
    expect(result.configured).toBe(false);
    expect(result.error).toBeTruthy();
  });
});
