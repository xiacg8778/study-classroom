# 纸上课桌 · study-classroom

面向小学二年级语数自学场景的**本地优先**（local-first）学习 Web 应用。

孩子的学习数据默认只存在本机：不注册、不上云、不依赖外部服务即可完整使用。

## 核心能力

| 模块 | 说明 |
|---|---|
| 教材库 | 语文（上下册 18 课）、数学（上下册）教材目录与课文导读 |
| 互动课堂 | 分步讲解课件 + 演示动画，每步一个互动；掌握度与下一课建议由本地确定性判定链生成 |
| 拍照识题 | 浏览器本地 OCR（Tesseract.js，中英文语言包随仓库提供），离线可用 |
| 错题候选 | 从识别与作答结果中提取待确认的错题 |
| 知识路径 | 以知识点图谱展示已掌握与待巩固 |
| 本地数据 | 查看 / 导出 / 删除本机学习数据 |

### 演示动画

课件内的「演示」按题型匹配渲染器，无法匹配时宁缺毋滥——不渲染错配演示：

- **数学**：竖式加法 `column-addition`、竖式减法 `column-subtraction`、凑十法 `make-ten`、乘法分组 `multiplication-groups`
- **语文**：关键词圈画 `keyword-mark`、事件顺序 `story-sequence`、句子扩写 `sentence-build`
- **通用**：分步揭示 `step-reveal`

演示类型由**契约 → 校验 → 渲染 → 提示词**四层同步约束，残缺或非法数据一律拒绝渲染（渲染崩溃会导致整个课堂页白屏）。

## 快速开始

```bash
npm install
npm run dev
```

打开终端提示的地址即可。默认 `VITE_AI_MODE=off`，全部功能走本地逻辑，无需任何密钥。

### 可选：启动本地互动课堂运行时

课件由本地运行时生成：

```bash
node scripts/openmaic-bff.mjs --port 4640
```

然后在应用内「本地数据」页启用**互动课堂**开关。未启用时回落到内置的本地预设讲解包。

### 可选：启用 AI 增强

AI 讲解经本机代理转发，**浏览器永不持有密钥**（密钥只从环境变量读取）：

```bash
AI_PROXY_API_KEY=<你的密钥> node scripts/ai-proxy.mjs
```

`scripts/` 下另有 `host-bff.mjs`（本地登记服务演示）等运行时脚本。

## 质量门禁

```bash
npm run lint         # ESLint
npm run typecheck    # tsc 类型检查
npx vitest run       # 单元测试
npm run test:e2e     # Playwright 端到端
```

E2E 覆盖 7 个项目：桌面 / 平板 / 移动 Chromium、WebKit、Android 与 iPhone 模拟、本机已安装 Chrome。

## 项目结构

```
src/
  app/         路由与应用外壳
  features/    按业务垂直切分（library / classroom / lesson / quiz /
               wrong-questions / knowledge-graph / reader / data-control …）
  contracts/   领域契约与类型（含课件演示类型）
  adapters/    外部依赖适配器（local-demo 本地演示引擎、openmaic 课件运行时、
               tesseract OCR、pdfjs、speech、ai-hybrid、host-bff）
  services/    运行时配置与本地能力
  state/       应用状态
scripts/       本地运行时（课件 BFF、AI 代理、登记 BFF）与课件校验核心
docs/          架构、PRD、任务与验收报告
tests/         unit（Vitest）与 e2e（Playwright）
```

## 文档

- [架构说明](docs/ARCHITECTURE.md)
- [产品需求](docs/PRD.md)
- [任务清单](docs/TASKS.md)
- [验收报告](docs/QA_REPORT.md)

## 说明

- 应用运行时不依赖云端；账号、数据库与跨设备同步均未接入，学习数据仅存本机。
- `node_modules/`、`dist/`、npm 缓存、测试产物与 `.env` 已由 `.gitignore` 排除。
- 教材内容为**原创示例**：单元结构对齐公开教学大纲，课文导读与练习为原创编写，不含出版社图文。
