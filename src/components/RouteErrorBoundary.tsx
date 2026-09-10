import{Component,type ErrorInfo,type ReactNode}from'react';
import{Alert,Button}from'@mui/material';

interface Props{children:ReactNode;}
interface State{failed:boolean;autoReloading:boolean;}

/** 判定是否为「发版后旧 chunk 404」类加载失败：动态 import 失败的典型消息（Vite/Rollup 产物） */
const isChunkLoadError=(error:unknown):boolean=>{
  const msg=error instanceof Error?error.message:String(error);
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Loading chunk \d+ failed|ChunkLoadError/i.test(msg);
};

/**
 * 页面级错误边界：路由懒加载 chunk 下载失败（弱网/离线/发版后旧哈希 404）等
 * 渲染异常时，给出可操作的降级 UI，而不是白屏。
 *
 * 发版场景自动恢复：旧标签页引用的 chunk 在重新构建后 404，重试必然再失败——
 * 直接自动刷新一次加载新 bundle（间隔退避：3s 内只刷一次，防服务器持续异常时刷新循环）。
 */
const AUTO_RELOAD_KEY='route-error-auto-reload-at';

export class RouteErrorBoundary extends Component<Props,State>{
  public state:State={failed:false,autoReloading:false};

  public static getDerivedStateFromError():State{return{failed:true,autoReloading:false};}

  public componentDidCatch(error:Error,errorInfo:ErrorInfo):void{
    console.error('[route-error]',error.message,errorInfo.componentStack);
    if(isChunkLoadError(error)&&!this.state.autoReloading){
      const last=Number(sessionStorage.getItem(AUTO_RELOAD_KEY)??0);
      if(Date.now()-last>3000){
        try{sessionStorage.setItem(AUTO_RELOAD_KEY,String(Date.now()));}catch{/* ignore */}
        this.setState({autoReloading:true});
        window.location.reload();
        return;
      }
    }
  }

  private readonly reload=():void=>{window.location.reload();};

  public render():ReactNode{
    if(this.state.failed)return<div className="page" role="alert"><Alert severity="warning"><strong>{this.state.autoReloading?'应用已更新，正在自动刷新…':'页面加载失败'}</strong><br/>{this.state.autoReloading?'正在加载新版本（若长时间未刷新请手动重试）。':'可能是网络中断或应用已更新（旧文件失效）。'}<br/><Button variant="contained" size="small" onClick={this.reload} style={{marginTop:8}}>重新加载页面</Button></Alert></div>;
    return this.props.children;
  }
}
