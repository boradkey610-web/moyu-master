---
change: mechanic-level-progression
design-doc: docs/superpowers/specs/2026-11-16-mechanic-level-progression-design.md
base-ref: 435333b20722734fab2743ce83fd5e401cb9529e
---

# 六关机制递进实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 六关依次介绍巡逻、会议、打印机、金椅，再组合机制并加入抢座。

**Architecture:** 现有关卡配置增加 `events/goldSeats/rivals`，替换机制索引硬编码。`soundField.office` 使用 `{meeting: state|null, printer: state|null}`，无事件关卡可为 `null`；共享现有事件推进、寻路和联合预测，两个子事件独立计时。

**Tech Stack:** 现有原生 ES modules、Canvas、Node.js tests 和静态发布，无新依赖或素材。

用户已授权当前分支主窗口 TDD、自主完成公司开发机发布，不再次确认，不 push、不归档。以下依次对应 tasks 1.1、1.2、2.1、3.1。

### 任务 1：六关机制配置与门槛（1.1）

**文件：** `src/engine.js`；新增 `tests/mechanic-progression.test.js`，修改 `tests/golden-seats.test.js`、`tests/drop-balance.test.js`、`tests/engine.test.js`。

1. 先写配置表测试：座位 8/8/12/12/16/16，检查者 1/1/1/1/2/2，目标初值 90/170/300/360/420/480，时长 60/75/90/90/90/90；事件依次无/会议/打印机/无/二者/二者，金椅数量 0/0/0/1/2/2，只有末关 `rivals` 开启。覆盖前三关计时与直接生成均不出金椅、第二关起会议道具优先补缺、仅末关同事抢座。执行 `node --test tests/mechanic-progression.test.js tests/golden-seats.test.js tests/drop-balance.test.js`，确认新增行为先失败。
2. 配置驱动机制入口，保留金椅 18 秒独立寿命及补刷、正常巡逻速度和所有摸鱼活动。将旧金椅/抢座测试夹具迁移到对应新关卡，保留原双椅、过期、占座与奖励断言，不删测试意图。
3. 重跑上述测试及 `node --test tests/engine.test.js`，期望通过；同步任务 1.1。

### 任务 2：会议与打印机独立运行（1.2）

**文件：** `src/engine.js`、`tests/office-events.test.js`、`tests/sound-source.test.js`、`tests/mechanic-progression.test.js`。

1. 先补会议可复现随机、失败机会、首次保底和混合事件同时发生的测试。会议最早机会 16–22 秒、每次 60%，未发生且老板在场可用时最晚第 30 秒首次机会；最多两场，正常走出后等待 12 秒，后续机会 32–40 秒。使用独立随机状态，不读取玩家位置或行为。用确定种子覆盖成功/失败分支，不用小样本通过率硬断言 60%。运行 `node --test tests/office-events.test.js tests/mechanic-progression.test.js`，记录预期红灯。
2. 拆分 `office.meeting` 与 `office.printer`，复用 `sendToMeeting` 正常离返；打印机持续 10 秒、间隔 24 秒，其掩护不清除积累音量。迁移所有旧 `office.kind/nextAt/count/activeUntil` 使用点，不能让一种事件覆盖另一种。
3. 补暂停整体冻结、打印机掩护期间真实听觉、主管继续巡视、正常返场、混合事件预测轨迹一致测试。预测深拷贝两个事件及其种子，共用推进函数，预测前后真实声场/随机状态不变。旧会议/打印机测试改用第 2/3 关或混合关主题，保留原离返、提示、声音与预测验证意图。
4. 执行 `node --test tests/office-events.test.js tests/sound-source.test.js tests/mechanic-progression.test.js`，期望通过；同步任务 1.2。

### 任务 3：选关呈现、多事件读取与 v7 迁移（2.1）

**文件：** `src/app.js`、`src/render.js`，按实际调用涉及 `src/audio.js`；`tests/save-migration.test.js`、`tests/office-layout-ui.test.js`、`tests/audio-app.test.js`、`tests/office-events.test.js`。

1. 先补 v7 读取自身成绩、继承 v6 及更早解锁但隔离旧成绩，以及六关全可选/三活动全开放的测试。增加混合关同时呈现会议和打印机、打印音效只由 printer 子状态控制的断言。运行上述测试文件确认新增行为失败。
2. 更新六关名称、说明与原素材插图，明确本关新机制和混合关系；复用老板、打印机、金椅、主管、玩家贴图。UI、Renderer 和音频从独立子状态读取，不用互斥分支隐藏另一事件。保持存档信任边界现有校验方式，不另加层层防御。
3. 切换 v7 存档键，按现有迁移模式继承历史解锁、保留旧版本存档，旧成绩不混入新规则。重跑本组测试，期望通过；同步任务 2.1。

### 任务 4：30 种子回归、审查与发布（3.1）

**文件：** `dev/simulate-risk-loop.mjs`；新增 `docs/superpowers/reports/2026-11-16-mechanic-level-progression-verify.md`，同步当前 change 的任务与必要参数说明。

1. 将现有模拟入口从硬编码四关改为全部六关，复用固定种子 1–30 和既有策略。执行 `node dev/simulate-risk-loop.mjs`，记录每关每策略胜率、时长、抓包和实际活动收益；注明策略是否利用金椅、会议、打印机及换座，不能把策略未利用机会直接视为关卡不可玩。根据证据调整获授权的目标值，并同步配置测试和设计说明；不加全知追踪、突然提速或新机制。
2. 执行 `npm test`、`npm run build`、`npm run build:site`。独立审查门槛、随机保底、事件重叠、声量保留、预测不污染、旧测试意图及迁移；修复后重跑受影响检查。报告模拟结果与自动测试，不把模拟宣称真实手机试玩。
3. 浏览器可用时实际验证新选关、单机制机会、混合事件和末关抢座；不可用时明确真实试玩及布局缺项，不绕过连接限制。按原公司开发机流程发布已验证静态产物，逐项核对静态白名单、运行版本与远端资源，保留上一版和回退位置。
4. 报告实际参数、测试命令与结果、模拟限制、审查结论、发布校验和未验证项；同步任务 3.1。保留当前分支，不 push、不归档。

**完成标准：** 六关门槛明确，会议/打印机可独立共存且预测一致，原收益/警告/声音与测试意图保留，v7 继承进度并隔离成绩；回归、模拟、审查和发布证据完整，真实试玩边界如实记录。

## 执行记录

固定种子模拟发现第三、四关原初值过低，第六关510试值存在一例及时收手仍失败，最终目标调整为90/170/450/470/480/490。自然会议保留旧meetingReturn门槛，避免手动会议返场途中被自然会议再次叫走；新增先红后绿回归。
