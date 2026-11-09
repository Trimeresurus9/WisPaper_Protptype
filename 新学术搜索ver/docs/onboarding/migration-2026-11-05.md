# Onboarding 迁移到主原型 · 2026-11-05

唯一入口：http://127.0.0.1:3000/ 。选择左侧「原首页」，打开右下角 Mock → 开始体验。Agent 可通过同一 Mock 切换。

## 实现

- 原 4174 的搜索 / Agent 骨架动画迁入 `src/components/onboarding/onboarding-scenes.jsx`，通过主项目现有 Remotion 依赖播放；动画组件按需加载。
- 气泡、Mock 控制和持久化状态分别在 `OnboardingExperience.tsx`、`OnboardingMockControls.tsx`、`useOnboarding.ts`。样式以 `wp-ob-` 前缀隔离。
- `App.tsx` 挂载引导，`MockConsole.tsx` 保留一个入口；原有支付、积分、场景工具在「其他 Mock 设置」中，白色控制窗可拖动和收起。
- 搜索引导挂到「原首页」，Agent 引导挂到已有 Agent 页面。结束后仍在主原型中，可以继续使用现有导航与输入框。
- 已替换原首页旧的自动遮罩引导，默认通过 Mock 开始。
- 兴趣保存与原首页个性化设置共用数据；两条引导独立保存状态，Agent 的开始操作不覆盖搜索流程尚未保存的兴趣选择。
- 登录只模拟 onboarding 状态，不切换主原型现有账户；二维码不可用于真实登录。
- 「重置引导」只重置本页引导进度，不删除主原型已保存的兴趣或研究内容。
- 旧 4174 服务器已停止，独立运行文件已移除。原源码和截图经逐文件校验后归档为 `legacy-4174-2026-11-05.zip`，不含可重新安装的 node_modules。

## 验证

- 最终 `npm run build` 通过；保留主项目原有的大 bundle 提示。
- 搜索动画 → 实际选择兴趣 → 模拟扫码 → 结束，走通。
- 已登录时，保存兴趣直接结束；个性化设置的 AI 订阅兴趣区显示本次选择，刷新与页面切换后仍保留。
- Agent 包含输入、模型、Skill、回答四个动画阶段；播完停留。点击「开始使用」结束并聚焦原 Agent 输入框。
- Mock 开始、结束、重播、状态切换、重置、拖动，以及关闭 / Escape、刷新后保留状态，均通过浏览器检查。
- 点击「首页」时不显示原首页气泡；回到「原首页」可以继续。搜索与 Agent 状态独立。
- 1280×800 桌面及 390×844 窄屏下，气泡在视口内，且不与 Mock 重叠。窄屏只检查本次迁入的浮层，不代表全站移动端验收。
- Onboarding 流程未出现运行异常；打开现有个性化弹窗时记录到原 `DialogOverlay` 的 React ref 警告，非本次新增组件，未扩展修改该通用组件。

截图：`search-integrated.png`、`agent-integrated.png`。

## 后续维护

仅在主项目内修改 `src/components/onboarding/` 及其挂载组件。旧目录 `output/onboarding-2026-11-04/` 仅保留迁移说明，不再具有独立启动入口。
