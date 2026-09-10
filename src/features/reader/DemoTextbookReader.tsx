import type {Textbook} from '../../contracts/textbook';import {SafeText} from '../../components/SafeText';import {Button} from '@mui/material';import VolumeUpOutlined from '@mui/icons-material/VolumeUpOutlined';import {useLearningSession} from '../../state/LearningSessionProvider';import {TtsControls} from '../lesson/TtsControls';
/* 教材正文朗读：课文是孩子最先要读的内容（低年级识字量不足），此处必须可朗读——
   此前朗读只覆盖「生成课件之后」的五个环节，教材正文反而没有（用户反馈「哪里有朗读」）。
   顶部朗读条读整课（标题+各段分段发音）；每段另配按钮可单独重听该段（听不懂某句时用）。 */
export function DemoTextbookReader({textbook,lessonId}:{textbook:Textbook;lessonId:string}):JSX.Element{
  const{speech}=useLearningSession();
  const lesson=textbook.lessons.find((item)=>item.lessonId===lessonId);
  const pages=lesson?.pages??[];
  return<article className="reader-page">
    {/* 朗读条置于最顶：课文标题字号极大（clamp 到 4.7rem）会把控件压到屏幕最下沿，孩子第一眼看不到 */}
    {pages.length>0&&<TtsControls segments={[lesson?.title??'',...pages]} auto label="朗读本课课文"/>}
    <header><span>ORIGINAL DEMO / PAGE 01</span><h2>{lesson?.title}</h2></header>
    {pages.map((text,index)=><section key={text}>
      <span className="margin-note">{String(index+1).padStart(2,'0')}</span>
      <SafeText text={text} as="p"/>
      {speech.supported()&&<Button className="reader-speak" size="small" startIcon={<VolumeUpOutlined/>} onClick={()=>speech.speak(text)}>朗读这段</Button>}
    </section>)}
  </article>;
}
