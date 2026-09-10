export type MaterialOrigin = 'original-demo' | 'local-pdf' | 'local-image-ocr' | 'catalog';
export type RightsStatus = 'authorized-demo' | 'local-user-owned' | 'catalog-only' | 'unavailable';
export interface SourceAttribution { sourceName: string; licenseNote: string; version: string; }
export interface Lesson { lessonId: string; title: string; pages: string[]; /** 本节目录（课堂左栏展示）；缺省用通用三步 */ outline?: string[]; }
export interface Textbook { textbookId: string; title: string; grade: string; subject: string; edition: string; origin: MaterialOrigin; rightsStatus: RightsStatus; attribution: SourceAttribution; lessons: Lesson[]; }
export interface MaterialReference { referenceId: string; origin: MaterialOrigin; documentId: string; lessonId?: string; page: number; startOffset: number; endOffset: number; quote: string; quoteDigest: string; trustLevel: 'untrusted-material'; }
