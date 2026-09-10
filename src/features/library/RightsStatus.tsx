import VerifiedOutlined from '@mui/icons-material/VerifiedOutlined';import LockOutlined from '@mui/icons-material/LockOutlined';import type {RightsStatus as Status} from '../../contracts/textbook';
const labels:Record<Status,string>={'authorized-demo':'原创演示内容，可读','local-user-owned':'用户本地合法持有','catalog-only':'仅目录可用','unavailable':'暂不可用'};
export function RightsStatus({status}:{status:Status}):JSX.Element{const Icon=status==='authorized-demo'||status==='local-user-owned'?VerifiedOutlined:LockOutlined;return<span className="rights"><Icon fontSize="small"/>{labels[status]}</span>}
