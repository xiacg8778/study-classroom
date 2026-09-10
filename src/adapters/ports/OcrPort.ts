import type{OcrDraft,OcrProgress}from '../../contracts/ocr';
export interface OcrOptions{signal?:AbortSignal;onProgress?(progress:OcrProgress):void;}
export interface OcrPort{recognize(file:File,options?:OcrOptions):Promise<OcrDraft>;cancel():Promise<void>;close():Promise<void>;}
