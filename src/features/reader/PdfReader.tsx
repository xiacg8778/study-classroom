import BookmarkAddOutlined from '@mui/icons-material/BookmarkAddOutlined';
import BookmarkRemoveOutlined from '@mui/icons-material/BookmarkRemoveOutlined';
import NavigateBeforeOutlined from '@mui/icons-material/NavigateBeforeOutlined';
import NavigateNextOutlined from '@mui/icons-material/NavigateNextOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import ViewCarouselOutlined from '@mui/icons-material/ViewCarouselOutlined';
import {Button,IconButton,TextField,Tooltip} from '@mui/material';
import {useEffect,useMemo,useRef,useState} from 'react';
import type {LocalDocument} from '../../adapters/ports/LocalDocumentPort';
import {loadPdfProgress,migrateLegacyPdfProgress,savePdfProgress} from '../../services/pdfProgressStore';
import type {RegionHighlight} from '../../services/pdfProgressStore';
import {useLearningSession} from '../../state/LearningSessionProvider';
import {ContextSelection} from './ContextSelection';

interface SearchResult {
  page:number;
  excerpt:string;
}

interface PageHighlight {
  key:string;
  page:number;
  quote:string;
}

const THUMBNAIL_WINDOW=12;

const normalizePage=(value:number,pageCount:number):number=>Math.min(pageCount,Math.max(1,value));

function buildSearchResults(document:LocalDocument,query:string):SearchResult[]{
  const keyword=query.trim().toLocaleLowerCase();
  if(!keyword)return[];
  return document.textByPage.flatMap((pageText,index)=>{
    const normalized=pageText.toLocaleLowerCase();
    const matchIndex=normalized.indexOf(keyword);
    if(matchIndex<0)return[];
    const start=Math.max(0,matchIndex-36);
    const end=Math.min(pageText.length,matchIndex+keyword.length+72);
    return [{page:index+1,excerpt:`${start>0?'…':''}${pageText.slice(start,end)}${end<pageText.length?'…':''}`}];
  });
}

function ThumbnailCanvas({document,page,active,onSelect}:{document:LocalDocument;page:number;active:boolean;onSelect:(page:number)=>void}):JSX.Element{
  const{documents}=useLearningSession();
  const canvas=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{
    if(canvas.current)void documents.renderPage(page,canvas.current);
  },[documents,document.documentId,page]);
  return <button type="button" className={`pdf-thumbnail${active?' pdf-thumbnail-active':''}`} onClick={()=>onSelect(page)} aria-current={active?'page':undefined} aria-label={`跳到第 ${page} 页`}>
    <canvas ref={canvas}/>
    <span>{page}</span>
  </button>;
}

function renderPageTextWithHighlights(pageText:string,quotes:string[]):JSX.Element{
  if(quotes.length===0)return <>{pageText}</>;
  const marks=quotes
    .map((quote)=>{const start=pageText.indexOf(quote);return start<0?null:{start,end:start+quote.length};})
    .filter((range):range is{start:number;end:number}=>range!==null)
    .sort((a,b)=>a.start-b.start);
  const merged:{start:number;end:number}[]=[];
  for(const range of marks){
    const last=merged[merged.length-1];
    if(last&&range.start<=last.end)last.end=Math.max(last.end,range.end);
    else merged.push({...range});
  }
  const parts:JSX.Element[]=[];
  let cursor=0;
  merged.forEach((range,index)=>{
    if(range.start>cursor)parts.push(<span key={`t${index}`}>{pageText.slice(cursor,range.start)}</span>);
    parts.push(<mark key={`m${index}`} className="pdf-text-highlight">{pageText.slice(range.start,range.end)}</mark>);
    cursor=range.end;
  });
  if(cursor<pageText.length)parts.push(<span key="tail">{pageText.slice(cursor)}</span>);
  return <>{parts}</>;
}

export function PdfReader({document}:{document:LocalDocument}):JSX.Element{
  const{documents,dispatch,learnerId}=useLearningSession();
  const canvas=useRef<HTMLCanvasElement>(null);
  const[currentPage,setCurrentPage]=useState(1);
  const[pageInput,setPageInput]=useState('1');
  const[query,setQuery]=useState('');
  const[bookmarks,setBookmarks]=useState<number[]>([]);
  const[showThumbnails,setShowThumbnails]=useState(false);
  const[highlights,setHighlights]=useState<PageHighlight[]>([]);
  const{speech}=useLearningSession();
  const[readProgress,setReadProgress]=useState<Record<number,number>>({});
  const[speechStatus,setSpeechStatus]=useState<'idle'|'requested'|'no-audio'|'current'>('idle');
  const[restored,setRestored]=useState(false);
  /** 内容摘要键（异步计算完成前为空，期间不做恢复也不保存） */
  const[fileKey,setFileKey]=useState('');
  /** 无文本层页面的坐标划线 */
  const[regionHighlights,setRegionHighlights]=useState<RegionHighlight[]>([]);
  const[regionDraft,setRegionDraft]=useState<{x:number;y:number;width:number;height:number}|null>(null);
  const[regionSelecting,setRegionSelecting]=useState(false);
  const searchResults=useMemo(()=>buildSearchResults(document,query),[document,query]);
  const pageText=document.textByPage[currentPage-1]??'';
  const isBookmarked=bookmarks.includes(currentPage);
  const currentPageProgress=readProgress[currentPage]??0;
  const pageHighlights=highlights.filter((highlight)=>highlight.page===currentPage);
  const pageRegions=regionHighlights.filter((region)=>region.page===currentPage);

  /* 内容摘要键由适配器在打开文件时计算（SHA-256 前256KB+大小）。同一文件名不同内容→不同键，批注不串。
     摘要键首次使用时做一次性旧文件名键迁移（老用户升级无损）。 */
  useEffect(()=>{
    setFileKey('');
    let cancelled=false;
    void (async()=>{
      await migrateLegacyPdfProgress(learnerId,document.fileName,document.contentDigest);
      if(!cancelled)setFileKey(document.contentDigest);
    })();
    return()=>{cancelled=true;};
  },[document.documentId,document.contentDigest,document.fileName,learnerId]);

  /* 换文档时重置会话内状态；摘要键就绪后恢复该文件的批注元数据（页码/书签/划线/进度）。
     restored 表示"文档与键均已就绪、可以开始持久化"。 */
  useEffect(()=>{
    setCurrentPage(1);
    setPageInput('1');
    setQuery('');
    setBookmarks([]);
    setShowThumbnails(false);
    setHighlights([]);
    setRegionHighlights([]);
    setReadProgress({});
    setRestored(false);
    if(!fileKey)return;
    const snapshot=loadPdfProgress(learnerId,fileKey);
    if(snapshot){
      const page=normalizePage(snapshot.lastPage,document.pageCount);
      setCurrentPage(page);
      setPageInput(String(page));
      setBookmarks(snapshot.bookmarks.filter((p)=>p>=1&&p<=document.pageCount));
      setHighlights(snapshot.highlights.filter((h)=>h.page>=1&&h.page<=document.pageCount&&h.quote).map((h)=>({key:`${document.documentId}-${h.page}-${h.quote}`,page:h.page,quote:h.quote})));
      setRegionHighlights((snapshot.regionHighlights??[]).filter((r)=>r.page>=1&&r.page<=document.pageCount));
      setReadProgress(snapshot.readProgress);
    }
    setRestored(true);
  },[fileKey,document.pageCount,document.documentId,learnerId]);

  /* 批注元数据变化即同步保存（仅本地，不上传；不保存任何 PDF 内容）。
     不做防抖：用户可能在使用浏览器刷新/切换学习者，防抖定时器会被卸载清掉导致最后一次变更丢失；
     数据量小（几 KB）且变更是用户点击驱动，同步写无性能顾虑。 */
  useEffect(()=>{
    if(!restored||!fileKey)return;
    savePdfProgress(learnerId,fileKey,{lastPage:currentPage,bookmarks,highlights:highlights.map(({page,quote})=>({page,quote})),regionHighlights,readProgress,fileName:document.fileName});
  },[restored,fileKey,learnerId,document.fileName,currentPage,bookmarks,highlights,regionHighlights,readProgress]);

  useEffect(()=>{
    if(canvas.current)void documents.renderPage(currentPage,canvas.current);
  },[documents,document.documentId,currentPage]);

  const goToPage=(page:number):void=>{
    const nextPage=normalizePage(page,document.pageCount);
    setCurrentPage(nextPage);
    setPageInput(String(nextPage));
  };

  const submitPage=(event:React.FormEvent<HTMLFormElement>):void=>{
    event.preventDefault();
    const parsed=Number.parseInt(pageInput,10);
    goToPage(Number.isFinite(parsed)?parsed:currentPage);
  };

  const toggleBookmark=():void=>{
    setBookmarks((current)=>current.includes(currentPage)?current.filter((page)=>page!==currentPage):[...current,currentPage].sort((a,b)=>a-b));
  };

  const thumbnailWindow=useMemo(()=>{
    if(!showThumbnails)return[];
    const start=Math.max(1,currentPage-Math.floor(THUMBNAIL_WINDOW/2));
    const end=Math.min(document.pageCount,start+THUMBNAIL_WINDOW-1);
    const first=Math.max(1,end-THUMBNAIL_WINDOW+1);
    return Array.from({length:end-first+1},(_,index)=>first+index);
  },[showThumbnails,currentPage,document.pageCount]);

  const addHighlight=(page:number,quote:string):void=>{
    const trimmed=quote.trim();
    if(!trimmed)return;
    setHighlights((current)=>current.some((highlight)=>highlight.page===page&&highlight.quote===trimmed)?current:[...current,{key:`${document.documentId}-${page}-${trimmed}`,page,quote:trimmed}]);
  };

  const removeHighlight=(key:string):void=>{
    setHighlights((current)=>current.filter((highlight)=>highlight.key!==key));
  };

  const speakFromProgress=():void=>{
    if(!speech.supported())return;
    const offset=Math.min(pageText.length,currentPageProgress);
    const remaining=pageText.slice(offset);
    if(!remaining)return;
    setSpeechStatus('requested');
    speech.speak(remaining);
    window.setTimeout(()=>{
      setSpeechStatus((current)=>current==='requested'?'no-audio':'current');
    },1200);
  };

  const markPageRead=():void=>{
    setReadProgress((current)=>({...current,[currentPage]:pageText.length}));
  };

  /* 无文本层页面的坐标划线：在画布上拖拽框选区域（归一化 0–1 坐标，恢复时按渲染尺寸叠加） */
  const canvasPoint=(event:React.PointerEvent<HTMLDivElement>):{x:number;y:number}=>{
    const rect=event.currentTarget.getBoundingClientRect();
    return{x:Math.min(1,Math.max(0,(event.clientX-rect.left)/rect.width)),y:Math.min(1,Math.max(0,(event.clientY-rect.top)/rect.height))};
  };
  const onRegionPointerDown=(event:React.PointerEvent<HTMLDivElement>):void=>{
    if(pageText.trim())return;/* 有文本层的页面保持文字划线，不启用框选 */
    const point=canvasPoint(event);
    setRegionSelecting(true);
    setRegionDraft({x:point.x,y:point.y,width:0,height:0});
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onRegionPointerMove=(event:React.PointerEvent<HTMLDivElement>):void=>{
    if(!regionSelecting)return;
    const point=canvasPoint(event);
    setRegionDraft((draft)=>draft?{...draft,width:Math.max(0,point.x-draft.x),height:Math.max(0,point.y-draft.y)}:null);
  };
  const onRegionPointerUp=(event:React.PointerEvent<HTMLDivElement>):void=>{
    if(!regionSelecting)return;
    setRegionSelecting(false);
    const point=canvasPoint(event);
    setRegionDraft((draft)=>{
      if(!draft)return null;
      const width=point.x>=draft.x?point.x-draft.x:draft.x-point.x;
      const height=point.y>=draft.y?point.y-draft.y:draft.y-point.y;
      const x=Math.min(draft.x,point.x);
      const y=Math.min(draft.y,point.y);
      if(width<0.01||height<0.005)return null;/* 过小的拖拽视为误触 */
      setRegionHighlights((current)=>{
        if(current.some((r)=>r.page===currentPage&&Math.abs(r.x-x)<0.01&&Math.abs(r.y-y)<0.01&&Math.abs(r.width-width)<0.01&&Math.abs(r.height-height)<0.01))return current;
        const quote=`区域 ${Math.round(x*100)},${Math.round(y*100)} ${Math.round(width*100)}×${Math.round(height*100)}`;
        return[...current,{page:currentPage,x,y,width,height,quote}];
      });
      return null;
    });
  };
  const removeRegionHighlight=(page:number,x:number,y:number):void=>{
    setRegionHighlights((current)=>current.filter((r)=>!(r.page===page&&r.x===x&&r.y===y)));
  };

  return <section className="pdf-reader" aria-label="本地 PDF 阅读器">
    <header className="pdf-reader-heading">
      <div>
        <span className="pdf-kicker">本地 PDF · 会话内阅读</span>
        <h3>{document.fileName}</h3>
      </div>
      <strong aria-live="polite">第 {currentPage} / {document.pageCount} 页</strong>
    </header>

    <div className="pdf-reader-tools" aria-label="PDF 阅读工具">
      <Tooltip title="上一页"><span><IconButton aria-label="上一页" onClick={()=>goToPage(currentPage-1)} disabled={currentPage===1}><NavigateBeforeOutlined/></IconButton></span></Tooltip>
      <form className="pdf-page-form" onSubmit={submitPage}>
        <TextField size="small" label="跳到页码" value={pageInput} onChange={(event)=>setPageInput(event.target.value)} inputProps={{inputMode:'numeric',min:1,max:document.pageCount,'aria-label':'跳到页码'}}/>
        <Button type="submit" variant="outlined">前往</Button>
      </form>
      <Tooltip title="下一页"><span><IconButton aria-label="下一页" onClick={()=>goToPage(currentPage+1)} disabled={currentPage===document.pageCount}><NavigateNextOutlined/></IconButton></span></Tooltip>
      <Button className="bookmark-toggle" startIcon={isBookmarked?<BookmarkRemoveOutlined/>:<BookmarkAddOutlined/>} onClick={toggleBookmark} aria-pressed={isBookmarked}>{isBookmarked?'移除本页书签':'标记本页'}</Button>
      <Button className="thumbnail-toggle" startIcon={<ViewCarouselOutlined/>} onClick={()=>setShowThumbnails((open)=>!open)} aria-pressed={showThumbnails}>{showThumbnails?'收起缩略图':'缩略图导航'}</Button>
    </div>

    {showThumbnails&&<nav className="pdf-thumbnails" aria-label="PDF 缩略图导航">
      {thumbnailWindow.map((page)=><ThumbnailCanvas key={`${document.documentId}-${page}`} document={document} page={page} active={page===currentPage} onSelect={goToPage}/>)}
      {document.pageCount>THUMBNAIL_WINDOW&&<p className="pdf-thumbnails-note">显示第 {thumbnailWindow[0]}–{thumbnailWindow[thumbnailWindow.length-1]} 页，共 {document.pageCount} 页；翻页自动更新窗口。</p>}
    </nav>}

    <div className="pdf-search">
      <TextField fullWidth size="small" label="搜索 PDF 全文" value={query} onChange={(event)=>setQuery(event.target.value)} InputProps={{startAdornment:<SearchOutlined aria-hidden="true"/>}} helperText="仅搜索本次会话中已解析的本地文本，不上传、不保存。"/>
      {query.trim()&&<div className="pdf-search-results" aria-live="polite">
        <strong>{searchResults.length?`找到 ${searchResults.length} 页`:'没有找到匹配内容'}</strong>
        {searchResults.length>0&&<ol>{searchResults.map((result)=><li key={result.page}><Button onClick={()=>goToPage(result.page)}>第 {result.page} 页</Button><span>{result.excerpt}</span></li>)}</ol>}
      </div>}
    </div>

    {bookmarks.length>0&&<nav className="pdf-bookmarks" aria-label="当前 PDF 书签">
      <strong>本次会话书签</strong>
      <div>{bookmarks.map((page)=><Button key={page} variant={page===currentPage?'contained':'text'} onClick={()=>goToPage(page)} aria-current={page===currentPage?'page':undefined}>第 {page} 页</Button>)}</div>
    </nav>}

    {highlights.length>0&&<section className="pdf-highlights" aria-label="当前 PDF 划线">
      <strong>本次会话划线 · 共 {highlights.length} 条{pageHighlights.length>0?`（本页 ${pageHighlights.length} 条）`:''}</strong>
      <ul>{highlights.map((highlight)=><li key={highlight.key} className={highlight.page===currentPage?'pdf-highlight-current':undefined}><span>第 {highlight.page} 页 · {highlight.quote}</span><Button size="small" onClick={()=>goToPage(highlight.page)}>跳转</Button><Button size="small" onClick={()=>removeHighlight(highlight.key)}>移除</Button></li>)}</ul>
    </section>}

    {regionHighlights.length>0&&<section className="pdf-region-highlights" aria-label="当前 PDF 区域划线">
      <strong>区域划线（扫描页）· 共 {regionHighlights.length} 条{pageRegions.length>0?`（本页 ${pageRegions.length} 条）`:''}</strong>
      <ul>{regionHighlights.map((region)=><li key={`${region.page}-${region.x}-${region.y}-${region.width}`} className={region.page===currentPage?'pdf-highlight-current':undefined}><span>第 {region.page} 页 · {region.quote}</span><Button size="small" onClick={()=>goToPage(region.page)}>跳转</Button><Button size="small" onClick={()=>removeRegionHighlight(region.page,region.x,region.y)}>移除</Button></li>)}</ul>
    </section>}

    <div className="pdf-reading-progress" aria-label="本地朗读进度">
      <strong>朗读进度（会话内）</strong>
      <p aria-live="polite">{currentPageProgress>=pageText.length&&pageText.length>0?'本页已读完':currentPageProgress>0?`本页已朗读 ${currentPageProgress} / ${pageText.length} 字`:'本页尚未朗读'}</p>
      <div className="pdf-progress-actions">
        <Button size="small" onClick={speakFromProgress} disabled={!speech.supported()||!pageText.trim()||currentPageProgress>=pageText.length}>{currentPageProgress>0?'从进度继续朗读':'朗读本页'}</Button>
        <Button size="small" onClick={markPageRead} disabled={!pageText.trim()||currentPageProgress>=pageText.length}>记为已读</Button>
      </div>
      {!speech.supported()&&<p className="pdf-progress-note">当前浏览器不支持本地朗读；进度仍可手动标记，完整文字保留在页面上。</p>}
      {speech.supported()&&pageText.length===0&&<p className="pdf-progress-note">本页没有文本层（扫描图片无法朗读）；请换含文字的 PDF 或用图片 OCR。</p>}
      {speechStatus==='no-audio'&&<p className="pdf-progress-note">已发出朗读请求但 1.2 秒内未确认开始——常见原因：系统音量/静音、无中文语音包（系统设置→辅助功能→语音），或浏览器策略拦截。可先「记为已读」继续学习。</p>}
    </div>

    <div className={`pdf-canvas-wrap${pageText.trim()?'':' pdf-canvas-region-mode'}`} onPointerDown={onRegionPointerDown} onPointerMove={onRegionPointerMove} onPointerUp={onRegionPointerUp}>
      <canvas ref={canvas} aria-label={`PDF 第 ${currentPage} 页画布`}/>
      {pageRegions.map((region)=><div key={`${region.x}-${region.y}-${region.width}`} className="pdf-region-highlight" style={{left:`${region.x*100}%`,top:`${region.y*100}%`,width:`${region.width*100}%`,height:`${region.height*100}%`}} role="img" aria-label={`第 ${region.page} 页区域划线 ${region.quote}`}><button type="button" className="pdf-region-remove" aria-label="移除这条区域划线" onClick={()=>removeRegionHighlight(region.page,region.x,region.y)}>×</button></div>)}
      {regionDraft&&<div className="pdf-region-draft" style={{left:`${regionDraft.x*100}%`,top:`${regionDraft.y*100}%`,width:`${regionDraft.width*100}%`,height:`${regionDraft.height*100}%`}}/>}
    </div>
    {!pageText.trim()&&<p className="pdf-region-note">本页无文本层（扫描件）：可在上方页面直接拖拽框选区域划线；划线区域会保存，刷新后重选同一文件可恢复。文字引用与朗读需换含文字的 PDF 或用图片 OCR。</p>}
    {pageText.length>0&&<div className="pdf-page-text" aria-label={`PDF 第 ${currentPage} 页文本层`}>
      <strong>本页文本层（划线片段以黄色标注）</strong>
      <p>{renderPageTextWithHighlights(pageText,pageHighlights.map((h)=>h.quote))}</p>
    </div>}
    <ContextSelection key={`${document.documentId}-${currentPage}`} pageText={pageText} highlightQuotes={pageHighlights.map((h)=>h.quote)} onSelect={(start,end,quote)=>dispatch({type:'ATTACH_MATERIAL',material:documents.createSelection(currentPage,start,end,quote)})} onHighlight={(start,end,quote)=>addHighlight(currentPage,quote)}/>
  </section>;
}
