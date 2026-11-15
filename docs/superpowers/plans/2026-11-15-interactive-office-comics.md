---
change: interactive-office-comics
design-doc: docs/superpowers/specs/2026-11-15-interactive-office-comics.md
base-ref: f29b5ee5c92585fd391fca097ffa2987d358c683
---

# 办公室互动漫画实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 用三幕可点击道具、可观看演出的办公室漫画替换憋笑挑战，保留安静摸鱼、随时收手及原控制区高度。

**Architecture:** 复用 `src/runner.js` 的独立模拟与 Canvas 绘制模式，新增 `src/comic.js`，由 `Game` 时钟推进，绘制函数只读。单一场景配置同时提供剧情、动作步数与道具命中区；原生透明按钮覆盖道具，Canvas 复用现有 Renderer 角色、座椅及办公室素材。奖励接入已有金椅和连摸结算路径。

**Tech Stack:** 原生 ES modules、Canvas 2D、HTML/CSS、Node.js test runner；不新增依赖、网络资源或位图。

执行约束：用户已批准主流程在当前分支直接实施 TDD。保留分支，不推送、不归档。三组任务对应 `openspec/changes/interactive-office-comics/tasks.md` 的 1.1、2.1、3.1；本计划不代表实现或验证已经完成。

### 任务 1：三幕模拟、奖励与旧机制移除（1.1）

**文件：** 新增 `src/comic.js`、`tests/comic.test.js`；修改 `src/engine.js`、`tests/joke-feed.test.js`、`tests/sound-source.test.js`；参考 `src/runner.js`、`tests/runner.test.js`、`tests/risk-loop.test.js`。

1. 先写 `tests/comic.test.js`，按 runner 先例约定 `createComic`、`clickComic`、`stepComic`，由步进返回本次新增奖励。测试初始状态仅含 `post/clock/step/anim/phase/doneAt/reward`；画饼需三次点击，前两段各 0.35 秒，第三段 2 秒；闹钟一步 2 秒；咖啡一步 2.6 秒。执行 `node --test tests/comic.test.js`，确认因新模块/行为尚未实现而失败。
2. 实现最小场景配置与模拟。动画期间点击无效；演完只返回一次 3 金币，不能在结束帧、结果阶段或连点中重复领奖。下一幕必须同时满足 `clock >= 6` 和 `clock - doneAt >= 2`，三幕固定循环；未完成操作不能按时间自动领奖。以分段步进覆盖临界时间，不依赖真实等待。
3. 将 `tests/joke-feed.test.js` 改为引擎集成用例：保留每秒 2 金币与 0.1 秒收手；完成演出额外 3 金币、金椅翻倍、按现有连摸比例增加待收奖金。暂停/弹窗/收手/移动时漫画不推进、不响应点击；离开后冻结，重入继续，已领奖幕不能重入刷奖。先运行 `node --test tests/joke-feed.test.js` 确认失败，再接入 Game 初始化、点击入口和已有步进路径。
4. 删除 `holdLaugh`、笑意/气息、憋笑轮次及失败笑声逻辑，移除仅为笑声加入的 `burstUntil` 声场扩展；恢复段子无声。更新声场回归，保留游戏/蹦迪听觉、固定调查快照及镜子预测复制契约，不能因清理破坏旧行为。
5. 执行 `node --test tests/comic.test.js tests/joke-feed.test.js tests/sound-source.test.js tests/risk-loop.test.js`，期望全部通过；检查差异并同步任务 1.1。

### 任务 2：三幕动画、道具点击与构建集成（2.1）

**文件：** 修改 `src/comic.js`、`src/app.js`、`src/render.js`、`index.html`、`style.css`、`package.json`、`dev/build-static-site.mjs`；新增 `tests/comic-render.test.js`、`tests/comic-input.test.js`；更新已有 `tests/joke-input.test.js` 和 `tests/render-motion.test.js` 中失效的憋笑/笑声用例。

1. 先写输入与绘制回归：原生点击及 Enter 只触发一次道具操作，演出/暂停/收手时禁用；绘制前后模型序列化一致，关键时间点有不同位移/旋转/缩放。用现有 runner 输入测试方式和 Renderer 测试替身，执行 `node --test tests/comic-input.test.js tests/comic-render.test.js`，确认缺少新行为而失败。
2. 在 `comic.js` 绘制 480×128 场景，复用 Renderer 素材：画饼逐次膨胀，最终掉落压住老板；下班闹钟响后同事冲走、椅子旋转；咖啡让人惊醒后再睡倒。所有演出位置由模拟时间计算，不用独立定时器或新静态图片替代动画。
3. 替换憋笑 SVG、双状态条和按住监听，删除失效文案及样式。保留标题、简短提示、原控制区高度和一键工作坐标。用同一场景配置将透明原生按钮按 Canvas 缩放比例覆盖当前道具；有效点击区域约 40px 以上，提供图形脉冲、可见焦点和明确可访问名称。鼠标、触摸、Enter 统一原生点击语义，空格继续收手。
4. 清理 Renderer 及 UI 中失败笑声标记，恢复安静段子提示；确认办公室仍持续模拟。把 `src/comic.js` 加入 `package.json` 语法检查和 `dev/build-static-site.mjs` 静态白名单，沿用现有资源加载流程。
5. 执行 `node --test tests/comic-input.test.js tests/comic-render.test.js tests/runner.test.js tests/render-motion.test.js` 和 `npm run build:site`，期望全部通过且 `dist/src/comic.js` 存在。浏览器初查三幕可见、按钮与道具位置一致、收手不跳位；同步任务 2.1。

### 任务 3：真实试玩、审查与开发机交付（3.1）

**文件：** 新增 `docs/superpowers/reports/2026-11-15-interactive-office-comics-verify.md`；更新当前 change 的 `tasks.md`。沿用仓库现有开发机发布说明，不猜测部署命令或上传源码目录。

1. 执行 `npm test`、`npm run build`、`npm run build:site`，记录实际结果。审查对照设计，确认原基础收入、关卡目标、处罚、存档、巡逻和跑酷保持；没有残留憋笑输入/状态/笑声分支，没有重复奖励或独立动画时钟。
2. 正常浏览器操作完整玩完画饼三点击、闹钟、咖啡各一次，观察实际分段演出与一次奖励；继续观察三幕循环。在动画中连点、收手后重入、已领奖后重入、暂停恢复，确认状态与奖励正确。至少用一次 Enter，复验触摸以及跑酷跳跃/收手。自动模拟数据与真实浏览器试玩分开记录，不以状态注入代替实玩。
3. 在 375×667 及当前目标手机尺寸检查控制区高度、办公室可见性、一键工作位置、约 40px 命中区与键盘焦点；保存三幕关键帧截图，确认可识别“饼落压老板”“同事冲走椅子转”“咖啡惊醒再睡”的动作。发现偏差立即修正并重验受影响项目。
4. 按现有流程仅发布构建后的 `dist`，保留开发机前版。验证发布地址、`src/comic.js` 和复用素材可加载，再正常点击复验三幕及收手。报告记录命令、实玩动作与观察、截图、发布和回滚位置；同步任务 3.1。保留当前分支，不推送、不归档。

**完成标准：** 三幕内容、点击步数和演出时长符合设计；奖励与轮换防刷约束通过模型及实玩验证；漫画安静且可随时收手，离开冻结重入继续；原素材动画清晰、手机布局稳定、跑酷无回归；开发机资源与本地构建一致。
