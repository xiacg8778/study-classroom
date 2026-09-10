import {TextField} from '@mui/material';
export function StepAnswerInput({value,onChange}:{value:string;onChange:(value:string)=>void}):JSX.Element{return<TextField fullWidth multiline minRows={3} label="写出分步思路" value={value} onChange={(e)=>onChange(e.target.value)} />}
