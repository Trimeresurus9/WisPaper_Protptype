# Agent chat 内登录入口

## 游客流程

从 `/app/home` 手动提交问题后进入 `/app/agent`，在现有 Agent chat 中保留原始问题并展示登录卡片。邮箱、创建账户、Google、Apple、机构和微信均提供原型交互；成功后继续原任务。登录前不执行 Agent、不启动云主机、不写任务记忆。案例卡片仍可免登录查看。

query 在页面卸载前保存到当前会话，任务类型与登录要求保存在 history state；刷新、返回修改和模拟登录后可继续使用。

## 本次整合验证（2026-11-13）

在 main 的独立工作树中完成：

- `npm ci --no-audit --no-fund`、`npm run build` 通过；现有 bundle 大小警告仍在。
- 9 项 React test renderer 组件交互检查通过：条款勾选、四个第三方入口、邮箱校验与演示验证码、游客执行阻断、query 保存恢复、免费案例路径。临时测试隔离了应用上下文和未打开弹窗，不等同浏览器验收。
- 游客工作台额外断言：即使 URL 包含 `browser=demo`，也不会创建任务记忆、修改任务 history 或启动演示执行。
- `node --test docs/home-onboarding/behavior.test.mjs docs/sandbox/lifecycle.test.mjs`：15 项通过。
- 源码 diff 检查通过，原首页、案例数据与已合并的机构管理、云主机等无关文件未修改。

当前会话对本地站点存在已保存的浏览器权限拒绝，未绕过；本次没有浏览器视觉、移动端或真实点击验收。登录是模拟流程，未接真实 OAuth、邮件验证码、注册或计费；不会发送邮件或创建第三方账号。邮箱演示验证码为 `123456`。
