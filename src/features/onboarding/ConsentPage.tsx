import{Alert,Button,Checkbox,FormControlLabel}from'@mui/material';import{useEffect,useState}from'react';import{useNavigate}from'react-router-dom';import{useLearningSession}from'../../state/LearningSessionProvider';

export interface LastSessionHint{learnerId:string;textbookId:string;textbookTitle:string;lessonId:string;pdfFileName:string;savedAt:number;}

const HINT_KEY='paper-desk.last-session';

export function saveLastSessionHint(hint:Omit<LastSessionHint,'savedAt'>):void{try{sessionStorage.setItem(HINT_KEY,JSON.stringify({...hint,savedAt:Date.now()}));}catch{/* 存储不可用（隐私模式/配额）时静默降级：不恢复提示 */}}
export function clearLastSessionHint():void{try{sessionStorage.removeItem(HINT_KEY);}catch{/* 同上 */}}
export function readLastSessionHint():LastSessionHint|null{try{const raw=sessionStorage.getItem(HINT_KEY);if(!raw)return null;const parsed=JSON.parse(raw)as LastSessionHint;if(typeof parsed.savedAt!=='number')return null;return parsed;}catch{return null;}}

export function ConsentPage():JSX.Element{const[checked,setChecked]=useState(false);const{consent,restoreSession,state}=useLearningSession();const navigate=useNavigate();const[hint,setHint]=useState<LastSessionHint|null>(null);const[restoring,setRestoring]=useState(false);
useEffect(()=>{setHint(readLastSessionHint());},[]);
const learnerLabel=state.identity.learnerId==='learner-a'?'A':'B';
return<section className="page consent"><p className="eyebrow">监护人确认 · 本地会话</p><h1>把边界讲清楚，<br/>再打开这本书。</h1><div className="consent-copy"><p>首版不创建账号。年级、教材选择、作答和候选证据仅在当前浏览器标签页内使用。</p><p>本地 PDF 不上传、不长期保存；关闭、切换学习者或退出时销毁。所有讲解、批改、错题和下一课均为演示候选。</p>
{hint&&!restoring&&hint.learnerId===state.identity.learnerId&&<Alert severity="info" className="session-restore-hint" role="status"><strong>检测到上次会话（本标签页内）</strong><br/>学习者 {learnerLabel} · {hint.textbookTitle}{hint.pdfFileName?` · 曾打开 PDF「${hint.pdfFileName}」（需重新选择文件）`:''}。<br/><Button size="small" onClick={()=>{setRestoring(true);void consent().then(()=>restoreSession(hint)).then(()=>navigate('/classroom'));}}>继续上次会话</Button><Button size="small" onClick={()=>{clearLastSessionHint();setHint(null);}}>不恢复</Button></Alert>}
<FormControlLabel control={<Checkbox checked={checked} onChange={(e)=>setChecked(e.target.checked)}/>} label="我已了解本地数据范围，并确认导入文件为合法持有"/><Button variant="contained" disabled={!checked&&!restoring} onClick={()=>{void consent().then(()=>navigate('/library'))}}>为学习者 {learnerLabel} 选择教材</Button></div></section>}
