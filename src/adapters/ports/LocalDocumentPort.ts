import type { MaterialReference } from '../../contracts/textbook';
export interface LocalDocument { documentId:string; fileName:string; pageCount:number; textByPage:string[]; /** 内容摘要（SHA-256 前256KB+大小 前16hex），批注持久化键 */ contentDigest:string; }
export interface LocalDocumentPort { open(file:File):Promise<LocalDocument>; renderPage(page:number,canvas:HTMLCanvasElement):Promise<void>; createSelection(page:number,startOffset:number,endOffset:number,quote:string):MaterialReference; close():Promise<void>; isOpen():boolean; }
