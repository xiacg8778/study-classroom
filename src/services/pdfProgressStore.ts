/**
 * PDF 阅读元数据持久化（仅本地 localStorage，不上传）。
 *
 * 边界设计：
 * - 存：页码、书签、划线（页码+短引用或坐标区域）、朗读进度——用户的批注元数据，不含 PDF 文件内容。
 * - 不存：PDF 文件字节、页面全文文本。
 * - 键设计：`学习者ID:内容摘要`——摘要=SHA-256(前256KB+文件大小)前 16 hex，同名不同内容不串批注；
 *   旧版「文件名键」在读取时自动迁移，迁移后旧键删除。
 * - 清除时机：「退出会话」或切换学习者（LearningSessionProvider 调用 clearAllPdfProgress）。
 */

export interface RegionHighlight {
  page:number;
  /** 归一化坐标（0–1，相对页面渲染尺寸），跨设备/缩放可恢复 */
  x:number;
  y:number;
  width:number;
  height:number;
  quote:string;
}

export interface PdfProgressSnapshot {
  lastPage:number;
  bookmarks:number[];
  highlights:Array<{page:number;quote:string}>;
  /** 无文本层页面的坐标划线（v2 新增；文本层页仍用文字划线） */
  regionHighlights:RegionHighlight[];
  readProgress:Record<number,number>;
  savedAt:number;
  /** 原始文件名（管理列表展示用，非身份键） */
  fileName?:string;
  /** 存储模式：legacy=文件名键；digest=内容摘要键。迁移后写 digest */
  keyMode?:'legacy'|'digest';
}

const PREFIX='paper-desk.pdf-progress:';

/** 兼容旧格式导出：legacy 键 = `${PREFIX}${learnerId}:${fileName}` */
const LEGACY_PREFIX=PREFIX;

const digestCache=new Map<string,string>();

/** 兼容旧导出：文件名 → 摘要键所需字段由调用方传入，这里保留纯函数供测试 */
export function digestKeyFor(learnerId:string,digest:string):string{
  return `${PREFIX}${learnerId}:${digest}`;
}

/** SHA-256(前 256KB 字节 + 文件大小) 前 16 hex；失败回退文件名派生（稳定但不防同名） */
export async function computeContentDigest(file:{name:string;size:number;slice:File['slice']}):Promise<string>{
  try{
    const head=await file.slice(0,256*1024).arrayBuffer();
    const meta=new TextEncoder().encode(`:${file.size}`);
    const merged=new Uint8Array(head.byteLength+meta.byteLength);
    merged.set(new Uint8Array(head),0);
    merged.set(meta,head.byteLength);
    const hashBuffer=await crypto.subtle.digest('SHA-256',merged);
    return Array.from(new Uint8Array(hashBuffer)).slice(0,8).map((b)=>b.toString(16).padStart(2,'0')).join('');
  }catch{
    return stableFallbackDigest(`${file.name}@${file.size}`);
  }
}

/** 无 crypto.subtle 环境（http 非安全上下文）的稳定回退：FNV-1a over 文件名+大小 */
export function stableFallbackDigest(name:string):string{
  let hash=2166136261;
  const input=`${name}`;
  for(let i=0;i<input.length;i+=1){hash^=input.charCodeAt(i);hash=Math.imul(hash,16777619);}
  return `fnv-${(hash>>>0).toString(16).padStart(8,'0')}`;
}

function keyFor(learnerId:string,fileKey:string):string{
  return `${PREFIX}${learnerId}:${fileKey}`;
}

export function loadPdfProgress(learnerId:string,fileKey:string):PdfProgressSnapshot|null{
  try{
    const raw=localStorage.getItem(keyFor(learnerId,fileKey));
    if(!raw)return null;
    const parsed=JSON.parse(raw) as PdfProgressSnapshot;
    if(typeof parsed.lastPage!=='number'||!Array.isArray(parsed.bookmarks))return null;
    parsed.highlights=parsed.highlights??[];
    parsed.regionHighlights=(parsed.regionHighlights??[]).filter((r)=>r&&typeof r.page==='number'&&r.x>=0&&r.x<=1&&r.y>=0&&r.y<=1&&r.width>0&&r.height>0);
    parsed.readProgress=parsed.readProgress??{};
    return parsed;
    }catch{return null;}
}

export function savePdfProgress(learnerId:string,fileKey:string,snapshot:Omit<PdfProgressSnapshot,'savedAt'>):void{
  try{
    const payload=JSON.stringify({...snapshot,savedAt:Date.now(),keyMode:'digest'});
    localStorage.setItem(keyFor(learnerId,fileKey),payload);
  }catch{/* 存储不可用（隐私模式/配额）时静默降级 */
  }
}

/** 一次性迁移：把某学习者的旧「文件名键」条目改写为摘要键；返回迁移数量 */
export function migrateLegacyPdfProgress(learnerId:string,fileName:string,digest:string):number{
  try{
    const legacyKey=`${PREFIX}${learnerId}:${fileName}`;
    const raw=localStorage.getItem(legacyKey);
    if(!raw)return 0;
    const parsed=JSON.parse(raw) as PdfProgressSnapshot;
    if(typeof parsed.lastPage!=='number')return 0;
    const target=keyFor(learnerId,digest);
    if(!localStorage.getItem(target)){
      localStorage.setItem(target,JSON.stringify({...parsed,keyMode:'digest'}));
    }
    localStorage.removeItem(legacyKey);
    return 1;
  }catch{return 0;}
}

export function clearPdfProgress(learnerId:string,fileKey:string):void{
  try{localStorage.removeItem(keyFor(learnerId,fileKey));}catch{/* 同上 */}
}

/** 兼容旧调用：清除指定文件名的全部条目（legacy 键 + 迁移后 digest 键） */
export function clearPdfProgressByFile(learnerId:string,fileName:string):void{
  try{
    localStorage.removeItem(keyFor(learnerId,fileName));
    for(const digest of digestCache.values()){
      if(digest)localStorage.removeItem(keyFor(learnerId,digest));
    }
    digestCache.clear();
  }catch{/* 同上 */}
}

export function clearAllPdfProgress():void{
  try{
    const stale:string[]=[];
    for(let i=0;i<localStorage.length;i+=1){
      const key=localStorage.key(i);
      if(key?.startsWith(LEGACY_PREFIX))stale.push(key);
    }
    for(const key of stale)localStorage.removeItem(key);
  }catch{/* 同上 */}
}

/** 列出某学习者的全部批注条目（管理入口用），最久未更新在前 */
export interface PdfProgressEntry {
  learnerId:string;
  fileKey:string;
  fileName:string;
  itemCount:number;
  savedAt:number;
}

export function listPdfProgressEntries(learnerId:string):PdfProgressEntry[]{
  const entries:PdfProgressEntry[]=[];
  try{
    const prefix=`${PREFIX}${learnerId}:`;
    for(let i=0;i<localStorage.length;i+=1){
      const key=localStorage.key(i);
      if(!key?.startsWith(prefix))continue;
      try{
        const parsed=JSON.parse(localStorage.getItem(key)??'{}') as PdfProgressSnapshot;
        entries.push({
          learnerId,
          fileKey:key.slice(prefix.length),
          fileName:parsed.fileName??key.slice(prefix.length),
          itemCount:parsed.bookmarks.length+(parsed.highlights?.length??0)+(parsed.regionHighlights?.length??0),
          savedAt:parsed.savedAt??0,
        });
      }catch{/* 跳过损坏条目 */}
    }
  }catch{/* 存储不可用 */}
  return entries.sort((a,b)=>a.savedAt-b.savedAt);
}

/** 删除单条批注存储（管理入口用） */
export function removePdfProgressEntry(learnerId:string,fileKey:string):void{
  try{localStorage.removeItem(keyFor(learnerId,fileKey));}catch{/* 同上 */
  }
}
