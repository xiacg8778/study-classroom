import type { Worker } from 'tesseract.js';
import type { OcrDraft, OcrProgress } from '../../contracts/ocr';
import type { OcrOptions, OcrPort } from '../ports/OcrPort';
import { contentPolicy } from '../../config/contentPolicy';
import { preprocessForOcr } from '../../services/ocrImagePreprocess';
import { inspectImageHeader } from './imageBoundary';

interface OcrJob {
  worker?: Worker;
  workerPromise?: Promise<Worker>;
  termination?: Promise<void>;
}

export class TesseractLocalOcrAdapter implements OcrPort {
  private active: OcrJob | null = null;
  private closing: Promise<void> = Promise.resolve();

  public async recognize(file: File, options: OcrOptions = {}): Promise<OcrDraft> {
    await this.close();
    if (file.size > contentPolicy.maxImageBytes) throw new Error('IMAGE_LIMIT_EXCEEDED');

    const bytes = new Uint8Array(await file.slice(0, 65536).arrayBuffer());
    const info = inspectImageHeader(file, bytes);
    if (options.signal?.aborted) throw new Error('OCR_CANCELLED');

    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const job: OcrJob = {};
    this.active = job;
    const onAbort = (): void => {
      if (this.active === job) void this.close();
      else void this.terminate(job);
    };
    options.signal?.addEventListener('abort', onAbort, { once: true });

    const canvas = document.createElement('canvas');
    const enhanced = document.createElement('canvas');
    try {
      if (options.signal?.aborted || this.active !== job) throw new Error('OCR_CANCELLED');
      if (bitmap.width !== info.width || bitmap.height !== info.height) throw new Error('IMAGE_PARSE_FAILED');

      const scale = Math.min(1, Math.sqrt(contentPolicy.maxOcrPixels / (bitmap.width * bitmap.height)));
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d', { alpha: false });
      if (!context) throw new Error('OCR_UNAVAILABLE');
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, width, height);
      context.drawImage(bitmap, 0, 0, width, height);

      /* 预处理增强图：放大+灰度对比度拉伸（手写/淡墨提升明显）；Otsu 二值化对复杂底纹有风险，只在低对比度时启用 */
      const stretched = preprocessForOcr(bitmap, { binarize: false });
      enhanced.width = stretched.width;
      enhanced.height = stretched.height;
      const enhancedContext = enhanced.getContext('2d', { alpha: false });
      if (!enhancedContext) throw new Error('OCR_UNAVAILABLE');
      enhancedContext.drawImage(stretched.canvas, 0, 0);

      const { createWorker } = await import('tesseract.js');
      if (options.signal?.aborted || this.active !== job) throw new Error('OCR_CANCELLED');
      const logger = (message: { status: string; progress: number }): void => {
        if (this.active !== job) return;
        const progress: OcrProgress = {
          stage: message.status.includes('recogn') ? 'recognizing' : 'loading',
          progress: Number.isFinite(message.progress) ? message.progress : 0,
        };
        options.onProgress?.(progress);
      };
      job.workerPromise = createWorker(['chi_sim', 'eng'], undefined, {
        logger,
        cacheMethod: 'none',
        workerBlobURL: false,
        workerPath: '/ocr/worker.min.js',
        corePath: '/ocr/core',
        langPath: '/ocr/tessdata',
      });
      job.worker = await job.workerPromise;
      if (options.signal?.aborted || this.active !== job) throw new Error('OCR_CANCELLED');

      /* 双通道：原图 + 预处理增强图各识别一次，取置信度高者。
         手写/淡墨样本通常增强图更优，印刷清晰图原图更稳；置信度是本地产出的诚实信号。 */
      const direct = await job.worker.recognize(canvas);
      if (options.signal?.aborted || this.active !== job) throw new Error('OCR_CANCELLED');
      const enhancedResult = await job.worker.recognize(enhanced);
      if (options.signal?.aborted || this.active !== job) throw new Error('OCR_CANCELLED');

      const useEnhanced = enhancedResult.data.confidence > direct.data.confidence;
      const winner = useEnhanced ? enhancedResult.data : direct.data;
      const outWidth = useEnhanced ? stretched.width : width;
      const outHeight = useEnhanced ? stretched.height : height;
      return {
        sourceId: `ocr-${crypto.randomUUID()}`,
        text: winner.text.slice(0, contentPolicy.maxMaterialChars).trim(),
        confidence: winner.confidence,
        width: outWidth,
        height: outHeight,
        language: 'chi_sim+eng',
      };
    } finally {
      options.signal?.removeEventListener('abort', onAbort);
      if (this.active === job) this.active = null;
      await this.terminate(job);
      canvas.width = 0;
      canvas.height = 0;
      enhanced.width = 0;
      enhanced.height = 0;
      bitmap.close();
    }
  }

  public async cancel(): Promise<void> {
    await this.close();
  }

  public close(): Promise<void> {
    const job = this.active;
    this.active = null;
    const previous = this.closing;
    this.closing = (async () => {
      await previous;
      if (job) await this.terminate(job);
    })();
    return this.closing;
  }

  private terminate(job: OcrJob): Promise<void> {
    if (!job.termination) {
      job.termination = (async () => {
        const worker = job.worker ?? await job.workerPromise?.catch(() => undefined);
        if (worker) await worker.terminate();
      })();
    }
    return job.termination;
  }
}
