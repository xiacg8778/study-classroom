import type { SpeechPort } from '../ports/SpeechPort';

/* 朗读状态监听：组件可感知「读完了」（如自动读下一题、按钮态恢复） */
export type SpeechEndListener = () => void;

export class BrowserSpeechAdapter implements SpeechPort {
  private muted = false;
  private endListeners = new Set<SpeechEndListener>();

  public supported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  }

  public speak(text: string): void {
    if (!this.supported() || this.muted) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.92;
    this.attachEnd(utterance);
    window.speechSynthesis.speak(utterance);
  }

  /* 分段朗读：每段单独 utterance（标题/正文分开发音更自然，段间留短停顿）；
     onend 里 cancel() 也会触发 → 用队列状态区分自然结束与人为打断，打断即停止后续段 */
  public speakSegments(segments: string[]): void {
    const parts = segments.map((s) => s.trim()).filter(Boolean);
    if (!parts.length) return;
    if (!this.supported() || this.muted) return;
    window.speechSynthesis.cancel();
    const speakAt = (index: number): void => {
      if (index >= parts.length) { this.emitEnd(); return; }
      if (this.muted) return;
      const utterance = new SpeechSynthesisUtterance(parts[index]);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.92;
      utterance.onend = () => {
        if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
          window.setTimeout(() => speakAt(index + 1), 120);
        } else {
          this.emitEnd();
        }
      };
      utterance.onerror = () => this.emitEnd();
      window.speechSynthesis.speak(utterance);
    };
    speakAt(0);
  }

  public onEnd(listener: SpeechEndListener): () => void {
    this.endListeners.add(listener);
    return () => { this.endListeners.delete(listener); };
  }

  public pause(): void { if (this.supported()) window.speechSynthesis.pause(); }
  public resume(): void { if (this.supported() && !this.muted) window.speechSynthesis.resume(); }
  public stop(): void { if (this.supported()) window.speechSynthesis.cancel(); }
  public setMuted(muted: boolean): void { this.muted = muted; if (muted) this.stop(); }

  private attachEnd(utterance: SpeechSynthesisUtterance): void {
    utterance.onend = () => this.emitEnd();
    utterance.onerror = () => this.emitEnd();
  }

  private emitEnd(): void {
    for (const listener of this.endListeners) listener();
  }
}
