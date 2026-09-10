import {useEffect,useState} from 'react';import {Button} from '@mui/material';import Replay from '@mui/icons-material/Replay';
/**
 * OpenMAIC 课件演示渲染器。
 * - 数学数值动画：竖式加/减、凑十、乘法分组（SVG 逐帧）
 * - 通用分步揭示：step-reveal（任何题型）
 * - 语文专属：keyword-mark 关键词圈画 / story-sequence 事件顺序 / sentence-build 句子扩写
 * 全部自动播放一次、可重播；SVG 类遵循布局纪律（解说与图形分行固定 y，禁同层混排）。
 */
type NumDemo = { kind:'column-addition'|'make-ten'|'column-subtraction'|'multiplication-groups'; a:number; b:number };
type StepRevealDemo = { kind:'step-reveal'; steps:string[] };
type KeywordMarkDemo = { kind:'keyword-mark'; sentence:string; keywords:string[] };
type StorySequenceDemo = { kind:'story-sequence'; events:string[] };
type SentenceBuildDemo = { kind:'sentence-build'; base:string; addHow:string; addMetaphor?:string };
type Demo = NumDemo | StepRevealDemo | KeywordMarkDemo | StorySequenceDemo | SentenceBuildDemo;
/* 完整校验（与后端 validateCourseware 对齐）：残缺数据一律不渲染，避免渲染崩溃导致课堂白屏 */
function normalizeDemo(raw:Demo):Demo|null{
  if(!raw||typeof raw!=='object')return null;
  const kind=raw.kind;
  if(kind==='step-reveal'){const s=(raw.steps??[]).filter((t)=>typeof t==='string'&&t.trim());return s.length>=2?{kind,steps:s}:null}
  if(kind==='keyword-mark'){const kw=(raw.keywords??[]).filter((k)=>typeof k==='string'&&k.trim());return raw.sentence&&kw.length>=2?{kind,sentence:raw.sentence,keywords:kw}:null}
  if(kind==='story-sequence'){const ev=(raw.events??[]).filter((e)=>typeof e==='string'&&e.trim());return ev.length>=2?{kind,events:ev}:null}
  if(kind==='sentence-build'){return raw.base&&(raw.addHow||raw.addMetaphor)?{kind,base:raw.base,addHow:raw.addHow??'',...(raw.addMetaphor?{addMetaphor:raw.addMetaphor}:{})}:null}
  return Number.isFinite(raw.a)&&Number.isFinite(raw.b)&&raw.a>0&&raw.b>0?raw:null;
}
export function CoursewareDemo({demo:raw}:{demo:Demo}):JSX.Element{
  const demo=normalizeDemo(raw);
  const[runKey,setRunKey]=useState(0);
  if(!demo)return<div className="courseware-demo" data-incomplete="1"/>;
  return<div className="courseware-demo">
    {demo.kind==='column-addition'&&<ColumnAdditionAnim key={`c-${runKey}`} a={demo.a} b={demo.b}/>}
    {demo.kind==='make-ten'&&<MakeTenAnim key={`m-${runKey}`} a={demo.a} b={demo.b}/>}
    {demo.kind==='column-subtraction'&&<ColumnSubtractionAnim key={`s-${runKey}`} a={demo.a} b={demo.b}/>}
    {demo.kind==='multiplication-groups'&&<MultiplicationGroupsAnim key={`g-${runKey}`} a={demo.a} b={demo.b}/>}
    {demo.kind==='step-reveal'&&<StepRevealAnim key={`r-${runKey}`} lines={demo.steps}/>}
    {demo.kind==='keyword-mark'&&<KeywordMarkAnim key={`k-${runKey}`} sentence={demo.sentence} keywords={demo.keywords}/>}
    {demo.kind==='story-sequence'&&<StorySequenceAnim key={`q-${runKey}`} events={demo.events}/>}
    {demo.kind==='sentence-build'&&<SentenceBuildAnim key={`b-${runKey}`} base={demo.base} addHow={demo.addHow} addMetaphor={demo.addMetaphor}/>}
    <Button size="small" startIcon={<Replay/>} onClick={()=>setRunKey((k)=>k+1)}>重播演示</Button>
  </div>;
}
/* ---------- 竖式加法：个位相加 → 满十进一 → 十位相加 ---------- */
function ColumnAdditionAnim({a,b}:{a:number;b:number}):JSX.Element{
  const onesA=a%10, onesB=b%10, tensA=Math.floor(a/10), tensB=Math.floor(b/10);
  const onesSum=onesA+onesB, carry=Math.floor(onesSum/10), onesResult=onesSum%10, tensResult=tensA+tensB+carry, total=a+b;
  /* 帧：0=摆数字 1=个位相加 2=进一 3=十位相加 4=答案 */
  const[frame,setFrame]=useState(0);
  useEffect(()=>{const timers=[0,1400,3000,4600].map((t,i)=>setTimeout(()=>setFrame(i+1),t));return()=>timers.forEach(clearTimeout);},[]);
  /* 解说固定在底部 y=170，与竖式图形区（y<140）完全分离 */
  const note=frame===1?`个位：${onesA}+${onesB}=${onesSum}${carry>0?'，满十':''}`:frame===2&&carry>0?'个位满十，向十位进一':frame===3?`十位：${tensA}+${tensB}${carry?`+${carry}`:''}=${tensResult}`:frame>=4?`所以 ${a}+${b}=${total}`:'';
  return<figure className="demo-figure"><svg viewBox="0 0 320 190" className="demo-svg" role="img" aria-label={`${a}+${b} 竖式演示`}>
    <text x={210} y={36} className="d-num">{tensA}</text><text x={250} y={36} className="d-num">{onesA}</text>
    <text x={176} y={72} className="d-op">+</text><text x={210} y={72} className="d-num">{tensB}</text><text x={250} y={72} className="d-num">{onesB}</text>
    <line x1={150} y1={88} x2={286} y2={88} className="d-line"/>
    {frame>=2&&carry>0&&<text x={214} y={14} className="d-carry">1</text>}
    {frame>=3&&<text x={210} y={126} className="d-res">{tensResult}</text>}
    {frame>=1&&<text x={250} y={126} className="d-res">{frame>=2?onesResult:onesSum}</text>}
    {frame>=4&&<rect x={160} y={98} width={120} height={44} className="d-box"/>}
    {note&&<text x={16} y={170} className="d-note">{note}</text>}
  </svg><figcaption className="demo-caption">竖式演示：先个位、满十进一、再十位</figcaption></figure>;
}
/* ---------- 凑十法：b 拆成「补数 + 剩余」，a+补数=整十 ---------- */
function MakeTenAnim({a,b}:{a:number;b:number}):JSX.Element{
  const toNext=(10-(a%10))%10||10; const rest=b-toNext; const ten=a+toNext;
  /* 分行布局（y 固定互不重叠）：行1 y=52 原式；行2 y=86..120 拆解块；行3 y=162 凑十；行4 y=196 结果 */
  const[frame,setFrame]=useState(0);
  useEffect(()=>{const timers=[0,1500,3200].map((t,i)=>setTimeout(()=>setFrame(i+1),t));return()=>timers.forEach(clearTimeout);},[]);
  const chipX1=148, chipX2=206, chipY=88, chipW=46, chipH=34;
  return<figure className="demo-figure"><svg viewBox="0 0 380 210" className="demo-svg" role="img" aria-label={`${a}+${b} 凑十法演示`}>
    {/* 行1：原式（b 拆解后变淡） */}
    <text x={30} y={52} className="d-num">{a}</text><text x={80} y={52} className="d-op">+</text><text x={116} y={52} className={`d-num${frame>=1?' dim':''}`}>{b}</text>
    {frame>=3&&<text x={290} y={52} className="d-res">= {a+b}</text>}
    {/* 拆数箭头：b 底部弧线到拆解块上方，经空白区不穿字 */}
    {frame>=1&&<path d={`M ${124+String(b).length*17} 60 C ${chipX1-8} 70, ${chipX1-10} 78, ${chipX1+12} ${chipY-4}`} className="d-arrow"/>}
    {/* 行2：拆解圆角块 + 右侧注释（注释在块右侧同一水平线，留足间距） */}
    {frame>=1&&<g>
      <rect x={chipX1} y={chipY} width={chipW} height={chipH} rx={8} className="d-chip-rect yellow"/><text x={chipX1+chipW/2} y={chipY+24} textAnchor="middle" className="d-chip-num">{toNext}</text>
      <rect x={chipX2} y={chipY} width={chipW} height={chipH} rx={8} className="d-chip-rect plain"/><text x={chipX2+chipW/2} y={chipY+24} textAnchor="middle" className="d-chip-num">{rest}</text>
      <text x={chipX2+chipW+16} y={chipY+23} className="d-note">← {b} 拆成 {toNext} 和 {rest}</text>
    </g>}
    {/* 行3/行4：固定行距的解说 */}
    {frame>=2&&<text x={30} y={162} className="d-note">{a} + {toNext} = <tspan className="d-ten">{ten}</tspan>（整十）</text>}
    {frame>=3&&<text x={30} y={196} className="d-note strong">{ten} + {rest} = {a+b}</text>}
  </svg><figcaption className="demo-caption">凑十法：把 {b} 拆开，先凑出整十数 {ten}</figcaption></figure>;
}

/* ---------- 竖式减法：个位够不够 → 退位点 → 十位 ---------- */
function ColumnSubtractionAnim({a,b}:{a:number;b:number}):JSX.Element{
  const onesA=a%10, onesB=b%10, tensA=Math.floor(a/10), tensB=Math.floor(b/10);
  const borrow=onesA<onesB;
  const onesTop=borrow?onesA+10:onesA;
  const onesResult=onesTop-onesB;
  const tensLeft=tensA-(borrow?1:0);
  const tensResult=tensLeft-tensB;
  const total=a-b;
  const[frame,setFrame]=useState(0);
  useEffect(()=>{const timers=[0,1500,3100,4700].map((t,i)=>setTimeout(()=>setFrame(i+1),t));return()=>timers.forEach(clearTimeout);},[]);
  const note=frame===1?(borrow?`个位：${onesA} 减 ${onesB} 不够减`:`个位：${onesA}-${onesB}=${onesResult}`):frame===2&&borrow?`退一当十：${onesA} 变成 ${onesTop}`:frame===3?`十位：${tensLeft}-${tensB}=${tensResult}`:frame>=4?`所以 ${a}-${b}=${total}`:'';
  return<figure className="demo-figure"><svg viewBox="0 0 320 190" className="demo-svg" role="img" aria-label={`${a}-${b} 退位减法演示`}>
    <text x={210} y={36} className="d-num">{tensA}</text><text x={250} y={36} className="d-num">{onesA}</text>
    <text x={176} y={72} className="d-op">−</text><text x={210} y={72} className="d-num">{tensB}</text><text x={250} y={72} className="d-num">{onesB}</text>
    <line x1={150} y1={88} x2={286} y2={88} className="d-line"/>
    {frame>=2&&borrow&&<text x={246} y={14} className="d-carry">退1</text>}
    {frame>=2&&borrow&&<text x={210} y={30} className="d-carry-small">{tensA-1}</text>}
    {frame>=2&&borrow&&<text x={250} y={30} className="d-carry-small">{onesTop}</text>}
    {frame>=3&&<text x={210} y={126} className="d-res">{tensResult}</text>}
    {frame>=1&&<text x={250} y={126} className="d-res">{frame>=2?onesResult:''}</text>}
    {frame>=4&&<rect x={160} y={98} width={120} height={44} className="d-box"/>}
    {note&&<text x={16} y={170} className="d-note">{note}</text>}
  </svg><figcaption className="demo-caption">退位减法演示：不够减就退一当十</figcaption></figure>;
}
/* ---------- 乘法分组：a 组每组 b 个，2 行网格排布（点不黏连、组不相交） ---------- */
function MultiplicationGroupsAnim({a,b}:{a:number;b:number}):JSX.Element{
  const total=a*b;
  const[frame,setFrame]=useState(0);
  useEffect(()=>{const timers=Array.from({length:a},(_,i)=>setTimeout(()=>setFrame(i+1),i*900));return()=>timers.forEach(clearTimeout);},[]);
  /* 2 行网格：上行 ceil(b/2) 个、下行 floor(b/2) 个；固定间距保证点直径 16 > 间距 26 不黏连 */
  const perRow=Math.ceil(b/2);
  const dx=26, dy=25, dotR=8;
  const groupW=perRow*dx+12;
  const groupGap=16;
  const W=a*(groupW+groupGap)+20, H=182;
  return<figure className="demo-figure"><svg viewBox={`0 0 ${W} ${H}`} className="demo-svg" role="img" aria-label={`${a} 个 ${b} 乘法演示`}>
    <text x={16} y={28} className="d-note strong">{a} 个 {b} 是多少？</text>
    {Array.from({length:a},(_,g)=>{
      const gx=12+g*(groupW+groupGap);
      const gy=40;
      const shown=g<frame;
      return<g key={g}>
        <rect x={gx} y={gy} width={groupW} height={2*dy+10} rx={10} className={shown?'d-group-rect on':'d-group-rect'}/>
        {Array.from({length:b},(_,i)=>{
          const row=i%2, col=Math.floor(i/2);
          const cx=gx+8+col*dx+dotR;
          const cy=gy+14+row*dy+dotR;
          return<circle key={i} cx={cx} cy={cy} r={dotR} className={shown?'d-dot on':'d-dot'}/>;
        })}
        {shown&&<text x={gx+groupW/2} y={gy+2*dy+32} textAnchor="middle" className="d-note">{(g+1)*b}</text>}
      </g>;
    })}
    {frame>=a&&<text x={16} y={H-6} className="d-note strong" textLength={W-32} lengthAdjust="spacingAndGlyphs">加起来：{Array.from({length:a},(_,i)=>(i+1)*b).join('、')}，一共 {total} 个</text>}
  </svg><figcaption className="demo-caption">乘法演示：{a} 组圆点，每组 {b} 个</figcaption></figure>;
}
/* ---------- 语文：关键词圈画（阅读课核心方法——抓住关键词就读懂了句子） ---------- */
/* 按关键词在句中的出现位置切分，避免整句重排；同词只圈首处，重叠跳过 */
function splitByKeywords(sentence:string,keywords:string[]):Array<{text:string;order:number}>{
  const hits=keywords.map((kw,i)=>({kw,at:sentence.indexOf(kw),order:i})).filter((h)=>h.at>=0).sort((a,b)=>a.at-b.at);
  const segs:Array<{text:string;order:number}>=[];let cursor=0;
  for(const h of hits){
    if(h.at<cursor)continue;
    if(h.at>cursor)segs.push({text:sentence.slice(cursor,h.at),order:-1});
    segs.push({text:h.kw,order:h.order});
    cursor=h.at+h.kw.length;
  }
  if(cursor<sentence.length)segs.push({text:sentence.slice(cursor),order:-1});
  return segs;
}
function KeywordMarkAnim({sentence,keywords}:{sentence:string;keywords:string[]}):JSX.Element{
  const segs=splitByKeywords(sentence,keywords);
  /* 编号、揭示、圈画三者统一按「句中阅读顺序」：若列表编号沿用 LLM 给的重要性次序，
     会出现「1号词」在句子里排第二的情况，二年级孩子无法把编号对应到句中位置。 */
  const ordered=segs.filter((s)=>s.order>=0).map((s,i)=>({text:s.text,seq:i}));
  const seqByText=new Map(ordered.map((o)=>[o.text,o.seq]));
  const[shown,setShown]=useState(0);
  useEffect(()=>{const timers=ordered.map((_,i)=>setTimeout(()=>setShown(i+1),1100*(i+1)));return()=>timers.forEach(clearTimeout);},[ordered.length]);
  const done=shown>=ordered.length;
  return<figure className="demo-figure"><div className="kw-read">
    <p className="kw-sentence">{segs.map((seg,i)=>seg.order<0
      ?<span key={i}>{seg.text}</span>
      :<mark key={i} className={(seqByText.get(seg.text)??0)<shown?'kw-hit on':'kw-hit'}>{seg.text}</mark>)}</p>
    <ul className="kw-list">{ordered.map((o)=><li key={o.seq} className={o.seq<shown?'revealed':'pending'}><span className="kw-index">{o.seq+1}</span>{o.text}</li>)}</ul>
    {done&&<p className="kw-conclusion">把关键词连起来，句子的意思就清楚了。</p>}
  </div><figcaption className="demo-caption">关键词圈画：抓住关键词，就读懂了这句话</figcaption></figure>;
}
/* ---------- 语文：事件顺序（复述课核心方法——理清先后就能讲清楚） ---------- */
function StorySequenceAnim({events}:{events:string[]}):JSX.Element{
  const[shown,setShown]=useState(0);
  useEffect(()=>{const timers=events.map((_,i)=>setTimeout(()=>setShown(i+1),1000*(i+1)));return()=>timers.forEach(clearTimeout);},[events.length]);
  const done=shown>=events.length;
  return<figure className="demo-figure"><div className="seq-wrap">
    <ol className="seq-list">{events.map((ev,i)=><li key={i} className={i<shown?'revealed':'pending'}>
      <span className="seq-index">{i+1}</span><span className="seq-text">{ev}</span>
    </li>)}</ol>
    {done&&<p className="seq-conclusion">按这个顺序说，先说……接着……然后……最后……</p>}
  </div><figcaption className="demo-caption">事件顺序：按先后排一排，复述就不乱</figcaption></figure>;
}
/* ---------- 语文：句子扩写（表达课核心方法——把话说完整、说生动） ---------- */
function SentenceBuildAnim({base,addHow,addMetaphor}:{base:string;addHow:string;addMetaphor?:string}):JSX.Element{
  const layers=1+(addHow?1:0)+(addMetaphor?1:0);
  const[frame,setFrame]=useState(1);
  useEffect(()=>{const timers=Array.from({length:layers-1},(_,i)=>setTimeout(()=>setFrame(i+2),1400*(i+1)));return()=>timers.forEach(clearTimeout);},[layers]);
  return<figure className="demo-figure"><div className="build-wrap">
    <div className="build-step done"><span className="build-tag">骨架</span><p>{base}</p></div>
    {addHow&&(frame>=2?<div className="build-step done"><span className="build-tag">加「怎么样」</span><p>{addHow}</p></div>:<div className="build-step pending"><span className="build-tag">加「怎么样」</span><p>待展开…</p></div>)}
    {addMetaphor&&(frame>=3?<div className="build-step done"><span className="build-tag">加比喻</span><p>{addMetaphor}</p></div>:<div className="build-step pending"><span className="build-tag">加比喻</span><p>待展开…</p></div>)}
    {frame>=layers&&<p className="build-conclusion">{addMetaphor?'一句平常的话，加上「怎么样」和比喻，就活起来了。':'把「怎么样」加上去，句子就说得更具体了。'}</p>}
  </div><figcaption className="demo-caption">{addMetaphor?'句子扩写：骨架 → 加「怎么样」 → 加比喻':'句子扩写：骨架 → 加「怎么样」'}</figcaption></figure>;
}
/* ---------- 通用分步揭示：LLM 逐句出，任何题型都能演 ---------- */
function StepRevealAnim({lines}:{lines:string[]}):JSX.Element{
  const safe=Array.isArray(lines)?lines.filter((s)=>typeof s==='string'&&s.trim()):[];
  const[shown,setShown]=useState(1);
  useEffect(()=>{const timers=safe.slice(1).map((_,i)=>setTimeout(()=>setShown(i+2),1200*(i+1)));return()=>timers.forEach(clearTimeout);},[safe.length]);
  return<figure className="demo-figure"><ol className="step-reveal-list">
    {safe.map((line,i)=>(<li key={i} className={i<shown?'revealed':'pending'}><span className="step-reveal-index">{i+1}</span><span>{line}</span>{i<shown&&<span className="interaction-ack"> ✓</span>}</li>))}
  </ol><figcaption className="demo-caption">分步演示（共 {safe.length} 步，自动逐条揭示）</figcaption></figure>;
}
