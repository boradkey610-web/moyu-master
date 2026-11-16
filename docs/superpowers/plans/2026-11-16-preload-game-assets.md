---
change: preload-game-assets
design-doc: docs/superpowers/specs/2026-11-16-preload-game-assets-design.md
base-ref: f12384988aee3b6ac9165ba764aab6305e0e12c7
---

# 素材预加载实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 全部画面素材就绪后才进入完整首页，加载失败时保留阻挡并允许重试。

**Architecture:** 在现有 `src/app.js` 启动处加入 `boot()`，等待 `renderer.ready` 返回空错误列表才显示首页、绘制首帧和启动唯一 RAF。失败重试调用既有 `loadArt()` 并更新 `renderer.ready`，复用同一启动路径；初始 HTML 加载页不依赖图片。

**Tech Stack:** 现有原生 JavaScript、HTML/CSS、Canvas、Node.js test runner。保持 `loadImage` 的 `onload` 契约，不改为 `decode()`，不新增库或运行模块。

用户已授权当前分支主窗口 TDD、自主完成公司开发机发布，无需再次确认；不 push、不归档。以下对应 tasks 1.1、1.2、1.3。

### 任务 1：真实 boot 与加载器行为测试（1.1）

**文件：** 新增 `tests/app-boot.test.js`、`tests/asset-ready.test.js`；修改 `src/app.js`。阅读 `src/render.js` 的 `loadArt/loadToolIcons/loadImage`，仅在测试揭示契约问题时最小修改它。

1. 参考 `tests/audio-app.test.js` 的应用测试方式，执行真实应用启动代码，以可控 Promise 替代素材就绪结果，记录 menu、绘制、解锁和 RAF 调用。写三个失败用例：Promise 未完成时不显示游戏、不启动时钟；错误列表非空时仍阻挡并提供重试；重试成功后完整首帧先于解除遮挡，且重复触发启动/重试不会产生第二条 RAF 链。不要在测试中另写一个“模拟 boot”代替被测实现。
2. 用真实 Renderer 加载方法及可控图片 `onload/onerror` 写用例：清单图片全部完成但工具图标未完成时仍等待，反向情况亦然；图片/清单/图标失败返回错误，重试清理旧错误并成功。测试不调用 `decode`，不依赖真实网络等待。
3. 执行 `node --test tests/app-boot.test.js tests/asset-ready.test.js`，记录当前实现的预期失败。实现最小 `boot()`，替换当前末尾直接 `menu(); requestAnimationFrame(frame)`；等待期间冻结对局，失败留页，重试期间禁用重复操作，成功只启动一次。保持首页原有异步绘图和音频用户手势契约。
4. 重跑同一命令，期望全部通过；同步任务 1.1。只保留为真实启动顺序所需的状态，不引入通用加载框架。

### 任务 2：无图片加载页与初始交互阻挡（1.2）

**文件：** 修改 `index.html`、`style.css`、`src/app.js`；扩展 `tests/app-boot.test.js`。

1. 先补初始 HTML 和交互回归：脚本尚未执行时加载页已存在，场景、HUD、控制及原弹层隐藏且不可操作；失败有可访问的重试按钮，重试中不可再次激活。运行 `node --test tests/app-boot.test.js` 确认新增断言失败。
2. 加入办公室便签风格的纯 HTML/CSS 加载页，以真实加载中/失败状态文字表达，不虚构进度百分比。将隐藏游戏的属性直接写入初始 HTML，保留工具 SVG 在 DOM 中供 `loadToolIcons()` 读取；成功首帧完成后再解除隐藏。手机布局不溢出，状态文本和重试焦点可读。
3. 重跑启动测试；在浏览器可用时检查正常加载、延迟素材、失败重试及窄屏。确认加载期不接受玩法输入、办公室时间不流逝，进入后首页完整，重试后没有双倍帧推进；同步任务 1.2。

### 任务 3：全回归、审查和公司开发机发布（1.3）

**文件：** 新增 `docs/superpowers/reports/2026-11-16-preload-game-assets-verify.md`；更新当前 change 的 `tasks.md`。部署沿用现有记录和工具。

1. 执行 `npm test`、`npm run build`、`npm run build:site`，记录实际结果；核对静态白名单与产物，确认无新依赖、模块或素材变化。独立审查启动顺序、失败重试、唯一 RAF、图片 `onload`、存档及音频手势限制，修复后重跑受影响检查。
2. 按现有授权仅发布公司开发机，上传已验证的构建产物并保留上一版。将静态白名单文件逐项与运行提交、远端资源内容核对，确认入口与引用资源可访问，不能只凭首页成功响应认定发布通过。
3. 发布后复验加载页到完整首页、失败重试及正常玩法进入。报告区分可控 Promise/真实加载器测试、构建与资源校验、实际浏览器观察；若浏览器连接不可用，明确未做的视觉/交互验证，不冒充实玩。记录发布版本、地址和回退位置，同步任务 1.3；保留当前分支，不 push、不归档。

**完成标准：** 慢资源不提前放行，失败可重试，全部图片和图标就绪才进入，主循环只启动一次；回归与构建通过，开发机资源核验完成，所有验证边界如实记录。
