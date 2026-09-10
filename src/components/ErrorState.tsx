import ReportProblemOutlined from '@mui/icons-material/ReportProblemOutlined'; import {Alert} from '@mui/material';
export function ErrorState({message}:{message:string}):JSX.Element{return<Alert severity="warning" icon={<ReportProblemOutlined/>}>{message}</Alert>}
