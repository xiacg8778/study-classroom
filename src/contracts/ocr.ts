export type OcrStage='loading'|'recognizing';
export interface OcrProgress{stage:OcrStage;progress:number;}
export interface OcrDraft{sourceId:string;text:string;confidence:number;width:number;height:number;language:'chi_sim+eng';}
export type OcrErrorCode='IMAGE_TYPE_UNSUPPORTED'|'IMAGE_TYPE_MISMATCH'|'IMAGE_LIMIT_EXCEEDED'|'IMAGE_PARSE_FAILED'|'OCR_UNAVAILABLE'|'OCR_FAILED'|'OCR_CANCELLED';
