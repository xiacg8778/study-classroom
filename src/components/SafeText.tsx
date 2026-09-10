export function SafeText({text,as='span'}:{text:string;as?:'span'|'p'}):JSX.Element{return as==='p'?<p>{text}</p>:<span>{text}</span>}
