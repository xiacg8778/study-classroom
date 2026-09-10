/**
 * 本地学习记录层（宿主闭环轻量版）。
 *
 * 定位：正式宿主（kernel-10/组件24）未接入前，把每次学习收尾的候选结果沉淀为
 * 「本地记录」，让错题本与知识路径跨会话累积。边界诚实：
 * - 只叫「本地记录」，不显示「已归档/已入队」等回执语义（那些词仍保留给正式回执）。
 * - 按学习者 ID 隔离；退出会话不清（记录本就是长期数据），切换学习者自然隔离；
 *   数据控制页提供查看/删除入口。
 * - 不含 PDF 内容、作答全文之外的敏感材料；只存收尾提案的 8 字段错题、掌握度、下一课摘要。
 */

import type { WrongQuestionCandidate } from '../contracts/wrongQuestion';

export interface LocalRecordEntry {
  recordId:string;
  createdAt:string;
  textbookTitle:string;
  lessonTitle:string;
  chapter:string;
  wrongQuestions:WrongQuestionCandidate[];
  mastery:string;
  nextLessonPath:string;
  nextLessonAction:string;
}

export interface LocalRecordStoreData {
  records:LocalRecordEntry[];
}

const PREFIX='paper-desk.local-records:';

const keyFor=(learnerId:string):string=>`${PREFIX}${learnerId}`;

export function loadLocalRecords(learnerId:string):LocalRecordEntry[]{
  try{
    const raw=localStorage.getItem(keyFor(learnerId));
    if(!raw)return[];
    const parsed=JSON.parse(raw) as LocalRecordStoreData;
    return Array.isArray(parsed.records)?parsed.records:[];
  }catch{return[];}
}

/** 追加一条记录（同一 recordId 幂等覆盖）；最旧的在前，超过 500 条裁剪最旧 */
export function appendLocalRecord(learnerId:string,entry:LocalRecordEntry):void{
  try{
    const records=loadLocalRecords(learnerId).filter((r)=>r.recordId!==entry.recordId);
    records.push(entry);
    const trimmed=records.slice(Math.max(0,records.length-500));
    localStorage.setItem(keyFor(learnerId),JSON.stringify({records:trimmed}));
  }catch{/* 存储不可用（隐私模式/配额）时静默降级：当次会话仍完整可用 */
  }
}

/** 删除单条记录 */
export function removeLocalRecord(learnerId:string,recordId:string):void{
  try{
    const records=loadLocalRecords(learnerId).filter((r)=>r.recordId!==recordId);
    localStorage.setItem(keyFor(learnerId),JSON.stringify({records}));
  }catch{/* 同上 */
  }
}

/** 清空某学习者全部记录（数据控制页用） */
export function clearLocalRecords(learnerId:string):void{
  try{localStorage.removeItem(keyFor(learnerId));}catch{/* 同上 */
  }
}

/** 错题去重键：同章节同题干视为同一错题的历史重复（用于标记 repeated） */
export function dedupeKeyOf(item:Pick<WrongQuestionCandidate,'chapter'|'question'>):string{
  return`${item.chapter}::${item.question}`;
}

/** 沉淀收尾提案为本地记录；对照历史把反复出错的题标记 repeated */
export function recordFromClose(input:{
  learnerId:string;
  recordId:string;
  textbookTitle:string;
  lessonTitle:string;
  wrongQuestions:WrongQuestionCandidate[];
  mastery:string;
  nextLessonPath:string;
  nextLessonAction:string;
}):void{
  const history=loadLocalRecords(input.learnerId);
  const seen=new Set<string>();
  for(const record of history)for(const wq of record.wrongQuestions)seen.add(dedupeKeyOf(wq));
  const wrongQuestions=input.wrongQuestions.map((item)=>seen.has(dedupeKeyOf(item))?{...item,repeated:true}:item);
  appendLocalRecord(input.learnerId,{recordId:input.recordId,createdAt:new Date().toISOString(),textbookTitle:input.textbookTitle,lessonTitle:input.lessonTitle,chapter:input.wrongQuestions[0]?.chapter??'',wrongQuestions,mastery:input.mastery,nextLessonPath:input.nextLessonPath,nextLessonAction:input.nextLessonAction});
}

/** 汇总某学习者历史全部错题（按首次出现顺序，repeated 标记保留） */
export function collectHistoricalWrongQuestions(learnerId:string):Array<WrongQuestionCandidate&{recordCreatedAt:string}>{
  return loadLocalRecords(learnerId).flatMap((record)=>record.wrongQuestions.map((item)=>({...item,recordCreatedAt:record.createdAt})));
}
