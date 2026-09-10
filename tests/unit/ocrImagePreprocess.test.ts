import { describe, expect, it } from 'vitest';
import { preprocessForOcr } from '../../src/services/ocrImagePreprocess';

/** 造一张 width×height 的灰度测试图：背景 200，左上角矩形 60（模拟深色文字） */
function makeCanvas(width:number,height:number):HTMLCanvasElement{
  const canvas=document.createElement('canvas');
  canvas.width=width;
  canvas.height=height;
  const context=canvas.getContext('2d',{alpha:false});
  if(!context)throw new Error('no 2d context');
  context.fillStyle='rgb(200,200,200)';
  context.fillRect(0,0,width,height);
  context.fillStyle='rgb(60,60,60)';
  context.fillRect(0,0,Math.floor(width/4),Math.floor(height/4));
  return canvas;
}

describe('ocrImagePreprocess', () => {
  it('upsamples small images toward a 1000px short side and reports the step', () => {
    const result = preprocessForOcr(makeCanvas(200, 100));
    expect(result.width).toBeGreaterThanOrEqual(800);
    expect(result.height).toBeGreaterThanOrEqual(400);
    expect(result.steps.join(' ')).toMatch(/放大/);
  });

  it('upsamples moderately when only the short side is below 1000px', () => {
    /* 1200×900：短边 900 <1000 → 放大到短边 1000（1000/900≈1.11×），长边等比 */
    const result = preprocessForOcr(makeCanvas(1200, 900));
    expect(result.height).toBe(1000);
    expect(result.width).toBeCloseTo(1200 * (1000 / 900), 0);
  });

  it('passes through images whose short side already meets 1000px', () => {
    const result = preprocessForOcr(makeCanvas(1600, 1200));
    expect(result.width).toBe(1600);
    expect(result.height).toBe(1200);
  });

  it('stretches low-contrast pixels toward full range and binarizes on demand', () => {
    const low = makeCanvas(64, 64);
    const stretched = preprocessForOcr(low, { binarize: false });
    const context = stretched.canvas.getContext('2d');
    if (!context) throw new Error('no context');
    const data = context.getImageData(0, 0, 1, 1).data;
    /* 深色笔画 60 经拉伸后显著变深；背景 200 变浅 */
    expect(data[0]).toBeLessThan(60);
    const binarized = preprocessForOcr(makeCanvas(64, 64), { binarize: true });
    const bContext = binarized.canvas.getContext('2d');
    if (!bContext) throw new Error('no context');
    const bData = bContext.getImageData(0, 0, 1, 1).data;
    expect([0, 255]).toContain(bData[0]);
    expect(bData[0]).toBe(bData[1]);
    expect(binarized.steps.join(' ')).toMatch(/Otsu/);
  });
});
