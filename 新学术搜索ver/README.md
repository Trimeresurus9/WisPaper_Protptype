
  # 0408-Proto

  This is a code bundle for 0408-Proto. The original project is available at https://www.figma.com/design/gnsWjhcevEpNg8JjSwOXau/%E8%AE%BA%E6%96%87%E5%A4%8D%E7%8E%B0ver.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.
  

## Onboarding（统一主原型）

只使用 http://127.0.0.1:3000/ 。左侧「原首页」→ 左下角 Mock →「开始体验」。Mock 内可切换搜索 / Agent、结束、重播、跳转兴趣或扫码、模拟登录状态。原有支付、积分等控制在「其他 Mock 设置」中。

引导实现位于 `src/components/onboarding/`，通过主项目的 App 和 MockConsole 使用。兴趣与原首页个性化设置共享；状态保存在 3000 当前浏览器。旧 4174 演示已停止，历史源码仅留作 `docs/onboarding/legacy-4174-2026-11-05.zip` 归档。

验证记录见 `docs/onboarding/migration-2026-11-05.md`。

## Ask AI 与收起的引导

右下角 Ask AI 打开悬浮聊天。关闭 onboarding 气泡后，引导以「继续了解」卡片保存在聊天内，点击恢复原步骤；搜索与 Agent 气泡分别指向实际输入框。

首页 / 知识库使用悬浮抽屉，搜索结果使用右栏，Agent 任务使用独立 Ask AI Tab。支持知识来源、新对话、历史恢复与本地 Mock 回答。Mock 中可切换正常回答、回答失败和上下文失效。

实现：`src/components/ask-ai/`。验证与限制：`docs/onboarding/ask-ai-2026-11-06.md`。
