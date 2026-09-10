import BorderColorOutlined from '@mui/icons-material/BorderColorOutlined';
import {Alert,Button,TextField} from '@mui/material';import {useState} from 'react';
export function ContextSelection({pageText,onSelect,onHighlight,highlightQuotes}:{pageText:string;onSelect:(start:number,end:number,quote:string)=>void;onHighlight:(start:number,end:number,quote:string)=>void;highlightQuotes:string[]}):JSX.Element{
  const[quote,setQuote]=useState(pageText);
  const[attached,setAttached]=useState<number|null>(null);
  const trimmed=quote.trim();
  const locate=():{start:number;end:number}=>{const start=Math.max(0,pageText.indexOf(quote));return{start,end:start+quote.length}};
  return<div className="context-selection">
    <p className="context-diagnostic">本页文本层共 {pageText.length} 字{pageText.length===0?'（本页无文本层，可能是扫描图片：无法朗读、划线或引用，请换用含文字的 PDF，或用图片 OCR 拍题）':''}</p>
    <TextField multiline minRows={3} fullWidth label="本页文本（可编辑，选择你要用的片段）" helperText="PDF 为图片渲染不支持鼠标划选，这是等效替代：删除不需要的部分，只留必要片段。" value={quote} onChange={(e)=>{setQuote(e.target.value);setAttached(null)}}/>
    {highlightQuotes.length>0&&<div className="context-highlights" aria-label="本页已划线片段"><strong>本页已划线片段</strong><ul>{highlightQuotes.map((hq)=><li key={hq}>{hq}</li>)}</ul></div>}
    <div className="context-actions">
      <Button onClick={()=>{const{start,end}=locate();onSelect(start,end,quote);setAttached(quote.length)}} disabled={!trimmed}>引用这段页文本</Button>
      <Button startIcon={<BorderColorOutlined/>} onClick={()=>{const{start,end}=locate();onHighlight(start,end,quote)}} disabled={!trimmed}>划线这段</Button>
    </div>
    {attached!==null&&<Alert severity="success" role="status">已附加为本课教材上下文（{attached} 字）。右侧「生成分步微课堂候选」会引用这段内容讲解。</Alert>}
  </div>}
