import '@testing-library/jest-dom/vitest';
Object.defineProperty(globalThis,'crypto',{value:{...globalThis.crypto,randomUUID:()=>`${Date.now()}-0000-4000-8000-000000000000`},configurable:true});

/* jsdom 无 2D canvas 实现：提供最小可控行为的 mock（fillRect/getImageData/putImageData/drawImage/digest 用）。
   仅测试环境生效；像素存 Uint8ClampedArray，getImageData 返回真实写入内容。 */
/* jsdom 的 getContext 方法存在但返回 null（需 canvas npm 包）；vitest 环境直接覆盖为轻量实现 */
if (typeof HTMLCanvasElement !== 'undefined') {
  const contexts = new WeakMap<HTMLCanvasElement, { data: Uint8ClampedArray; width: number; height: number }>();
  const ensure = (canvas: HTMLCanvasElement) => {
    let state = contexts.get(canvas);
    if (!state || state.width !== canvas.width || state.height !== canvas.height) {
      state = { data: new Uint8ClampedArray(canvas.width * canvas.height * 4).fill(255), width: canvas.width, height: canvas.height };
      contexts.set(canvas, state);
    }
    return state as { data: Uint8ClampedArray; width: number; height: number };
  };
  HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, contextId: string) {
    if (contextId !== '2d') return null;
    const canvas = this as HTMLCanvasElement;
    const state = ensure(canvas);
    const put = (x: number, y: number, w: number, h: number, rgba: number[]) => {
      for (let row = y; row < Math.min(y + h, canvas.height); row += 1) {
        for (let col = x; col < Math.min(x + w, canvas.width); col += 1) {
          const offset = (row * canvas.width + col) * 4;
          state.data.set(rgba, offset);
        }
      }
    };
    const styleState = { fillStyle: '#ffffff' as string };
    return {
      get fillStyle() { return styleState.fillStyle; },
      set fillStyle(value: string) { styleState.fillStyle = value; },
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
      fillRect(x: number, y: number, w: number, h: number) {
        const style = String(styleState.fillStyle);
        const match = style.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        const rgba = match ? [Number(match[1]), Number(match[2]), Number(match[3]), 255] : [255, 255, 255, 255];
        put(x, y, w, h, rgba);
      },
      drawImage(source: CanvasImageSource) {
        const sourceCanvas = source as HTMLCanvasElement;
        const sourceState = contexts.get(sourceCanvas);
        if (!sourceState) return;
        const w = Math.min(sourceCanvas.width, canvas.width);
        const h = Math.min(sourceCanvas.height, canvas.height);
        for (let row = 0; row < h; row += 1) {
          for (let col = 0; col < w; col += 1) {
            const from = (row * sourceCanvas.width + col) * 4;
            const to = (row * canvas.width + col) * 4;
            state.data.set(sourceState.data.subarray(from, from + 4), to);
          }
        }
      },
      getImageData(x: number, y: number, w: number, h: number) {
        const out = new Uint8ClampedArray(w * h * 4);
        for (let row = 0; row < h; row += 1) {
          const from = ((y + row) * canvas.width + x) * 4;
          out.set(state.data.subarray(from, from + w * 4), row * w * 4);
        }
        return { data: out, width: w, height: h, colorSpace: 'srgb' as PredefinedColorSpace };
      },
      putImageData(imageData: { data: Uint8ClampedArray; width: number; height: number }, dx: number, dy: number) {
        for (let row = 0; row < imageData.height; row += 1) {
          const to = ((dy + row) * canvas.width + dx) * 4;
          state.data.set(imageData.data.subarray(row * imageData.width * 4, (row + 1) * imageData.width * 4), to);
        }
      },
    } as unknown as CanvasRenderingContext2D;
  } as typeof HTMLCanvasElement.prototype.getContext;
}
