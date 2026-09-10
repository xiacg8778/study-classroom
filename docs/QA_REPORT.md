# Test Report

## 2026-09-08 复述提示错配（用户四次反馈）：每课学习包彻底替代按族套模板

- **现象**：平行四边形课的复述提示仍是「两位数加法什么时候要进位」。排查发现该课整条链路都在用加减法内容：复述提示、微课堂三步（先看个位/再算十位）、Quiz（47+28 计算题）、错题章节——根因是引擎只按「乘法/加减」两族分发，图形课被塞进加减族。
- **架构修复（每课学习包）**：fixtures 新增 `sjLessonPacks`（lessonId → 复述提示/教学目标/微课堂三步/错题章节+纠错入口+识别线索+图谱节点），引擎微课堂与 UI 复述提示均从包取（族模板降级为缺省兜底）；**新增图形课专用 Quiz sj2a-geo-quiz-01**（4 题原创：非四边形辨认/边角数量/拉动变形成因/与长方形区别，choice/fill/steps 三题型），sjQuizByLesson 把 unit2 从加减 Quiz 换为图形 Quiz。
- **同类排查结果**：按「每课可达区域」全清单核对——本节目录（上轮已修）、复述提示（本轮）、微课堂步骤（本轮）、Quiz（本轮）、错题章节/图谱节点（乘法/加减/图形三族已分，包内字段就绪待后续接 close 的包优先）、AI 路由 lessonPrompt（带 lessonId 上下文，无硬编码）——本轮后无残留错配。
- 端到端实测（平行四边形课）：微课堂目标「初步认识四边形与平行四边形」→ 复述「平行四边形和长方形比，什么变了、什么没变？」→ Quiz 首题「哪一个不是四边形」（截图 evidence-geometry-quiz.png）。
- 回归：lint/TS/build(443.44 kB)、Vitest 60/60、核心 E2E 5/5。
- 依赖安全升级继续暂停。

---

## 2026-09-08 「本节目录」硬编码修复：每课配独立目录（用户三次反馈）

- **现象**：不管选哪课，课堂左栏「本节目录」永远显示「看单位/算份数/反向检查」——这是分数演示课的三步法，被硬编码在 ClassroomPage JSX 里。
- **修复**：①Lesson 契约新增可选 `outline: string[]`；②苏教版 5 课各配独立目录（如口诀课：2 的口诀每次加 2 / 5 的口诀 0 或 5 结尾 / 口诀算两道乘法 / 用口诀解决问题；进位退位课：列竖式对齐数位 / 个位满十进 1 / 个位不够减退 1 / 加减互逆验算）；③课堂页按 `state.lessonId` 查当前课渲染 outline，缺省回退通用三步「整理材料/尝试第一步/自行核验」（本地 PDF 通用支架语义）。
- 实测：口诀课显示 4 条口诀目录；第 1 课显示进位退位目录（截图 evidence-outline-per-lesson.png）。
- 回归：lint/TS/build(435.77 kB)、Vitest 60/60。
- 依赖安全升级继续暂停。

---

## 2026-09-08 课程切换仍进第一课：回调丢参一行修复（用户二次反馈）

- **现象**：目录每课点进去都是第一课。根因：上一轮给 TextbookPicker 的 onSelect 加了 lessonId 参数，但 LibraryPage 的回调仍是 `(book)=>{selectDemo(book)}` 单参签名——lessonId 在此处被丢弃，selectDemo 回退 lessons[0]。上轮验证只确认「进了课堂」未核对课名，属验证不充分。
- **修复**：LibraryPage 回调改为 `(book,lessonId)=>{selectDemo(book,lessonId)}`（一行）。
- **逐课交叉验证（核对课名而非仅页面）**：点第 5 课 → 课堂出现「2～6 的乘法口诀」正文（含「三五十五」）；点第 3 课 → 出现「平行四边形」内容。第 1 课默认行为不变。
- 回归：typecheck/build 通过。教训同前：多课交付的验收必须逐课核对内容指纹（正文关键词），不能只验证路由跳转成功。
- 依赖安全升级继续暂停。

---

## 2026-09-08 苏教版教材「只有一课」：课程选择入口缺失修复（用户反馈）

- **现象**：苏教版二上 fixtures 有 5 课，但 UI 上只能学到第一课。根因：`selectDemo` 硬编码 `lessons[0]`，教材库书卡无课程列表，课堂内亦无切换入口——数据齐但不可达。
- **修复**：①`selectDemo(textbook, lessonId?)` 支持指定课程（缺省仍为第一课，向后兼容）；②教材库书卡新增「本册目录（N 课）」展开列表：编号+课名+逐课「打开这一课」；单课书（分数演示）保持原「打开这一课」直开不变。
- 实测：目录展开显示全部 5 课（进位退位/连加验算/平行四边形/乘法初步/2~6 口诀）；点第 3 课直接进课堂加载《平行四边形的初步认识》（截图 evidence-lesson-picker.png）。
- 回归：lint/TS/build(435.22 kB)、Vitest 60/60、核心 E2E 3/3。
- 依赖安全升级继续暂停。

---

## 2026-09-08 排查「已配置 AI 但无蓝紫条」：发现并修复 2 个真实断点 + 上游探活

- **用户现象**：UI 已配置 AI，但生成内容无蓝紫色 ai-note。排查发现生成请求其实都到了代理且正确降级（failures 累加），降级内容自然无 AI 标识——问题在链路中段。
- **断点 1（接口地址不完整）**：用户按 DeepSeek 官方文档习惯填 base URL（`https://api.deepseek.com`，缺 `/chat/completions`）。代理原样使用导致上游 404/400。修复：`callUpstream` 自动补全——不以 `/chat/completions` 结尾则追加；完整端点写法不受影响。
- **断点 2（DeepSeek json_object 限制）**：DeepSeek 要求提示词的**用户消息**含字面 'json' 才允许 `response_format:json_object`，原实现只写在 system。修复：用户消息末尾固定追加「请以 json 对象形式输出」。
- **新能力：上游探活**——代理新增 `POST /probe`（真实调用一次上游，最小 json 请求）；设置面板「检测连接」通过后出现「测试上游」按钮，返回 `上游 400：<原文摘要>` 这类可直接行动的错误信息。`/probe` 上线后立即定位了上述断点 2（此前的 /health 只能报告"代理活着、密钥存在"，探不到上游配置错误——这正是本次盲区）。
- 回归：lint/TS/build(435.17 kB)、Vitest 60/60。**用户真实 DeepSeek 配置端到端打通**：/probe ok → 选苏教版二上生成微课堂 → 徽章「AI 生成候选 · 建议家长复核」+ 蓝紫 ai-note 出现（截图 evidence-deepseek-ai-note.png）。
- 依赖安全升级继续暂停。

---

## 2026-09-08 AI 设置面板参考 Project013 优化（供应商预设）

- **借鉴点**（参考 /Users/xiacg/BuddyWorkspace/Project013_自学伴学助手Web 的 SettingsPage/llm.ts）：①供应商预设下拉（智谱 GLM/DeepSeek/通义千问/Moonshot Kimi/自定义），选中自动填接口地址与推荐模型，免手输 URL；②密钥掩码改为「前4****后4」（如 sk-a****67a4），比纯后 4 位更易辨认。Project013 的密钥安全模型（服务端文件持久化、浏览器不留存、掩码回显、保存即热生效）与本应用既有实现一致，未做改动。
- 回归：lint/TS/build(434.75 kB) 通过；Vitest 60/60。生产实测：预设下拉 5 项正常；选「智谱 GLM」自动填 bigmodel 地址与 glm-4-flash；探活显示既有配置掩码 sk-a****67a4（截图 evidence-preset-dropdown.png）。
- 依赖安全升级继续暂停。

---

## 2026-09-08 AI 代理参数（密钥/接口地址/模型）UI 配置

- **架构边界（密钥不进浏览器持久层）**：`AI_PROXY_API_KEY / AI_PROXY_BASE / AI_PROXY_MODEL` 全部可在「本地数据 → AI 接入设置」配置，但密钥保存路径是 **UI → 代理 `POST /config` → 本机文件 `~/.ai-proxy/config.json`（权限 0600）**——浏览器 localStorage 不存密钥（防 XSS 窃取），输入框刷新后为空属预期；`GET /config` 只回传是否存在与末 4 位掩码（`****-key`），不回传原文。
- **代理改造**（scripts/ai-proxy.mjs）：`/config` 读写端点（POST 校验 apiBase 必须 http(s)、字段白名单）；配置优先级 文件 > 环境变量 > 内置默认；热生效（改 model/apiBase 无需重启）。
- **浏览器侧**（aiRuntimeConfig.ts）：`fetchProxyConfig/saveProxyConfig`；密钥输入仅存 sessionStorage 会话暂存（刷新即失）；面板折叠区「API 密钥/接口地址/模型」三字段 + 保存按钮（保存后自动重探活更新状态行）+ 掩码回显。
- **生产全链实测（mock 上游 4620）**：代理无密钥初始态（health configured:false）→ UI 探活提示「未配置密钥」→ UI 填入三项保存 → 配置文件落盘 0600、掩码 `****-key` 回显、状态行变「在线 · 已配密钥」、密钥输入框清空 → 开启 AI 开关 → 苏教版二上课生成微课堂 → **徽章「AI 生成候选」+ mock AI 内容出现**（截图 evidence-ai-proxy-fields / evidence-ai-generated-after-ui-config.png）。
- 回归：lint/TS/build(434.20 kB) 通过；Vitest 60/60；E2E 核心 6/6。
- 安全说明：/config 仅本机回环可达；密钥文件 0600 仅当前用户可读；代理日志不含密钥与题目原文。
- 依赖安全升级继续暂停。

---

## 2026-09-08 AI 接入参数 UI 配置（运行时化，无需重新构建）

- **运行时配置**：新增 `src/services/aiRuntimeConfig.ts`（localStorage 键 `paper-desk.ai-config`，家庭级不分学习者）：`{enabled, port}`，构建期 env 仅作默认值；非法端口（非 2-5 位数字）回退默认；保存即生效，无需重建。
- **适配器改造**：`AiHybridEducationCenterAdapter` 的 `AI_ENABLED/PROXY_BASE` 改为按次调用读取运行时配置；AppProviders 常驻混合适配器（关闭时与 LocalDemo 行为一致），删除 env 分支装配。
- **UI 面板**：数据控制页新增「AI 接入设置」卡片——启用开关（MUI Switch）、代理端口输入（纯数字过滤）、「检测连接」按钮（探活 /health，状态三态：在线·已配密钥·模型 X / 在线·未配置密钥（会降级） / 离线·原因）、隐私与安全说明（密钥在本机代理、AI 不判对错、家长复核提示）。
- **连带修复 2 个真实缺陷**：①代理无 CORS 处理——浏览器跨源请求（4174→4610）连 OPTIONS 预检都 404，此前 AI 模式从浏览器根本调不通；已加 CORS（仅放行本机 4173/4174 来源，预检 204 短路）。②CSP `connect-src 'self'` 拦截跨端口 fetch——index.html 放行 `http://127.0.0.1:4610` 与 `http://localhost:4610`（代理只绑本机回环，不扩信任边界）。
- **测试基建**：`scripts/mock-ai-upstream.mjs`（4620 端口 mock OpenAI 兼容上游，固定返回合法 lesson/grading JSON），全链验证无需真实密钥。
- 回归：lint/TS/build(433.22 kB) 通过；Vitest 60/60（新增配置服务 4 项+适配器开关关闭不 fetch 断言）；E2E 核心 6/6。
- **生产全链实测（mock 上游）**：设置页探活「在线 · 已配密钥 · 模型 glm-4-flash」→ UI 开启开关（localStorage 持久化）→ 选苏教版二上课生成微课堂 → **徽章「AI 生成候选 · 建议家长复核」+ 蓝紫 ai-note 出现，三步内容来自 mock AI** → 返回设置关闭开关持久化为 disabled（截图 evidence-ai-settings-panel/on/off.png）。
- 依赖安全升级继续暂停。

---

## 2026-09-08 AI 来源 UI 标识（用户提问「UI 上怎么知道有没有用 AI」）

- **徽章联动**：微课堂/批改页徽章按 proposalId 前缀自动切换——`ai-` 前缀显示「AI 生成候选 · 建议家长复核」/「AI 参与批改 · 对错为本地判定 · 尚未提交」，否则显示「本地演示候选 · 尚未提交」。
- **补充说明条**：AI 增强时页面顶部加蓝紫色 `.ai-note` 边注（说明 AI 来源、本地代理、对错仍为本地判定、建议家长复核），与本地演示的橙红 `.limitation` 视觉区分。
- **测试基建**：vitest.config.ts 注入 `env: { VITE_AI_MODE: 'ai' }`——单测覆盖 AI 路径，生产 .env 默认 off 不受影响。
- 回归：lint/TS/build(429.20 kB) 通过；Vitest 55/55；生产实测 AI-off 模式徽章正确显示「本地演示候选」、无 ai-note（截图 evidence-ai-badge-off.png）；AI-on 模式下徽章与说明条由 ai- 前缀驱动（单测覆盖）。
- 依赖安全升级继续暂停。

---

## 2026-09-08 真实 AI 接入（混合适配器 + 本地代理持密钥）

- **架构**：装饰器模式 `AiHybridEducationCenterAdapter` 包裹 LocalDemo——bootstrap/收尾/登记/幂等全走基线；仅「讲解生成」与「批改反馈」尝试 AI 增强，代理不可用/未配置密钥/超时**无缝降级** local-demo。对错判定保留确定性答案比对，**AI 只增强反馈文案与错因，不改判对错**。
- **密钥边界**：浏览器零密钥；`scripts/ai-proxy.mjs`（Node 零依赖）绑 127.0.0.1:4610，从 `AI_PROXY_API_KEY` 环境变量持密钥转发 OpenAI 兼容接口（默认智谱 glm-4-flash），30s 超时，日志只记状态码与耗时（不含题目/作答原文）。
- **安全约束**：system prompt 明确小学辅导边界与拒绝清单；输出过 JSON Schema；AI 增强的 proposalId 加 `ai-` 前缀，limitation 注明「AI 生成为候选，建议家长抽查复核」；安全拦截（SAFETY_BLOCKED）不增强、保持 fail-closed。
- **开关**：`VITE_AI_MODE=ai` 启用混合适配器，默认 `off` 与现状完全一致；装配点 AppProviders 单点切换。
- 回归：lint/TS/build(429.20 kB) 通过；Vitest 55/55（新增混合适配器 4 项：降级/增强/批改/委托）；E2E 核心 6/6；生产实测 AI-off 模式二上课生成正常（默认态与此前行为一致）。
- 启用方式：`AI_PROXY_API_KEY=密钥 node scripts/ai-proxy.mjs` + webapp 侧 `VITE_AI_MODE=ai npm run build`（或 dev）。未配密钥时代理 /health 返回 not-configured，适配器自动降级。
- 依赖安全升级继续暂停。

---

## 2026-09-07 宿主闭环轻量版：本地学习记录层

- **定位**：正式宿主（kernel-10/组件24）未接入前，学习收尾时把候选结果沉淀为「本地学习记录」，错题本/知识路径跨会话累积。边界诚实：只叫「本地记录」，不出现「已归档/已入队」回执语义（保留给正式回执）。
- **实现**：`src/services/localRecordStore.ts`（localStorage，按学习者隔离，500 条上限，recordId 幂等）；closeUnit 成功时自动沉淀（错题 8 字段+掌握度+下一步建议）；同章节同题干在历史中出现过则标记 `repeated=true`。
- **页面接入**：错题本=历史记录+当次候选合并去重展示（空态文案区分）；知识路径无当次图谱时显示最近记录摘要；数据控制页新增「本地学习记录」表格（时间/课程/错题数/掌握度）+一键清空（二次确认）。
- **生命周期**：退出会话不清（长期数据）；切换学习者按身份自然隔离；数据控制页可查看/清空。
- 回归：lint/TS/build(429.20 kB) 通过；Vitest 51/51（新增 store 4 项）；E2E 桌面 10/10（恢复+持久化+核心旅程+PDF+安全 a11y）。
- 生产实测闭环：完整走一遍二上课（答题 3 错 1 对→批改→收尾）→ 记录沉淀（lessonTitle/3 错题/L2）→ 错题本页跨会话显示历史错题 → 刷新后仍在 → 数据页表格 1 条记录 + 清空入口（截图 evidence-local-records.png）。
- 依赖安全升级继续暂停。

---

## 2026-09-07 首发教材决策落地：苏教版小学数学·二年级上（原创对齐版）

- **用户决策**：首发教材用苏教版小学数学，优先二年级。合规路线：单元结构对齐苏教版二年级上册公开教学大纲（100以内加减法三、平行四边形初步认识、表内乘法一等），**正文与题目全部原创编写**，attribution 明确标注「对齐苏教版教学单元 · 内容为原创示例」，不使用出版社任何图文——无需外部授权，零版权风险。孩子实际课本走本地 PDF 通道。
- **fixtures**：新增 sj-math-2a-original（5 课：进位退位/连加连减验算/平行四边形/乘法初步/2~6口诀）+ 两套原创 quiz（加减法 4 题、乘法口诀 4 题，含 choice/fill/steps 三题型）。原分数演示教材保留。
- **引擎按课程族分发**：familyOf(lessonId,quizId) 三族分发（sj-addsub/sj-multiply/fraction）——微课堂目标与三步法、批改思路提示、错题章节/正确入口/识别线索、图谱事实节点全部按课程适配；NextLesson 字段名修正为契约的 action/doNotDo。
- **连带缺陷修复**：RestatementCheck 复述提示硬编码「分数加减」，按 lessonId 分发为进位退位/乘法意义提示。
- **E2E 修复**：移动端导航 span 被 CSS 隐藏导致可访问名消失，改按 href 定位（两视口通用）。
- 回归：lint/TS/build(427.81 kB) 通过；Vitest 47/47；E2E 持久化 4/4（desktop+mobile）、恢复 5/5、核心旅程 3 通过 1 条件跳过、local-pdf+安全 a11y 3/3。
- 生产预览端到端实测：选苏教版二上 → 打开第一课 → 生成微课堂（步骤为「先看个位/再算十位/验算确认」）→ 复述提示为进位退位问题 → 进 Quiz 首题为「47+28 进位」（截图 evidence-sj2a-quiz.png）。
- 依赖安全升级继续暂停。

---

## 2026-09-07 批注持久化体验补全 + OCR 双通道优化

- **内容摘要键**：LocalDocument 新增 contentDigest（SHA-256 前256KB+大小 前16hex，适配器 open 时计算）；批注键从「学习者:文件名」升级为「学习者:摘要」，同名不同内容不再串批注；legacy 键自动迁移（单测覆盖）；非安全上下文回退 FNV(文件名@大小)。
- **无文本层页面坐标划线**：RegionHighlight 归一化坐标（page/x/y/w/h），扫描页画布拖拽框选（误触阈值过滤），恢复时按渲染尺寸叠加；文字划线页面行为不变。
- **批注管理入口**：本地数据页新增批注存储表格（文件/批注数/时间/单删，二次确认），按学习者隔离，移动端响应式。
- **OCR 双通道**：原图+预处理增强图各识别一次取置信度高者；预处理=小图放大至短边1000px+灰度1%-99%对比度拉伸（Otsu 可选默认关）。基线复测：印刷 84.6%/手写 59%/公式 74-84%，与优化前持平、无退化——合成手写代理偏印刷形态，预处理收益有限；机制已就位待真实手写样本复测。
- 测试基建：setup.ts 新增 jsdom 轻量 canvas 2D mock（jsdom getContext 返回 null 需直接覆盖）。
- 回归：ESLint/TS/build(418.30 kB) 通过；Vitest 47/47；E2E 持久化 2/2+恢复 4/4+OCR 基线 2/2；生产预览实测摘要键写入/管理表格/删除确认框（截图 evidence-annotation-manager.png）。
- 依赖安全升级继续暂停。

---

## 2026-09-07 PDF 批注元数据持久化（页码/书签/划线/朗读进度）

- 用户追问"pdf文件读的进度，标记，划线这些不恢复吗"→ 实现元数据持久化：新增 `src/services/pdfProgressStore.ts`（localStorage，键=`学习者ID:文件名`），存页码/书签/划线短引用/朗读进度；**PDF 字节与页面全文仍不持久化**（隐私边界不变）。
- PdfReader 挂载时按（learnerId+fileName）恢复快照；变更即同步保存（**无防抖**——修复了防抖定时器被刷新/卸载清掉导致最后一次变更丢失的竞态）。
- 测试暴露并修复两个连带缺陷：
  1. **会话恢复与学习者切换冲突**：切到学习者 B 后 A 的 hint 仍触发自动恢复（还把 hash 改回 A）。修复：hint.learnerId 与当前身份不一致时不自动恢复；ConsentPage 手动恢复提示条同样只对当前身份显示；按钮文案由硬编码「为学习者 A」改为跟随当前身份。
  2. **单测状态泄漏**：阅读器持久化后 jsdom localStorage 跨用例串扰。修复：beforeEach 清空 localStorage、mock 补 learnerId。
- E2E 改走真实用户路径（库页学习者切换器切换身份），不再伪造 hash+reload。
- 回归：ESLint/TS/build 通过（414.72 kB）、Vitest 40/40、持久化 E2E 2/2、恢复 E2E desktop+mobile 8/8。
- 生产预览端到端实测：标记书签+记为已读 → 刷新 → 重选同一 PDF → 书签「第 1 页」+「本页已读完」自动恢复（截图 evidence-annotation-restore.png）。
- 清除时机：退出会话或切换学习者调用 clearAllPdfProgress；隐私模式/配额不足静默降级。

---

## 2026-09-07 纯 PDF 会话刷新不恢复修复（用户截图实测反馈）

- 用户截图显示：只打开本地 PDF（未选演示教材）刷新后回不到课堂，标题为兜底「本地 PDF 学习」、phase 停在 CATALOG_READY。
- 根因：hint 保存条件为 `state.textbook&&state.lessonId`——**纯 PDF 会话从不保存恢复指针**，刷新后无从恢复；且 restoreSession 遇到空 textbookId 直接 return。
- 修复：①进入课堂（已同意）即保存 hint，纯 PDF 会话 textbookId/lessonId 留空；②restoreSession 对空 textbookId 只恢复 consent（回课堂、出通知、提示 PDF 需重选），有教材则照旧恢复教材+课程。
- 生产预览实测：纯 PDF 会话刷新 → 回课堂 + 「已自动恢复」通知 + PDF 不复活可重选；教材+PDF 混合会话 → 教材课程恢复 + PDF 提示。截图存证 evidence-final-reload.png。
- 回归：ESLint/TS/build 通过（414.03 kB）、Vitest 36/36、恢复 E2E desktop+mobile 8/8。
- 依赖安全升级继续暂停。

---

## 2026-09-07 刷新恢复改为自动恢复（用户实测反馈：刷新后没有恢复）

- 用户反馈"刷新后，没有恢复"。排查：生产构建链路本身工作正常（hint 写入→刷新→提示→点击恢复全通），问题是**交互预期差**——原实现刷新后落回同意页、需手动点「继续上次会话」，用户期望刷新后直接回到课堂。
- 修复：改为**自动恢复**。Provider 挂载且教材 bootstrap 完成后，若本标签页存在会话指针即自动恢复同意+教材+课程（guarded by restoredRef 防重复触发）；顶部全局显示「已自动恢复上次会话」通知（含 PDF 文件名提示或 PDF/作答不跨刷新说明），提供「退出会话」一键清指针回同意页。
- ConsentPage 的手动「检测到上次会话」提示条保留为兜底（自动恢复未触发时仍可用）。
- 隐私边界不变：sessionStorage 仍只存非敏感指针；PDF 字节/OCR 草稿/作答/候选证据不持久化；隐私模式自动降级；退出清 sessionStorage。
- E2E 重写为 4 条：自动恢复+通知+连续刷新持续、PDF 不复活可重选、退出会话清指针不再恢复、chunk 失败降级。
- 回归：ESLint、TypeScript、build 通过（主入口 414.00 kB）；Vitest 36/36；七项目 E2E 合计 87 passed、4 条件跳过、0 failed；生产预览（4174）实测自动恢复闭环通过（path=/classroom、通知可见、课堂在）。
- 依赖安全升级继续暂停。

---

## 2026-09-07 本地中断恢复与加载失败降级（backlog P1 项，本地范围清零）

- 新增刷新恢复指示：sessionStorage 仅保存非敏感指针（学习者/教材/课程/PDF 文件名），刷新后在同意页显示「检测到上次会话」，可一键恢复教材与课程；曾打开 PDF 时明确提示「需重新选择文件」——PDF 字节、OCR 未确认草稿、作答与候选证据**不持久化、不恢复**；恢复后可立即重选同一 PDF 继续。
- 新增懒加载失败降级：路由 lazy 组件首次加载失败自动重试一次；仍失败由 RouteErrorBoundary 显示「页面加载失败：可能是网络中断或应用已更新 + 重新加载页面」操作 UI，不再白屏。
- 隐私边界不变：hint 写入前 try/catch 降级（隐私模式/配额不足时无提示、不影响主流程）；退出（exit）时 sessionStorage.clear() 已有逻辑保留；切换学习者走整页刷新重建，hint 随 CLEAR_SENSITIVE 语义失效。
- E2E（tests/e2e/interruption-recovery.spec.ts，3 条）：无 PDF 会话刷新恢复（指示出现→继续→课堂就绪→再刷新指示仍在且无文件提示）；开 PDF 后刷新（提示文件名+需重选→恢复后阅读器不复活→可立即重选）；模拟模块加载失败（route abort 拦截 dev 形态 `/src/features/wrong-questions/WrongQuestionPage.tsx`，build 形态 `/assets/WrongQuestionPage-*.js` 同规则覆盖）→ 降级 UI 出现。
- 测试适配修正：恢复用例的「课堂就绪」锚点从「本节目录」（移动端在隐藏侧栏）改为 `.classroom-header`（sticky 双端可见）；chunk 用例直接 goto 路由而非点导航（移动端导航收在汉堡内）。
- 回归：ESLint、TypeScript、build 通过（主入口 413.15 kB）；Vitest 12 文件 36/36；七项目 E2E 合计 80 passed、4 条件跳过、0 failed，退出码均为 0。
- 至此 backlog「A. 可立即继续的本地任务」四项全部完成；剩余均为需外部条件（授权/真机/云端/AI/宿主）或已暂停（依赖安全）项。依赖安全升级继续暂停。

---

## 2026-09-07 OCR 手写体/公式基线评测与置信度分级（backlog P1 项）

- 新增置信度分级纯函数 `gradeOcrConfidence`：≥80 且有效文本≥4 字 → trusted（绿色，仍要求快速核对）；≥60 → suspect（黄色，列手写体/上下标/运算符等易错点）；<60 或有效文字不足 → distrusted（红色，建议逐字核对或手动输入）。阈值经实测基线校准；不改变「识别文本一律 untrusted、须人工确认」边界。
- 单测抓到并修复真实缺陷：高置信度但有效文字 <4 字（如 '12'）原实现落入 suspect，现直接判 distrusted 并提示「几乎未识别到文字」。
- 基线样本：tests/fixtures/ocr-baseline/（6 样本 + manifest.json ground truth）。合成方式：宋体印刷体 2 张；Bradley Hand 逐字符随机旋转/偏移/尺寸抖动/墨色不均+轻模糊的手写代理 2 张（英文——真实中文手写只会更难，代理为下界）；Times+数学符号（π、²、±、×、÷、分数）公式代理 2 张。
- 实测基线（desktop-chromium 真实 Tesseract，字符准确率为去空白归一化 Levenshtein）：
  - 印刷体：置信度 92/93，准确率 84.9%/84.2%（误例：「苹果」→「莘果」）
  - 扰动手写代理：置信度 56/62，准确率 58.6%/59.5%
  - 公式代理：置信度 77/77，准确率 83.8%/74.2%
- 重要发现：Tesseract 自报置信度无法可靠区分「整洁规整字体」与印刷体（规整 Bradley Hand 曾测得 87% 置信、98.8% 准确）——置信度反映的是版面规整度而非「手写与否」；因此分级策略以置信度+有效文本长度分档，所有档位均保留「需人工核对」话术，trusted 档也不宣称免检。
- E2E 基线用例：tests/e2e/ocr-baseline.spec.ts——印刷体必须 trusted 且 ≥80；降级组测量记录 + 组级断言（平均准确率比印刷体基线低 ≥15pp，防引擎升级后能力漂移不可见）。
- 回归：ESLint、TypeScript、build 通过（主入口 400.77 kB）；Vitest 12 文件 36/36；七项目 E2E 合计 59 passed、4 条件跳过、0 failed，退出码均为 0。
- 依赖安全升级继续暂停。

---

## 2026-09-07 PDF 划线跳转按钮「黄框盖字」修复（用户实测反馈）

- 现象：划线列表点「跳转」后，按钮变为黄色方框且文字消失。
- 根因（已实证闭环）：MUI v6 TouchRipple 为懒挂载——首次真实鼠标点击后把 `<span class="MuiTouchRipple-root">`（绝对定位覆盖层）插入按钮且不再移除。旧 CSS `.pdf-highlights li span{background:var(--annotation)…}` 是无约束后代选择器，命中该覆盖层并刷上不透明标注黄，永久盖住按钮文字。JS `.click()` 与单测均不触发该路径（无 mousedown），故此前测试未捕获。
- 修复：`.pdf-highlights li span`、`.pdf-highlight-current span`、`.pdf-search-results li span` 三处收紧为 `>` 直接子元素选择器，只命中划线文本，不碰 MUI 内部结构。
- 实证：浏览器内注入旧规则复现黄框（ripple 背景 `rgb(232,195,90)`），移除后透明（`rgba(0,0,0,0)`）；修复后真实鼠标点击「跳转」，ripple 正常挂载且透明、文字完好。
- 防复发：新增单测守卫，断言 classroom.css 不得出现会污染 MUI 按钮内部 span 的裸后代选择器。
- 全项目扫描确认其余 `span/button/li` 后代选择器均为自有原生标记（如 `.masthead nav span` 为自有导航标签的移动端隐藏设计），无同类隐患。
- 回归：ESLint、TypeScript、build 通过；Vitest 11 文件 31/31（含新守卫）；七项目 E2E 合计 45 passed、5 条件跳过、0 failed，退出码均为 0。
- 依赖安全升级继续暂停。

---

## 2026-09-07 PDF 可用性质询修复（用户实测反馈）

- 用户实测指出四项可用性缺陷，全部确认并修复：
  1. 「手工选择页文本」默认只填页首 240 字且无法取到后文 → 改为默认载入整页文本层，附「本页文本层共 N 字」诊断行；0 字时明确提示"扫描图片无文本层，请换含文字 PDF 或用图片 OCR"。
  2. 「划线这段」后 PDF 画布无标记 → 画布下方新增"本页文本层"面板，划线片段在真实页文本上以 `<mark>` 黄色标注（合并重叠区间）；ContextSelection 区同步列出本页已划线片段。
  3. 「引用这段页文本」点击无反馈 → 引用成功后显示回执"已附加为本课教材上下文（N 字）。右侧『生成分步微课堂候选』会引用这段内容讲解"。
  4. 「朗读本页」不可用感知 → 增加朗读自检：请求发出 1.2 秒未确认开始时显示常见原因（系统静音/无中文语音包/浏览器策略）与"记为已读"降级建议；无文本层页面直接解释原因而非留一个不可用按钮。
- 设计说明：PDF 以图片渲染进 canvas，浏览器无法在图片上做文本级选择/划线——文本层面板是等效替代而非装饰。
- 静态门禁：ESLint、TypeScript、Vite build 通过；Vitest 11 文件 30/30。
- 核心三浏览器（desktop/mobile Chromium + WebKit）：19 passed、2 条件跳过、0 failed。
- 依赖安全升级继续暂停。

---

## 2026-09-07 PDF 划线与朗读进度验收（安全项保持暂停）

- 新增会话内划线：ContextSelection 区新增「划线这段」按钮，可将所选页文本加入划线列表；划线列表支持跳转对应页与移除，当前页划线高亮（标注黄底 + 松针绿描边）。
- 新增会话内朗读进度：显示每页朗读状态（未朗读 / 已读 n 字 / 已读完）；支持「朗读本页 / 从进度继续朗读」与「记为已读」手动标记；浏览器不支持 TTS 时降级为仅手动标记，文字保留在页面。
- 边界保持：划线与进度仅存于 PdfReader 组件内 state，不写 localStorage/sessionStorage/IndexedDB、不持久化、不新增网络请求；关闭 PDF、切换文档或学习者即清除。TTS 仍不产生学习证据。
- 修复过程发现的真实冲突：新按钮「标记本页已读」与既有书签按钮「标记本页」在 Playwright 严格模式下形成可访问名称歧义，已更名为「记为已读」消除。
- 静态门禁：ESLint、TypeScript、Vite production build 均通过；主入口 400.77 kB。
- 单元/集成：11 个测试文件、30/30 通过（新增划线与朗读进度用例各 1 条）。
- 完整七项目拆分验收：六内置/模拟项目 39 passed、3 条条件跳过；已安装 Chrome 6 passed、1 条跳过；合计 45 passed、4 条条件跳过、0 failed，退出码均为 0。
- 依赖安全升级按用户要求继续暂停；本节不改变安全告警状态。

---

## 2026-09-07 PDF 缩略图导航验收（安全项保持暂停）

- 新增 PDF 缩略图导航：工具条“缩略图导航/收起缩略图”开关（aria-pressed），横向缩略图带按需渲染当前页附近窗口（默认 12 页），当前页高亮并 aria-current="page"，点击缩略图跳转对应页；翻页自动更新窗口，大文档不会一次性渲染全部页面。
- 关闭 PDF、切换文档或切换学习者时缩略图状态随阅读器一并重置；不新增网络请求、不持久化。
- 实现方式：复用 `documents.renderPage` 渲染小图，缩略图 CSS 宽约 96px；未引入新依赖、未改依赖版本、未改端口契约。
- 静态门禁：ESLint、TypeScript、Vite production build 均通过；主入口 400.77 kB。
- 单元/集成：11 个测试文件、28/28 通过，其中新增缩略图用例 1 条（打开、aria-pressed、跳页、收起）。
- PDF 定向三浏览器：6/6 通过。完整七项目拆分验收：六个内置/模拟项目 39 passed、3 条条件跳过；已安装 Chrome 6 passed、1 条跳过；合计 45 passed、4 条条件跳过、0 failed，退出码均为 0。
- 过程记录：一次三浏览器并行冷启动出现竞态失败（旧用例在监护人确认页即断言课堂元素），单项目与全量重跑均通过，非缩略图回归。
- 依赖安全升级按用户要求继续暂停；本节不改变安全告警状态。

---

## 2026-09-07 本地 PDF 阅读增强验收（安全项保持暂停）

- 新增 PDF 上一页/下一页、手工页码跳转、全文关键词搜索、搜索结果页跳转和当前会话书签。
- 搜索与书签只存在于 `PdfReader` 组件内；关闭文档、卸载阅读器或切换学习者后清除，不写 localStorage/sessionStorage/IndexedDB，不新增网络请求。
- 修复移动端 PDF 文件输入与关闭控件位于隐藏目录栏的问题：保留单一文件输入实例并移动到始终可见的主阅读画布。
- 静态门禁：ESLint、TypeScript、Vite production build 均通过；构建主入口 `400.77 kB`。
- 单元/集成：11 个测试文件、27/27 通过，其中新增 PDF 阅读增强测试 3 条。
- PDF 定向浏览器回归：desktop Chromium、mobile Chromium、WebKit 共 6/6 通过。
- 完整七项目拆分验收获得干净退出码：六个内置/模拟项目 39 passed、3 条条件跳过；已安装 Chrome 前台独立项目 6 passed、1 条条件跳过；合计 45 passed、4 条条件跳过、0 failed。
- 依赖安全升级按用户要求暂停；本节不改变前述安全告警状态，也不将其宣称为已修复。

---

## 2026-09-07 安全与兼容性追加验收（最新状态）

- 功能回归：七组浏览器/视口/设备模拟共 38 passed、0 failed、4 条移动视口条件跳过；退出码 0。
- 新增 Pixel 5 / iPhone 13 模拟（移动 UA、DPR、isMobile、hasTouch），并在移动用例中用 tap 和实际 touchstart 事件验证交互。
- 已安装 Chrome 151.0.7922.138 验证通过；内置 Chromium 151.0.7922.34、WebKit 26.5。设备模拟不等于真机、WebKit 不等于原生 Safari；Edge 未安装，Firefox、物理设备、原生 Safari GUI 尚未验收。
- 在线全依赖审计获得 5 项告警：3 moderate、1 high、1 critical，均在 Vitest 2.1.9 的开发/测试依赖链（旧 Vite/esbuild 等）。Vitest 严重公告 GHSA-5xrq-8626-4rwp 受影响范围 <3.2.6；未启用 Vitest UI 不等于漏洞已经修复。
- 尝试定向升级到 Vitest 3.2.6，因包下载连续 TLS 中断停止；已离线恢复原锁文件依赖，package.json/package-lock.json 与检查点逐字节一致，实际 Vitest 仍为 2.1.9。没有保留半安装状态，没有使用强制漏洞修复。
- 恢复后 lint、typecheck、24/24 单元/集成测试、生产构建均通过，主包仍 400.75 kB。
- 本轮结论：**兼容性追加项通过；安全升级 BLOCKED，整体安全收尾尚未完成。** 下文 IS_PASS=true 是前一轮本地 MVP 功能验收结论，不代表依赖零漏洞或生产上线批准。
- 安全建议：不要启用/暴露受影响的 Vitest UI 服务；维持仅本机开发监听。下一步在可靠网络中完整准备并校验修复版本依赖，再一次性离线升级、审计与回归。
- 本轮证据目录：`output/20260907-security-compatibility/`。

---

## 以下为上一轮本地增强版验收记录

## Summary

- Verification date: 2026-09-07
- Vitest: **24 / 24 passed**（10 test files）
- Playwright: **21 passed / 0 failed / 3 conditionally skipped**（24 project-test combinations）
- Static gates: ESLint、TypeScript、Vite production build 均通过
- Independent production-preview browser checks: desktop/mobile full journey + PDF/safety boundaries passed
- Routing Decision: **Pass**
- Final result: **IS_PASS = true**

本轮修复了原报告中的 WebKit 首 Tab 焦点、主包体积警告，并完成浏览器本地图片 OCR。正式 CloudBase、真实 AI 模型、OpenMAIC runtime、正式宿主提交和物理学习状态写入仍不在本地 MVP 范围内，界面继续如实标为 proposal-only。

## Environment and Commands

全部 Node 命令使用托管 Node 22：

- Node: `/Users/xiacg/.workbuddy/binaries/node/versions/22.22.2-2/bin/node` (`v22.22.2`)
- npm 命令使用同目录工具链并显式 `env -u NODE_OPTIONS`

主要门禁：

```text
npm run lint
npm run typecheck
npm test -- --run
npm run build
npm run test:e2e
QA_BASE_URL=http://127.0.0.1:4174 node qa-independent.mjs
```

## Test Matrix

| Area | Evidence | Result |
|---|---|---|
| ESLint | exit 0 | PASS |
| TypeScript | `tsc -b --pretty false`, exit 0 | PASS |
| Vitest | 10 files, 24 tests passed | PASS |
| Production build | Vite 1218 modules, exit 0 | PASS |
| Build splitting | 主入口 `400.75 kB`；课堂 `42.88 kB`；图谱 `181.64 kB`；PDF.js `334.13 kB`；无 `>500 kB` 警告 | PASS |
| Desktop 1280 full journey | 同意 → 教材 → 微课堂 → 复述 → 4 题 → 批改 → 错题候选 → 图谱 → 唯一下一课 | PASS |
| Mobile 360 | 单一任务轨道实例可达，`scrollWidth <= clientWidth` | PASS |
| Tablet 768 | 主课、安全、PDF 与 OCR 关键路径 | PASS |
| WebKit | skip link 首 Tab、主课、PDF、OCR、取消后重试 | PASS |
| Local image OCR | JPG/PNG 边界、同源 Worker/WASM/语言包、可编辑确认、无外部请求 | PASS |
| OCR lifecycle | 取消后同图可重新选择；旧 Promise 不覆盖新状态；worker 终止串行化 | PASS |
| PDF boundary | MIME + 扩展名 + magic bytes + 50 MB / 300 页 fail-closed | PASS |
| Candidate truthfulness | 不出现“已保存/已归档/已掌握/已入队”误导文案 | PASS |
| Safety | XSS/提示注入、危险内容、自伤信号阻断 | PASS |
| Source hygiene | 无 `any`、`@ts-ignore`、`dangerouslySetInnerHTML`、空 catch | PASS |

## Fixed Issues

1. **WebKit 首个 Tab 未聚焦 skip link**
   - `SkipLink` 在 WebKit 获得显式首焦点行为；原失败断言现通过。
2. **主 JavaScript 包过大**
   - 路由页面按需加载；PDF.js 和 OCR 延迟加载；主入口从约 `1,025 kB` 降为 `400.75 kB`。
3. **图片 OCR 初始化挂起**
   - Tesseract 改为直接同源 Worker（`workerBlobURL:false`）；Worker、WASM、中英文语言包均由 `/ocr/` 同源提供。
4. **桌面/手机重复任务面板**
   - 删除 CSS 隐藏的重复 `LearningPrompt`，保留单一任务状态与单一 OCR 生命周期；移动端只改变布局位置。
5. **OCR 取消/重试竞态**
   - 增加 AbortSignal、任务世代校验和幂等 Worker 终止；取消后立即对同一文件重试通过。
6. **React Router 安全公告**
   - `react-router-dom` / `react-router` 升至 `7.18.3`，超出先前公告受影响范围（`<7.18.0`）。升级后全量类型、构建和浏览器回归通过。

## Security Review Note

升级前在线 `npm audit --omit=dev` 报告 React Router 6 两项 moderate 公告；已升级到 7.18.3。升级后两次在线 audit 复核因 npm Registry TLS 连接中断未能返回新报告，因此“依赖版本与公告范围”已验证，但最新在线 audit 总数暂未获得。未使用 `npm audit fix --force`。

## Remaining Scope / Known Limits

- 当前仍是本地受控 MVP，不包含 CloudBase 账号、数据库、跨设备同步或正式教育中心宿主提交。
- OpenMAIC runtime 仍为 HOLD；当前动画是前端微课堂演示。
- OCR 面向清晰印刷体，不承诺手写体和复杂数学公式准确；用户必须校对。
- 自动化覆盖 Chromium 与 Playwright WebKit；未在原生 Safari GUI 和 Microsoft Edge 最近两个正式版本上做人工矩阵。
- PDF worker 约 `1.38 MB`，但它是按需加载的独立 Worker，不再阻塞首屏主包。

## Final Decision

核心学习旅程、WebKit 键盘焦点、本地 OCR、取消重试、安全边界、响应式布局以及静态/单元/构建门禁均已通过。

**IS_PASS = true**


## Appendix — 批改链修复回归（2026-09-08）

用户实机反馈三问题：①提交 Quiz 无即时反馈，重复点击报「非法状态转移 grading → grading」；②批改页裸露 `undetermined`/`R3` 内部码；③图形课答错的思路反馈仍为加减法话术（per-lesson 改造漏网：buildGrading/close 按族分发）。

修复与验证：
- reducer `SET_PHASE` 同相位幂等（重复 dispatch 不再报错）；Provider `grade()` 防重入；QuizPanel 提交中禁用按钮 + 「正在生成批改候选…」+ `role=status` 进度提示。
- 新增 `src/contracts/labels.ts`：R1–R11 / L1–L4 / P1–P9 / 证据状态全量中文映射；批改页答对题不再显示错因行；错题卡、下一课主路径同步中文化（内部码保留括号注记供协议对照）。
- `GradeQuizCommand`/`CloseUnitCommand` 增加可选 `lessonId`（会话状态直传），`buildGrading` 提示与 `close()` 章节/入口/避坑/事实节点全部从 `sjLessonPacks` 取值，`sjLessonIdByQuiz` 反查仅兜底；答错默认错因按题型分（choice→R1，fill/steps→R3）。
- AI 批改提示补 R 码语义定义；AI 返回错因码经白名单校验，非法码丢弃保留本地判定。
- 回归：vitest 65/65（新增 gradingConsistency 5 例）、tsc 零错误、build 443.92 kB；浏览器全链实测几何课（4 题全错）：批改中文标签+几何话术，错题章节筛「平行四边形」3 条、「100以内」0 条。

## Appendix — 步骤题误判修复：踩点给分（2026-09-08）

用户实机反馈：步骤题答「拉对角，长度没变，角度变了」与标准答案语义一致却被判错。根因：判定逻辑为「作答归一化后包含标准答案全文」，对表述性步骤题等于要求孩子逐字背诵。

修复与验证：
- `QuizQuestion` 契约新增 `keyPoints`（每组同义表达）与 `keyPointLabels`；引擎改为：配了踩点用踩点判定（全覆盖才判对，漏点反馈具体缺哪一步），未配踩点回退原文包含比对（选择/数字填空不受影响）。
- 几何课 g3 配置三踩点：拉动动作（拉/推/压…）、边长不变（边/长度/边长）、角度改变（角）。
- 连带修复 QuizQuestion 提示语硬编码分数题话术 → 按题型与踩点动态生成。
- 回归：新增 keyPointGrading.test.ts 4 例（含截图原话），9/9 批改相关测试通过，tsc 零错误，build 444.37 kB；浏览器实测原话作答判「当前作答一致」。

## Appendix — 刷新进度恢复：会话快照（2026-09-08）

用户实机反馈：刷新后从学习第一步重新开始。根因：刷新恢复只还原「学习者+教材+课程」，学习环节状态（微课堂步骤/复述/Quiz 作答/批改收单候选）不持久化。

修复与验证：
- 新增 `src/services/sessionSnapshotStore.ts`：sessionStorage 会话快照（随退出会话/切换学习者清除，隐私边界不扩大）；Provider 防抖写入全量进度；`restoreSession` 匹配学习者+课程后经 `RESTORE_PROGRESS` 一次性还原；`resolveRestorablePhase` 按相位最小数据集校验，数据不完整整体降级为从头开始，不做半套恢复。
- QuizPanel 作答草稿上报快照并在挂载时播种，刷新后已答内容与提示次数保留。
- 回归：新增 sessionSnapshot.test.ts 7 例，全量 76/76 通过，tsc 零错误，build 446.72 kB；浏览器实测「Quiz 第2题→刷新→回到随堂练习+作答回填」闭环通过。

## Appendix — 微课堂输入透明化（2026-09-08）

用户实机反馈：微课堂输入框改内容后生成结果一样，质疑输入无效并提议集成 OpenMAIC。

结论与修复：
- 复现确认：本地演示模式讲解来自每课预设学习包，输入不参与生成（无 AI 时的确定性设计）；AI 开启时输入已参与生成。OpenMAIC 为组件 37 HOLD，按约束不得进入主链；架构已预留 adapter 端口，为出 HOLD 后的正确接入路径。
- 修复「静默忽略」：MicroLessonProposal 新增 learnerQuestion（本地/AI 两链路透传）；微课堂页回显「你的问题：…」，本地模式明示「讲解来自预设学习包，未按输入定制；启用 AI 后将按你的问题生成」。
- 回归：aiHybridAdapter 断言随语义更新（降级时 limitation 为本地演示说明而非 undefined），相关 22 用例通过，tsc 零错误，build 447.06 kB；浏览器实测问题回显与诚实说明正确呈现。

## Appendix — 「换种讲法」追问链三层修复（2026-09-08）

用户实机反馈：微课堂生成后点「换种讲法」再生成，内容与上一轮相同。排查出三层叠加根因：

1. `learningIntentSchema` 为 `.strict()` 但未声明新增的 `previousLesson` 字段——追问场景（携带上轮讲解上下文）命令被 zod 拒绝，`VALIDATION_FAILED` 静默回退，请求零发出。修复：schema 补 `previousLesson` 可选对象声明（objective + stepTitles），新增 4 例单测（接受/缺省/拒绝未知键/拒绝非法形状）。
2. 状态机 `lesson_active` 不允许转移 `generating`，且 LearningPrompt 生成按钮在非 `material_ready` 一律禁用——微课堂展示期间输入表单可见但按钮永远禁用，用户点击无任何反应。修复：状态机放行 `lesson_active → generating`；按钮在 `lesson_active` 可用并改文案「按新要求重新生成讲解」，helper 文案说明追问语义。
3. 浏览器端 `callProxy` 超时 15s：追问 prompt 更长、上游生成 20-40s，被腰斩后静默降级本地预设包（内容自然"一样"）。修复：浏览器侧 60s、代理上游 90s，两侧留足余量。

回归与终验：tsc 零错误、build 447.75 kB、contracts/aiHybrid/localDemo/coreJourney 16 用例通过；真实 UI 路径终验——「换种讲法」→重新生成 23s 返回全新讲解（步骤由「口诀是什么/找规律/用口诀解题」变为「念咒语/变算式/开饼干柜」），AI 徽章、问题回显、相位流转全部正常。
## Appendix — 宿主闭环接入：本地 BFF 落地组件 24（2026-09-08）

按 PRD P2 规划落地依赖链第一环（宿主闭环 → 组件 24 → 出 HOLD 前置 → OpenMAIC）。实现与验证：

- **宿主 BFF**（`scripts/host-bff.mjs`，Node 零依赖，端口 4630）：`POST /v1/registrations:commit` 校验 Schema 必备字段/persistenceIntent/mutations 合法性后写入本机登记册（`~/.host-bff/registry.json`，权限 0600，原子写）并返回正式回执 `host-cmt-*`；同幂等键重放返回原回执（`replayed:true`）；`GET /v1/registrations?learnerId=` 供家庭查看。四项 curl 实测通过。
- **RealHostCommitAdapter**：实现 `HostCommitPort`，availability 常 available、commit 转发 BFF；坏回执（空 commitId）判 `HOST_COMMIT_REJECTED`、离线/超时判 `HOST_COMMIT_UNREACHABLE`——绝不本地伪造 committed receipt。`AdapterErrorCode` 补充两码。
- **动态装配**：`host-config`（localStorage，enabled/port，数据控制页可改）经 `useSyncExternalStore` 通知 `AppProviders` 重装配 host 端口；未启用时维持 `UnavailableHostCommitAdapter`（候选不提交，原边界不变）。
- **状态机/Reducer**：新 action `REGISTRATION_COMMITTED`（校验存在待登记 proposal 防伪回执）/`REGISTRATION_FAILED`；state 增加 `registrationReceipt`/`registrationError`，随会话快照持久化（刷新后回执保持，提交按钮消失）。
- **UI**：收单页新增「提交到宿主登记（组件 24）」按钮与回执/错误呈现（附"本地 BFF 演示"诚实标注）；数据控制页新增宿主连接面板（开关/端口/探活）；能力清单组件 24 `hold → available`（本地 BFF 落地）。
- **防重入**：`commitRegistration` in-flight 守卫 + 已有回执短路；CSP 放行 127.0.0.1:4630。
- **回归**：vitest 86/86（新增 hostCommit 3 例 + reducer 提交 2 例）、tsc 零错误、build 450.82 kB；浏览器全链实测——学习链走完→未启用时提交显示诚实错误→启用+探活→提交→BFF 登记册核对该 proposal→回执呈现→刷新回执保持。
## Appendix — OpenMAIC 互动课堂接入：组件 37 本地落地（2026-09-08）

按 PRD P2 门禁完成出 HOLD 五项前置验证并接入 OpenMAIC（本地 runtime 实现）：

- **运行时**（`scripts/openmaic-bff.mjs`，端口 4640）：`lessons:open` 开课件会话（结构化课件：看一看/试一试/说一说三步互动）；`interactive/callback` 三重校验——seq 单调（乱序 409 SEQ_OUT_OF_ORDER）、idempotencyKey 去重（重复重放原 ack）、baseContextVersion 等值（旧版本 409 VERSION_STALE）；`lessons:rollback` 作废会话全部互动（voidedCallbacks 计数）。curl 六项实测全通过。
- **OpenMAICAdapter**：实现既有 `EducationCenterAdapter` 端口——`routeLearningIntent` 开课件会话并把课件步骤转为微课堂 proposal（proposalId `omc-lesson-*`、limitation 标注组件 37 来源、互动仅作证据候选）；`sendInteraction`/`rollbackInteractive` 客户端 callback；**kernel closure**：gradeQuiz/close/prepare 一律委托 AI 混合适配器，适配器不产生任何判定或调度决策；409 时本地会话安全重置不留半状态。
- **装配与 UI**：`openmaic-config`（开关/端口）动态装配 education 端口；数据控制页新增互动课堂面板（探活显示课件会话数）；CSP 放行 4640；能力清单组件 37 `hold → available`。
- **回归**：vitest 89/89（新增 openmaicGate 3 例）、tsc 零错误、build 455.01 kB；浏览器实测——启用后生成课件式微课堂（BFF 会话+2 次请求、页面呈现 OpenMAIC 来源标注与「看一看」课件步骤）。
- 遗留说明：课件步骤内互动按钮未在 UI 单独呈现（当前以步骤 action 文本承载互动提示）；callback 由后续互动 UI 直连，本轮先完成协议链路与生成路径。
## Appendix — OpenMAIC 互动 UI 补全（2026-09-09）

用户实机反馈两连：①开关配置丢失（自动化浏览器 localStorage 非持久）导致看不到 OpenMAIC；②打开开关后课堂与之前无区别——上轮仅换数据层未做互动控件。

补全：
- `MicroLessonProposal` 新增 `interactive` 字段（课件会话注记 + 每步互动 kind/prompt）；OpenMAICAdapter 生成时写入。
- 新组件 `InteractiveStepCard`：observe-confirm（确认按钮）/ attempt-confirm（完成了/有困难双选）/ summarize-input（总结输入框）三种真实控件；点击经 `sendInteraction` 回传 BFF callback，ack 后显示「互动已记录」并解锁「下一步」（未完成时禁用，文案「完成互动后继续」）；回传失败显示原因且不阻断学习链。
- Provider 暴露 `sendInteraction`（非互动模式返回明确降级提示）。

回归：tsc 零错误、相关 14 用例通过、build 455.39 kB；浏览器实测——生成后互动控件呈现（互动课堂 1/3 · OPENMAIC 课件），点击确认后 BFF callback 计数 21→23、「互动已记录」出现、下一步解锁。
## Appendix — OpenMAIC 课件演示动画（2026-09-09 第二轮）

用户继续实机批评：「没有任何演示和互动」——「看一看」只有文字无可看内容。补全真实演示：

- BFF 课件下发演示规格（demo）：`column-addition`（竖式进位逐位动画）与 `make-ten`（凑十法动画），数字优先从学习者问题文本提取（正则匹配两位数加法如 47+28），无算式时用默认示例；凑十法自动校验补数可行性并回退默认。
- 前端 `CoursewareDemo` 组件：SVG 逐帧动画（竖式：个位相加→满十进一→十位相加→答案高亮；凑十：拆数箭头→凑整十→最终结果），自动播放 + 重播按钮，配色遵循 Editorial 设计 token。
- 适配器/契约全链透传 demo；InteractiveStepCard 在互动控件上方渲染演示。
- 回归：vitest 89/89、tsc 零错误、build 455.47 kB；浏览器实测——输入「47+28 怎么算」生成后，第 1 步竖式动画（个位 7+8=15→满十→75 高亮），第 2 步凑十法动画（28 拆成 3 和 25 → 47+3=50 → 50+25=75），均自动播放可重播。
## Appendix — 课件演示重叠修复（2026-09-09 第三轮）

用户报凑十法动画字体重叠（「拆成 7 和 21」压在数字块上、箭头穿字）。根因：SVG 坐标硬编码，注释文字与图形同层混排。

修复：MakeTenAnim 重写为分行布局——行1 原式、行2 拆解圆角色块（rect+text，黄块=凑十数/灰块=剩余数）、行3 凑十解说、行4 结果；注释移到块右侧同水平线；箭头改走块上方空白。ColumnAdditionAnim 解说固定底部独立行，并修掉 frame-1 文案重复（「15 = 15，满十」）。63+28 实测无任何重叠。
## Appendix — 课件会话刷新丢失修复（2026-09-09 第四轮）

用户实机截图：互动按钮点击后报「回传失败：无活跃课件会话」。根因：课件会话状态只存在于适配器内存，刷新后适配器重建、会话丢失；而快照恢复的课件 proposal 仍带互动控件——能看不能点。

修复：OpenMAICAdapter 新增 `getInteractiveSessionState`/`restoreInteractiveSession`（导出/回灌 sessionToken/expectedSeq/版本）；`SessionSnapshot` 新增 `omcSession` 字段，Provider 写快照时即时读取适配器会话、恢复时回灌；无会话兜底文案改为行动指引（提示重新生成恢复）。实测：生成（快照含 omcSession seq=1）→ 刷新 → 直接点互动 → 「互动已记录」不再失败。
## Appendix — OpenMAIC 课件 LLM 实时生成（2026-09-09 第五轮）

按用户指令把 BFF 课件模板升级为 LLM 实时生成：

- 新增 `scripts/lib/courseware-core.mjs` 纯函数库：算式提取、模板课件、LLM 提示词、严格校验（互动类型 3 种白名单 / 演示类型 2 种白名单 / 恰好 3 步 / 数字范围；demo 不合法置 null 不整体拒绝）。
- `openmaic-bff.mjs` 的 `lessons:open` 改为 LLM 优先（经本机 AI 代理，55s 超时，响应对象/字符串双兼容），校验失败或代理离线自动回退本地模板——离线时互动课件仍完整可用。
- 回归：core 冒烟（提取/模板/校验合法与非法全过）、tsc 零错误、vitest 相关 10 例通过、build 455.97 kB；BFF 直连与浏览器全链实测「52-37 退位减法」→ LLM 生成定制课件（标题「退位减法小帮手」、步骤「观察退位/动手计算/总结方法」、正确省略加法演示），约 5 秒生成。
## Appendix — 课件演示渲染器扩容：5 种 + 通用兜底（2026-09-09 第六轮）

用户质询「渲染器为什么这么少，OpenMAIC 什么问题都能渲染」。扩容：

- 白名单从 2 种扩到 5 种：column-subtraction（退位减法竖式：个位不够减→退一当十→十位）、multiplication-groups（乘法「几个几」分组圆点逐组点亮+跳数求和）、step-reveal（通用分步揭示：LLM 把任意题型解法拆成 2-6 句话，前端逐条动画呈现——覆盖图形/应用题/混合运算等全部剩余题型）。
- 数据约束按类型校验：退位减法要求 a>b；乘法限定表内（2-9×2-9）；step-reveal 至少 2 句；demo 支持 step 字段挂载到任意一步（默认：加法→步1，其余→步0）。
- LLM 提示词同步更新题型-渲染器匹配规则；超范围数据拒绝（demo 置 null 不整体拒绝）。
- 端到端实测三种题型：退位减法→column-subtraction、乘法→multiplication-groups、苹果应用题→step-reveal（LLM 生成「有5个苹果/去掉2个/5-2=3」三句揭示）——全部按题型正确匹配。
## Appendix — 乘法分组布局修复（2026-09-09 第七轮）

用户截图「这对吗？」：乘法演示圆点黏连成 8 字形、后点溢出分组圈、组值数字与汇总文字叠字。根因：圆点线性 x 递增坐标 + 椭圆分组圈与文字同层。

修复：MultiplicationGroupsAnim 重写为 2 行网格布局（上 ceil(b/2)/下 floor(b/2)），每组独立圆角矩形框，组值框下居中独立行，汇总行固定底部独立行并 textLength 限宽防溢出。独立 HTML 预览验证 3 组每组 4 点：点距均匀无黏连、全部落在框内、无叠字。
## Appendix — 算术规范门禁：项目级自动化护栏（2026-09-09 第八轮）

用户质疑「工作区记忆能根治吗」——不能。根治方案：把竖式算术规范固化为组件测试（tests/unit/coursewareDemoSpec.test.tsx，7 例）：

- 加法：进位 1 必须标在**十位列**（x≈210±20）且不得出现在个位列；结果行必须为满十取余值与含进位的十位值（37+45→2/8）；无进位算式不得渲染进位标注。
- 减法：退位标注必须标在**个位列**且含「退」字；借后值（个位+10，如 12）必须可见；结果行断言（52-37→1/5）。
- 乘法：所有圆点必须落在某个分组框内（防溢出回归）；表外乘法防线在 BFF 校验层。

技术要点：动画逐帧用 setTimeout 揭示，测试用 vi.useFakeTimers + act(vi.advanceTimersByTime(6000)) 推进到最终帧再断言（advanceTimersByTime 不包 act 不会 flush React 状态到 DOM——4 例假失败由此而来）。

根治验证：故意把进位 1 注回个位列 → 门禁立即失败；恢复正确坐标 → 全绿。全量 96/96 通过。此后任何人（包括 AI）把标注挪错列，CI 直接失败——记忆只约束个体，测试约束所有改动。
## Appendix — 全量 Bug 根治审计：补齐 5 处护栏缺口（2026-09-09 第九轮）

用户追问「之前提到的 bug 也根治了吗」——逐项审计发现 5 个已修复但无回归护栏的缺口，全部补齐（新增 coursewareCore.test.ts 11 例 + sessionRestoreGuard.test.ts 7 例）：

1. **LLM 课件校验器**：白名单（互动 3 类/演示 5 类）、恰好 3 步、乘法表内 2-9、减法 a>b、step-reveal 2-6 句、demo 挂载位 step——11 例全覆盖，含 DeepSeek「prompt 须含 json」约束的提示词断言。
2. **快照恢复课件会话**（omcSession）：类型字段存在性、Provider 恢复路径含 restoreInteractiveSession/omcSession、resolveRestorablePhase 最小数据集降级。
3. **状态机 lesson_active→generating**：追问式再生成的合法性断言 + 反向确认未过度放行（material_ready→quiz_active 仍非法）。
4. **能力清单防回退**：组件 24/37 available、25/34 flag-false 固化为断言。
5. **防伪回执**：REGISTRATION_COMMITTED 无 proposal 时不生效。

审计结论：其余已报 bug（内容错配、grading 幂等、踩点给分、宿主/OA 门禁、进位位置、乘法布局、快照会话恢复链）此前已有护栏覆盖。全量 114/114。
排查插曲：coursewareCore.test import 路径多写一级（../../../→../../）导致 vite 解析失败，曾误判为 tsconfig/资产管线问题——先用 node path.resolve 核算路径层数再动手，5 分钟定位。
## Appendix — 能力边界展示与清单一致性修复（2026-09-09 第十轮）

用户截图：能力边界卡片仍显示「26/37：HOLD，不进入主链」，与 capabilityManifest（已升级 available）不一致。根因：CapabilityStatus.tsx 硬编码状态文案。

修复：展示改为由 `getCapabilityState` 实时驱动（COMPONENT_LABELS 按 hold/available/flagFalse/merged 出对应文案），manifest 变更展示自动跟随，结构上消除不一致可能。连带修复 coursewareCore.test 的 TS7016/TS7006（新增 scripts/lib/courseware-core.d.mts 类型声明 + 断言显式标注）。

实测：页面显示「26：宿主登记门面可用（本地 BFF）」「37：OpenMAIC 互动课堂可用（本地运行时）」，旧 HOLD 文案消失。tsc 零错误、11+7 用例通过、build 456.59 kB。
## Appendix — 顶部模式横幅硬编码修复（2026-09-09 第十一轮）

用户截图顶部横幅仍显示「尚未连接正式宿主；未调用正式 kernel-10 路由」。根因与能力边界卡片相同：ModeBanner.tsx 全硬编码。

修复：横幅改由运行时配置实时驱动——动态列出已启用增强（宿主登记/OpenMAIC 互动课堂），权威语义如实保留（proposal-only、kernel-10 契约、宿主登记走本机服务）。全 src 扫描确认无其余硬编码状态字样。tsc 零错误、build 456.88 kB、页面实测新文案生效。
## Appendix — 演示/mock 数据切换（2026-09-09 第十二轮，#6/#7/#8）

用户要求把所有演示/mock 数据切到真实数据。本轮落地任意材料路径（local-pdf / local-image-ocr）的真实 AI 内容：

1. **#6/#8 任意材料 LLM 微课堂+Quiz**：ai-proxy 新增 /api/ai/quiz（结构化 quizSchema，choice 强制 4 选项、steps 带 keyPoints 踩点）；AiHybridEducationCenterAdapter 对非苏教路径并行请求讲解+测验，全有或全无（任一失败整体降级本地基线并如实标注），彻底移除「任意材料配演示分数题」的假内容。
2. **#7 executionMode 真实打标**：契约新增 ai-enhanced；讲解/批改 AI 成功时 proposal 如实标 ai-enhanced，降级保持 local-demo；ModeBanner 按运行时开关实时显示「本机自主模式」（AI 开）或「本地受控演示」（AI 关），并修复开关切换后横幅不联动（展示组件订阅配置通知）。
3. **连带修复**：引擎 familyOf 新增 ai-generic 族（AI Quiz 的批改提示/错题章节不再错配「分数加减法」）；苏教内容路由加 origin 前提，任意材料即使 lessonId 撞前缀也不误入苏教内容。

**实测（浏览器全链）**：OCR 图片注入 → AI 生成定制微课堂（「认识生长素」等内容，非通用支架，标注「本讲解与测验均由 AI 依据你的材料生成」）→ AI Quiz 3 题（choice/fill/steps 踩点）→ AI 批改（页面明示「AI 参与批改 · 对错为本地判定」）→ 收尾候选。期间抓到真 bug：callProxy 未传 body.kind 导致代理把 quiz 按 lesson schema 处理、静默降级——已修并加注释。

验证：tsc 零错误、118 测试全过（含新增 4 个 AI 适配器用例 + 1 个引擎族回归）、build 459.52 kB。
## Appendix — 旧标签页 chunk 失效自愈（2026-09-09 第十四/十五轮）

用户旧标签页反复出现「页面加载失败：可能是网络中断或应用已更新」。两层修复：

1. **错误边界自动恢复**（第十四轮）：RouteErrorBoundary 识别 chunk 加载失败类错误后自动整页刷新（sessionStorage 3 秒退避防刷新循环），非 chunk 类错误仍保留手动按钮。
2. **根因治理**（第十五轮）：vite preview 默认把全部 404 兜底为 index.html（200+HTML），旧 hash chunk 请求永远拿到可解析失败的 HTML，自动恢复无从触发。vite.config.ts 新增 configurePreviewServer 中间件：/assets/** 与带扩展名的请求先查 dist 磁盘，缺失即返回真实 404（含路径穿越防护）；页面路径 SPA 回退保留。修复期间踩坑：preview.middlewares 配置项不存在（须用插件钩子）、ESM 配置中不可用 require。

验证（curl + 程序化 preview 双通道）：过期 chunk 404、首页/课堂路由 200+HTML、真实 chunk/CSS 200+正确类型。浏览器实测课堂页正常加载。
