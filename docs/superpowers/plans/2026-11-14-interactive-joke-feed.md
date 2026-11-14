---
change: interactive-joke-feed
design-doc: docs/superpowers/specs/2026-11-14-interactive-joke-feed.md
base-ref: 3cc9d69c7419c458b4d42b0948caa1230d9dd1cd
---

# 上滑段子与双击点赞实施计划

> 使用 executing-plans 按任务执行；用户已确认互动方向，继续现有分支。

**目标：** 在办公室下方刷段子、双击点赞得一次小奖励，保留巡逻与原位置的一键工作。

**架构：** `Game` 管理每条的点赞状态、收入及反馈时钟；`app.js` 管理原创文本和手势，DOM 卡片复用控制区第一行。输入只通过 `jokeAction('next'/'like')`，不增加运行依赖、接口或资源模块。

**技术：** 原生 JavaScript、DOM/Pointer Events、现有 CSS Grid、Node test runner。

## 1. 模型与奖励测试

文件：修改 `src/engine.js`，新增 `tests/joke-feed.test.js`。

1. 先写失败测试：未点赞卡片奖励 1；第二次点赞拒绝；下一条只换内容不发钱，下一条可重新点赞。示例：

   ```js
   const g = new Game(2, 123); g.inspectors = []; g.npcs = [];
   g.setActivity('joke');
   assert.equal(g.jokeAction('like'), true);
   assert.equal(g.coins, 1);
   assert.equal(g.jokeAction('like'), false);
   assert.equal(g.coins, 1);
   assert.equal(g.jokeAction('next'), true);
   assert.equal(g.coins, 1);
   ```

2. 运行 `node --test tests/joke-feed.test.js`，确认原实现因缺少行为而失败。
3. 在 `Game` 增加 `joke={post:0,liked:false,likes:0,reward:0,heartLeft:0}`；`jokeAction` 就近完成输入门禁、换条与点赞。点赞按当前金椅翻倍，并按现有连续档位累积额外奖金。原 2 金币/秒及风险计算保持。
4. 在现有 `tick()` 更新反馈剩余时间，不使用独立计时器。切工作保留当前卡片已赞状态；新一局由新 `Game` 重置。
5. 补齐金椅、当前连续档、暂停快照、模态框/移动/锁定/收手门禁及回到同一条不重复奖励。运行定向测试、`npm test`、`npm run build`，通过后提交模型变更。

## 2. 小卡片与手势

文件：修改 `index.html`、`src/app.js`、`style.css`；新增 `tests/joke-gesture.test.js`。

1. `index.html` 的控制区加入默认隐藏的 `#joke-panel`，包含标题、原生 `#joke-card` 按钮、可读段子文本、爱心反馈和简短操作提示；不添加局外入口。
2. `app.js` 放置 8 条原创短段子，按 `post % 长度` 循环。`updateUI()` 仅在坐着看段子时显示卡片，隐藏活动按钮；普通、跑酷、段子共用第一行尺寸和工作按钮坐标。
3. 写手势失败测试，再实现一处 Pointer Events 识别：向上移动超过阈值且纵向为主才换条；350ms 内两次轻点才点赞；横滑、单点与取消不发奖。每次有效手势只调用一次引擎入口，不依赖 DOM 动画发钱。
4. 键盘 Enter 点赞、↑ 换卡；阻止这两键继续触发全局游戏跳跃，空格仍由现有一键工作处理。辅助技术激活按钮可点赞。重复双击或 pointer/dblclick 同时到达，模型的已赞状态保证只领一次。
5. 用状态驱动爱心颜色和 `heartLeft` 反馈，暂停时不推进；退出活动隐藏卡片，不恢复已领过的奖励。卡片文本用 `textContent`，不解释成 HTML。
6. 运行 `node --test tests/joke-feed.test.js tests/joke-gesture.test.js`、`npm test`、`npm run build:site`；检查构建仍只含允许的运行文件，再提交 UI 变更。

## 3. 审查、试玩与发布

文件：同步 `openspec/changes/interactive-joke-feed/tasks.md`；记录 `docs/superpowers/reports/2026-11-14-interactive-joke-feed-verify.md`。首页焦点修复沿用已提交的 `3cc9d69`，不回退。

1. 对照设计和本计划只读审查：奖励只一次、暂停冻结、收手期间不能操作、金椅及基础收入、全关卡和旧成绩保持。运行 `npm test`、`npm run build:site`、`git diff --check`、`openspec validate interactive-joke-feed --strict`。
2. 用正常入口在 375×667 与桌面实际进入看段子：双击一条、重复双击、上滑换条再点赞、横滑不换条、暂停/恢复、收手后返回、切跑酷。测量办公室边界和工作按钮坐标，确保卡片不遮挡老板、切换不跳位；小屏文字和返回入口完整。
3. 首次刷新首页确认开始按钮无自动焦点外框；Tab 仍显示焦点，Enter 能选关，返回首页正常。保存实际首页和段子互动截图，检查控制台与资源。
4. 测试通过后记录精确运行提交，只发布 `dist/` 到用户已授权的现有开发机；保留上一版本，验证发布清单及运行资源散列，再做线上点赞/换条/收手检查。
5. 将部署信息保存在原私有部署记录副本，报告附实际试玩链接与截图。保留当前分支，不推送、不归档；不把内网配置带入公开仓库。
