import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { existsSync } from 'node:fs';
import { resolve, sep } from 'node:path';

/* 发版陈旧标签页自愈的关键：静态资源（/assets/** 或带扩展名）缺失必须返回真实 404，
   不做 SPA 回退。vite preview 默认把所有 404 兜底成 index.html（200+HTML），
   旧标签页加载旧 hash chunk 会拿到 HTML 当 JS 解析、永远失败，
   错误边界无法凭「应用已更新」特征自动刷新恢复。
   挂载顺序：configurePreviewServer 在静态服务之后、htmlFallback/indexHtml 之前注册；
   请求到达时磁盘无此文件即 404；页面路径（无扩展名）不经过此中间件，照常走 SPA 回退。 */
const staleAsset404 = (): Plugin => ({
  name: 'preview-404-for-stale-assets',
  configurePreviewServer(server) {
    const distDir = resolve(__dirname, 'dist');
    server.middlewares.use((req, res, next) => {
      const url = (req.url ?? '').split('?')[0];
      const isAsset = url.startsWith('/assets/') || /\.[a-zA-Z0-9]{1,8}$/.test(url);
      if (!isAsset) { next(); return; }
      const filePath = resolve(distDir, `.${decodeURIComponent(url)}`);
      if (!filePath.startsWith(distDir + sep) || !existsSync(filePath)) {
        res.statusCode = 404;
        res.end('Not Found');
        return;
      }
      next();
    });
  },
});

export default defineConfig({
  plugins: [react(), staleAsset404()],
  build: { target: 'es2022', sourcemap: true },
  preview: {
    /* 绑定 0.0.0.0：确保 localhost(IPv6) 与 127.0.0.1(IPv4) 两个地址都能访问，
       避免用户浏览器与自动化测试因 origin 不同看到两套 localStorage 配置 */
    host: '0.0.0.0',
    port: 4174,
    strictPort: true,
  },
});
