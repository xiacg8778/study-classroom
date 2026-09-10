import {ButtonGroup,Button,FormControlLabel,Switch} from '@mui/material';import PlayArrowOutlined from '@mui/icons-material/PlayArrowOutlined';import PauseOutlined from '@mui/icons-material/PauseOutlined';import VolumeOffOutlined from '@mui/icons-material/VolumeOffOutlined';import AutorenewOutlined from '@mui/icons-material/AutorenewOutlined';import VolumeUpOutlined from '@mui/icons-material/VolumeUpOutlined';import {useEffect,useRef,useState} from 'react';import {useLearningSession} from '../../state/LearningSessionProvider';
/* 课堂文本朗读控件（醒目条状：低年级学生需要一眼看到、一点就读）。
   - text：整段朗读；segments：分段朗读（标题/正文/动作分开发音，段间自然停顿），两者至少给一个
   - auto：true 时挂载或内容变化自动开读
   - 静音为总开关（压制自动朗读）；不产生任何学习证据（本地 speechSynthesis） */
const AUTO_KEY='paper-desk.tts-auto';
/* 默认开启自动朗读：目标用户是低年级学生（识字量不足），朗读是读题刚需而非可选装饰。
   仅在用户显式关闭过（存 '0'）时保持关闭。 */
function readAutoPref():boolean{try{const raw=localStorage.getItem(AUTO_KEY);return raw===null?true:raw==='1'}catch{return true}}
export function TtsControls({text,segments,auto=false,label='朗读这段文字'}:{text?:string;segments?:string[];auto?:boolean;label?:string}):JSX.Element{
  const{speech}=useLearningSession();
  const[muted,setMuted]=useState(false);
  const[autoOn,setAutoOn]=useState(readAutoPref);
  const spokenRef=useState({key:''})[0];
  const textToSpeak=segments?.join('|')??text??'';
  const parts=segments??(text?[text]:[]);
  const play=():void=>{if(parts.length>1){if(speech.speakSegments)speech.speakSegments(parts);else speech.speak(parts.join('。'))}else if(parts.length)speech.speak(parts[0])};
  const doSpeak=useRef(play);
  doSpeak.current=play;
  /* 自动朗读：内容变化且开关开启时自动开读（含首次挂载） */
  useEffect(()=>{
    if(!auto||!autoOn||muted||!textToSpeak)return;
    if(spokenRef.key===textToSpeak)return;
    spokenRef.key=textToSpeak;
    const t=window.setTimeout(()=>doSpeak.current(),350); /* 等 MUI 渲染完再读，避免抢主线程 */
    return()=>window.clearTimeout(t);
  },[textToSpeak,auto,autoOn,muted,spokenRef]);
  if(!speech.supported())return<p className="tts-unsupported">当前浏览器不支持本地朗读；完整文字保留在页面上。</p>;
  return<div className="tts-bar" role="group" aria-label="朗读控制">
    <span className="tts-bar-label"><VolumeUpOutlined fontSize="small"/>{label}</span>
    <ButtonGroup aria-label="朗读控制" size="small">
      <Button startIcon={<PlayArrowOutlined/>} onClick={play}>{autoOn?'朗读 / 重播':'朗读'}</Button>
      <Button startIcon={<PauseOutlined/>} onClick={()=>speech.pause()}>暂停</Button>
      <Button startIcon={<AutorenewOutlined/>} onClick={()=>{speech.stop();spokenRef.key='';play();}}>重读</Button>
      <Button startIcon={<VolumeOffOutlined/>} onClick={()=>{const next=!muted;setMuted(next);speech.setMuted(next)}}>{muted?'取消静音':'静音'}</Button>
    </ButtonGroup>
    {auto&&<FormControlLabel className="tts-bar-auto" control={<Switch checked={autoOn} onChange={(e)=>{const next=e.target.checked;setAutoOn(next);try{localStorage.setItem(AUTO_KEY,next?'1':'0')}catch{/* 会话内生效即可 */}}} size="small"/>} label="自动朗读"/>}
  </div>;
}
