import PendingOutlined from '@mui/icons-material/PendingOutlined';
export function ProposalBadge({label='本地演示候选 · 尚未提交'}:{label?:string}):JSX.Element{return<span className="proposal-badge"><PendingOutlined fontSize="small"/>{label}</span>}
