import { describe, expect, it, vi, beforeEach } from 'vitest';
import { BrowserSpeechAdapter } from '../../src/adapters/speech/BrowserSpeechAdapter';

/* jsdom 没有 speechSynthesis：用最小桩模拟（speaking/pending 状态 + utterance 队列） */
class FakeUtterance {
  lang = '';
  rate = 1;
  text: string;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(text: string) { this.text = text; }
}

const installSpeech = () => {
  const state = { speaking: false, pending: false, queue: [] as FakeUtterance[] };
  const synth = {
    speaking: false,
    pending: false,
    cancel: vi.fn(() => { state.speaking = false; state.pending = false; state.queue = []; }),
    speak: vi.fn((u: FakeUtterance) => { state.speaking = true; state.queue.push(u); }),
    /* 测试辅助：让当前 utterance 自然结束 */
    __finishCurrent: () => {
      const u = state.queue[0];
      if (!u) return;
      state.queue.shift();
      state.speaking = state.queue.length > 0;
      state.pending = state.queue.length > 0;
      u.onend?.();
    },
  };
  (globalThis as Record<string, unknown>).speechSynthesis = synth;
  (globalThis as Record<string, unknown>).SpeechSynthesisUtterance = FakeUtterance;
  return { synth: synth as typeof synth & { __finishCurrent: () => void }, state };
};

describe('BrowserSpeechAdapter', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    const { synth, state } = installSpeech();
    (globalThis as Record<string, unknown>).__speechCtx = { synth, state };
  });

  it('speak uses zh-CN with slowed rate (young learners)', () => {
    const adapter = new BrowserSpeechAdapter();
    adapter.speak('厘米和米');
    const synth = (globalThis as typeof globalThis & { speechSynthesis: { speak: ReturnType<typeof vi.fn> } }).speechSynthesis;
    expect(synth.speak).toHaveBeenCalledTimes(1);
    const u = (synth.speak.mock.calls[0]?.[0] ?? {}) as FakeUtterance;
    expect(u.lang).toBe('zh-CN');
    expect(u.rate).toBeLessThan(1);
  });

  it('muted speak does not reach synthesis at all', () => {
    const adapter = new BrowserSpeechAdapter();
    adapter.setMuted(true);
    adapter.speak('静音测试');
    adapter.speakSegments(['静音', '分段']);
    const synth = (globalThis as typeof globalThis & { speechSynthesis: { speak: ReturnType<typeof vi.fn> } }).speechSynthesis;
    expect(synth.speak).not.toHaveBeenCalled();
  });

  it('speakSegments queues one utterance per segment and fires onEnd after last', () => {
    vi.useFakeTimers();
    const adapter = new BrowserSpeechAdapter();
    const onEnd = vi.fn();
    adapter.onEnd(onEnd);
    adapter.speakSegments(['看刻度尺', '刻度0是起点', '1米等于100厘米']);
    const ctx = (globalThis as typeof globalThis & { __speechCtx: { synth: { speak: ReturnType<typeof vi.fn> } } }).__speechCtx;
    expect(ctx.synth.speak).toHaveBeenCalledTimes(1); /* 先只发第一段 */
    /* 逐段自然结束 */
    for (let i = 0; i < 2; i++) {
      vi.runAllTimers();
      const synth = (globalThis as typeof globalThis & { speechSynthesis: { __finishCurrent: () => void } }).speechSynthesis as unknown as { __finishCurrent: () => void };
      synth.__finishCurrent();
      vi.runAllTimers();
    }
    /* 最后一段结束 */
    const synth2 = (globalThis as typeof globalThis & { speechSynthesis: { __finishCurrent: () => void } }).speechSynthesis as unknown as { __finishCurrent: () => void };
    synth2.__finishCurrent();
    vi.runAllTimers();
    expect(onEnd).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('onEnd unsubscribe works', () => {
    const adapter = new BrowserSpeechAdapter();
    const onEnd = vi.fn();
    const off = adapter.onEnd(onEnd);
    off();
    (adapter as unknown as { emitEnd: () => void }).emitEnd();
    expect(onEnd).not.toHaveBeenCalled();
  });
});
