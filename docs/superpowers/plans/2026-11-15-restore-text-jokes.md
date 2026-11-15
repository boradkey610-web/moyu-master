---
change: restore-text-jokes
design-doc: docs/superpowers/specs/2026-11-15-restore-text-jokes.md
base-ref: 1db46c7319b282df9efc06c11aec02830fea2e1a
---

# 恢复纯文本段子实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 撤销两次互动实验，恢复最初 24 条纯文本、单击换条的段子窗口。

**Architecture:** 机械恢复已核对的 `dfef31a9cc83030231921b62515a5ecee04c9b0c` 运行文件，不重新设计。只操作实验差异白名单，保留其他文件和全部历史文档，不 reset 分支。

**Tech Stack:** 现有原生 JavaScript、HTML/CSS、Node.js 测试与静态构建。

当前分支由主流程直接执行，先恢复旧测试再恢复源码；不推送、不归档。三组分别对应 change tasks 的 1.1、2.1、3.1。

### 任务 1：先恢复测试，再恢复源码并核验字节（1.1）

1. 复核 `git diff --name-status dfef31a HEAD` 与 `git status --short`，将本 change 新文档和其他人的新修改排除在恢复范围之外。
2. 恢复旧测试：
   ```sh
   git restore --source=dfef31a -- tests/joke-feed.test.js tests/sound-source.test.js tests/static-site.test.js
   node --test tests/joke-feed.test.js tests/sound-source.test.js tests/static-site.test.js
   ```
   记录当前实验实现不满足 `nextJoke` 等旧文本契约的失败，不把预期红灯当作最终结果。
3. 只恢复六个运行文件，并删除三份实验新增文件：
   ```sh
   git restore --source=dfef31a -- dev/build-static-site.mjs index.html package.json src/app.js src/engine.js style.css
   rm src/comic.js tests/comic-render.test.js tests/joke-controls.test.js
   ```
   无须改 `src/render.js`：已核验它相对基线没有净差异。不得批量还原整个仓库或删除历史 design、plan、report、OpenSpec 文档。
4. 执行 `npm test` 和 `npm run build:site`，期望全部通过。执行 `git diff --exit-code dfef31a -- src assets index.html style.css package.json server.mjs dev tests`，期望无输出且退出码 0，证明受检运行文件、素材和测试与基线字节一致；若出现新差异，先查明来源，不扩大恢复范围。确认 `dist` 回到 29 个运行资源，记录实际文件列表和哈希。同步任务 1.1。

### 任务 2：范围审查与真实 UI 核验（2.1）

1. 用 `git diff --stat`、`git diff --name-status` 审查实际恢复范围。确认 24 条原内容、单击仅换一条且不发额外奖金、基础收入、首次警告奖金反馈、第四关抢座和现有进度契约与基线一致。
2. 在真实浏览器手机视口实际连续点击多条，验证 Enter 换条、空格及按钮收手、重新进入保留当前条数；确认动画/双条/按住提示均消失，控制区高度与一键工作位置保持。复验跑酷点击跳跃和收手，不使用状态注入代替试玩。
3. 将测试结果、基线对比结果、截图和真实操作记录写入 `docs/superpowers/reports/2026-11-15-restore-text-jokes-verify.md`，明确自动测试和浏览器观察的边界；同步任务 2.1。

### 任务 3：现有开发机部署与 29 资源核验（3.1）

1. 读取现有发布说明和最近部署记录，沿用同一开发机与发布流程，只发布已通过检查的 `dist`，保留前版和可回退位置，不猜测地址或部署命令。
2. 对照本地构建列表核验远端全部 29 个运行资源的数量、内容哈希和可访问性，确认入口不再引用 `comic.js`、旧缓存不影响新页面；不要仅凭首页 HTTP 成功宣称发布验证通过。
3. 在发布地址实际验证单击换条、收手、重入和手机布局。报告写入实际发布地址、资源核验及回退位置，同步任务 3.1；保留当前分支，不推送、不归档。

**完成标准：** 运行恢复范围精确且与指定基线字节一致，全量测试和构建通过，真实页面恢复纯文本点击交互，开发机 29 个资源与构建一致。所有结果以执行记录为准，本计划不宣称已恢复或发布。
