---
change: ripple-office-progression
design-doc: docs/superpowers/specs/2026-11-16-ripple-office-progression-design.md
base-ref: 349a72165a3bdc31e68eda0757b85f37195a7366
---

# 水波纹与办公室递进实施计划

> **执行要求：** 用户确认本计划和执行方式后，使用 @executing-plans 逐项实施；如选择当前会话子代理方式，使用 @subagent-driven-development。当前仅产出计划，不修改运行代码、测试或任务勾选。

**Goal:** 六关按 8／12／16 工位递进，在手机上准确换座、自然巡视，并提供独立过期的多金椅和表达真实声场的轻薄水波纹。

**Architecture:** 新增纯数据布局模块，由每个 Game、检查者、Renderer 和 DOM 共用当前布局。寻路显式接收布局，保留既有默认 12 座导出；金椅统一使用 `specials` 集合；波纹只读真实声源和模拟时间，存档复用现有版本迁移入口。

**Tech Stack:** 原生 JavaScript ES modules、Canvas 2D、DOM、node:test、现有 Python 美术检查、静态白名单打包。

---

## 执行边界与基线

- 第一批三项完成后，用户明确选择“后续直接做完并试玩发布，不再停批次确认”；后续按已批准范围持续完成，批次只报告进展，不重复请求确认。当前分支与测试先行方式保持。

- 仓库根目录：`/Users/lucas/Documents/ChatGPT/快小游项目/moyu-master-github`。后文命令均在此运行。
- 保留 `feature/20261114/office-paper-ui` 当前分支，不新建 worktree、不 push、不归档。`openspec/changes/ecs-public-playtest/` 与 `outputs/` 为既有未跟踪工作，不删除、不批量暂存、不纳入发布。
- 需求事实源：`openspec/changes/ripple-office-progression/specs/progressive-office/spec.md`；技术设计：本文件 YAML 所指文档。以下七组一一对应原 `tasks.md` 的 1.1、1.2、2.1、2.2、2.3、3.1、3.2。
- 2026-11-16 主流程已验证基线：`npm test` 178/178 通过，`npm run build` 通过；系统 `python3` 缺 `cv2`。这些是基线结果，不能作为改动后的通过证据。
- 编码前阅读所在函数及相似测试；不叠加内部重复校验、不提前抽象、不增加运行依赖。下面每个编号步骤为一个独立动作；较大组按列出的红绿小循环完成，不积攒到最后才验证。
- 每组通过后自查并仅暂存该组实际变更，使用中文功能提交；不要 `git add .`。若用户确认的执行方式要求不同提交节奏，以其指示为准。只有完成实际验收才勾选对应 OpenSpec 任务。

## 任务 1：共享布局、寻路和联合预测（1.1）

**依赖：** 无。后续所有空间相关改动依赖本组。

**文件：**

- 新增 `src/office-layout.js`。
- 修改 `src/engine.js`：顶部座位/网格/寻路、`sendToMeeting`、`nearestAisle`、`schedulePatrol`、`soundVantage`、`investigate`、Game 构造与所有移动调用。
- 新增 `tests/office-layout.test.js`；修改 `tests/natural-patrol.test.js`、`tests/sound-source.test.js`、`tests/office-events.test.js`；按真实受影响场景调整 `tests/engine.test.js`、`tests/boundaries.test.js`。

**红绿循环 A：布局与初始角色**

1. 在 `office-layout.test.js` 写表驱动测试：六关工位数 `[8,8,12,12,16,16]`；座位 id 连续、坐标唯一；玩家与 NPC 初始座位都有效且不重复；NPC 数仍为各关配置值。测试旧 `seats`、`nodes` 和无第三参数的 `pathBetween(a,b)` 仍表示原 12 座布局。
2. 运行 `node --test tests/office-layout.test.js`，确认因缺少布局能力/当前所有关卡均为 12 座而失败，记录具体断言。
3. 实现 `createOfficeLayout(seatCount)`，返回可 `structuredClone` 的纯数据：`seats`、`desks`、`xs`、`ys`、`nodes`、`patrolStops`、边界出口、局部比例。不要把函数塞进会被预测克隆的布局。使用下表；桌组中心 x 为 210／500，纵道 x 为 65／355／655，左右座位偏移为 `45 * scale`。

   | 工位数 | 座位 y | 横道 y | scale |
   |---|---|---|---|
   | 8 | 360、680 | 145、465、785 | 1 |
   | 12 | 280、515、750 | 115、350、585、820 | 1 |
   | 16 | 240、420、600、780 | 105、284、464、644、824 | 0.8 |

4. Game 按关卡建立 `this.layout`；玩家保留 7 号零基 id 偏好。NPC 先过滤 `[0,3,8,10,4,1,11]` 的无效/占用座位，再从当前有效空座补足，不先截断再过滤。检查者初始过道、节点编号和入场队列从布局生成，12 座保持旧位置。每个检查者携带当前布局。
5. 重跑新增测试，确认布局和兼容断言通过。

**红绿循环 B：可达性与路线**

6. 对三档布局的所有座位对写路线测试：终点正确，每段水平或垂直且坐标有限，路线不穿布局桌面矩形；覆盖移动中改目标、座位到过道及出口。以实际桌面占地检测线段相交，不能仅断言路径点位于节点集。
7. 运行新增测试并确认当前固定 `ys`、邻接上限 `id<9` 或默认座位引用导致失败。
8. 将寻路数据移至布局模块；保留 `engine.js` 的兼容导出和 `pathBetween(a,b,layout=默认12座布局)`。Game 内 `empty`、`perform`、`moveTo`、金椅候选距离、NPC 移动一律显式传 `this.layout`。横道邻接由行数计算；座位通过桌前横道进出，不能全局替换默认数组来切图。
9. 重跑布局和引擎测试，确认无穿桌；同时存在 8 座和 16 座 Game，交替移动和推进，断言两者布局、路线及默认 12 座导出互不变化。

**红绿循环 C：检查者与声场**

10. 在巡视、声音和事件测试中补三档参数化场景：有效桌组巡视覆盖、两人起点错开且不重复预留区域；声音记忆保持旧座位；会议从当前边界步行离场、返回；联合十秒预测逐采样点的位置/停留/隐藏状态与真实推进一致。
11. 运行对应测试确认失败；预测前后比较完整检查者及共享声场，断言预测未消费真实随机 seed，克隆后的检查者仍共用同一克隆声场。
12. 将巡逻顺序按当前桌组生成；保留 12 座既有顺序和种子分支，其他布局覆盖全部有效桌组并错开起点。`soundVantage` 的候选点从当前过道和桌组生成；`nearestAisle`、会议出口及所有调查路径使用检查者布局。保留速度 62、冷却、听觉证据和原观察规则。
13. 重跑本组验收，再检查生产 Game 路径中没有遗漏的默认布局依赖；不为后期地图稀疏巡视加入全知追踪或提速。

**组验收命令：**

```bash
node --test tests/office-layout.test.js tests/engine.test.js tests/boundaries.test.js tests/natural-patrol.test.js tests/sound-source.test.js tests/office-events.test.js
npm run build
git diff --check
```

预期全部通过；提交建议：`新增分关卡办公室布局与寻路`。

## 任务 2：家具、人物锚点与 DOM 座位（1.2）

**依赖：** 任务 1。

**文件：** 修改 `src/render.js`、`src/app.js`、`index.html`；新增 `tests/office-layout-ui.test.js`；修改 `tests/render-motion.test.js`、`tests/render-dance.test.js`。只在实测点击范围确实需要调整时修改 `style.css` 的 `.seat-hit`。

1. 先写失败测试：同一 Renderer 依次画 8→16→12 座会重建背景；贴图和无贴图回退都按桌组绘制；人物、椅子、坐姿、收椅共用脚部/座位锚点，16 座局部比例为 0.8；HUD 不参与缩放。
2. 在 UI 测试沿用 `audio-app.test.js`、`save-migration.test.js` 的生产片段 VM 方式，使用最小 DOM stub 执行真实座位同步逻辑：按钮数量、中心位置、aria 标签与当前布局逐一对应，8→16→8 切换清掉旧按钮，点击实际调用对应 `moveTo(id)`。不写只检查源码字符串的功能测试。
3. 运行 `node --test tests/office-layout-ui.test.js tests/render-motion.test.js tests/render-dance.test.js`，确认固定背景/固定 12 按钮导致失败。
4. `Renderer.draw` 切换 Game/布局时同步背景，`loadArt` 完成后使用当前布局重建，不回退默认 12 座。改造 `paintedOffice` 和 `drawOffice` 两条路径的桌组、地毯、侧门、道路。人物和家具围绕相同锚点做局部缩放；覆盖 `paintedPerson`、`seatedPerson`、`person`、`tuckedChair`、舞蹈淡入淡出坐姿与 NPC/检查者。现有 `chair()` 资产脚点到座位 y+40，坐姿角色脚点为 y+16，必须按各自原锚点一起缩放，不能混为同一脚点；16 座横道在座位 y+44，核对椅脚与下一排桌面的间隙。文字、图标、倒计时保持可读尺寸，不能整体缩放 Canvas 或控制区。
5. app 移除运行路径的全局 `seats` import，在新局/重来时依据 `g.layout.seats` 同步按钮，初始化仍能正确生成当前局按钮；`updateUI` 使用座位 id 而非旧数组假设。将 `index.html` 的静态“六组办公桌和十二个工位”改为中性描述，并由 app 更新当前工位数量。
6. 重跑测试；在 375×667 依次进入第 2、4、6 关，逐座点击所有可用空座并观察抵达位置；被占用座仍应禁用。检查 16 座最下排、两边过道、坐下/站起/蹦迪收椅，没有站在椅背、穿桌或点偏。
7. 记录普通/段子/跑酷/蹦迪状态下“一键工作”的 `getBoundingClientRect()`，要求入口可见、顶部位置在相同布局下不变；返回关卡选择再重来，确认按钮数不叠加。若需微调，仅调已定布局的排距、锚点、点击区，不引入滚动镜头。

**组验收命令：** `node --test tests/office-layout-ui.test.js tests/render-motion.test.js tests/render-dance.test.js tests/scene-fade.test.js`、`npm run build`、`git diff --check`。

预期自动断言通过且三档手机逐座检查通过；提交建议：`适配办公室家具人物与座位点击`。

## 任务 3：多金椅独立生命周期（2.1）

**依赖：** 任务 1；任务 2 可先完成后合入本组。

**文件：** 修改 `src/engine.js`；新增 `tests/golden-seats.test.js`；同步使用单金椅夹具的 `tests/engine.test.js`、`tests/natural-patrol.test.js`、`tests/greeting.test.js`、`tests/risk-loop.test.js`、`tests/runner.test.js`、`tests/joke-feed.test.js`、`tests/render-dance.test.js`。同步 `src/render.js`、`src/app.js`、`dev/build-interaction-review.mjs` 中既有单对象读写，使本组完成时运行链路可用；任务 4 再补专门的收益/显示验收。

1. 写失败测试：第 1 关上限 1，第 2～6 关上限 2；9.99 秒无金椅，第 10 秒有空位则补齐；每把初始 `left=18`；每秒检查缺口；暂停跨过刷新/到期点不推进。用足够分散的空位、同桌仅有空位、无空位、已存在金椅、占用金椅构造候选场景。
2. 运行 `node --test tests/golden-seats.test.js`，确认单对象/25 秒刷新/动态延长生命周期与新契约不符。
3. 将 `special` 改为 `specials=[]`。刷新只选有效空座，排除已存在金椅；存在其他桌组候选时优先分散，再按真实寻路时间加收手预算优先选择附近机会。持续时间固定 18 秒，不沿用原 `Math.max(18, travel+12)`；删除旧测试对额外动态时长的依赖，保留“附近存在可达机会时优先附近”的测试。
4. 在模拟 tick 内独立扣减和移除每把到期金椅，按第 10 秒起每秒尝试补到上限；占用后继续原倒计时，补刷不覆盖占用座。验证一把到期时另一把座位和剩余时间不变，无空位时等待下个检查时机。
5. 完成全部单对象迁移：背景金光、椅子底/前层、收椅、角色 gold 标记、人物后倒计时、玩法倍率、剩余时间、座位 aria 标签、开发预览的设置/过期按钮/状态输出。不要保留 `special` 双写兼容层；旧默认 12 座空间导出兼容与旧金椅内部字段兼容是两件事。
6. 运行 `rg -n '\bspecial\b' src tests dev`，逐条检查结果；所有游戏金椅读写应改成 `specials`，不应遗留无效旧测试夹具。运行下方测试后提交。

**组验收命令：**

```bash
node --test tests/golden-seats.test.js tests/engine.test.js tests/natural-patrol.test.js tests/greeting.test.js tests/risk-loop.test.js tests/runner.test.js tests/joke-feed.test.js tests/render-dance.test.js
npm run build
git diff --check
```

预期单椅/双椅/占用/暂停/补刷均通过；提交建议：`支持独立过期与补刷的多金椅`。

## 任务 4：收益积分和每把金椅反馈（2.2）

**依赖：** 任务 2、3。

**文件：** 修改 `src/engine.js` 的 `tick` 收益段、`src/render.js`、`src/app.js`；扩充 `tests/golden-seats.test.js`、`tests/risk-loop.test.js`、`tests/runner.test.js`、`tests/joke-feed.test.js`、`tests/office-layout-ui.test.js`、`tests/render-dance.test.js`。仅在离散计分时刻无法从现有返回值判定时最小修改 `src/runner.js`。

1. 写收益失败断言：坐任一有效金椅，段子/蹦迪基础收益和连续奖金均为普通座位两倍；存在另一把金椅不变四倍；普通座无加成。覆盖 `left=.005` 而 `dt=.02` 的到期时间片，用普通收益加真实有效区间收益作期望。
2. 补跑酷离散奖励边界：金椅有效区间内计分则奖励及对应待收奖金 ×2，到期后的区间不加成；使用既有小游戏推进能力在到期边界分段，保留离散金币含义，不把一次得分按时长摊成小数。
3. 补移动与收手用例：从一把移到另一把，收手按既有规则结算、途中无收益、抵达后使用目标椅剩余时间；NPC 最后一秒让座保护、首次警告和抢座行为不回退。
4. 运行相关测试确认上述收益边界失败后，实现最小修正：在收入片开始获取玩家座位命中的唯一有效椅，计算该片有效时长；连续奖金分段积分与基础收益共用倍率依据。跑酷复用既有推进及分数差值，分别推进有效加倍区间和普通区间，不新增计分事件接口或改变小游戏玩法。
5. 写并执行两把金椅显示测试：两处金光和徽章分别对应该座位，现有金币图标、×2、向上取整秒数一致；非当前椅不影响当前按钮倍率；仅移除到期者；人物坐姿和蹦迪收椅从集合命中当前座位。
6. 修正任务 3 迁移后的显示细节，保持金光在座位背景、倒计时在人物之后；不新增常驻说明条。测试通过后在手机真画面核对两把椅子及按钮/aria 倍率。

**组验收命令：** `node --test tests/golden-seats.test.js tests/risk-loop.test.js tests/runner.test.js tests/joke-feed.test.js tests/greeting.test.js tests/office-layout-ui.test.js tests/render-dance.test.js`、`npm run build`、`git diff --check`。

预期连续/离散收益边界和双椅反馈均通过；提交建议：`统一多金椅收益倍率与显示`。

## 任务 5：真实半径的轻薄水波纹（2.3）

**依赖：** 任务 2；不依赖金椅收益实现。

**文件：** 修改 `src/render.js` 的 `noiseRange`、必要绘制层顺序；扩充 `tests/noise-visual.test.js`、`tests/render-dance.test.js`、`tests/render-motion.test.js`。`src/app.js` 的模拟时间契约保持不变，除非验收发现入口未统一。

1. 扩充 Canvas recorder，真实记录径向渐变、路径半径、线宽、透明度和层顺序。先测 active/radius 门槛；游戏三层、蹦迪五层内部波纹；外缘完整连续且恰为真实半径；所有内部弧和高光都不越界；边缘线宽 1.5～2.2，不再出现原 9/5.5 粗描边。
2. 对相同 `source`、相同 `g.elapsed` 重画要求完全一致；推进 elapsed 后要求内部波纹半径/透明度变化。序列化 Game 前后并监测随机数，断言渲染不改模拟、不取每帧随机数；不要用快照像素代替真实半径断言。
3. 运行 `node --test tests/noise-visual.test.js tests/render-dance.test.js`，确认旧粗圈和静态内部样式失败。
4. 原生 Canvas 绘制透明径向波面、约 1.8 世界单位连续细边及少量移动短高光；三/五层相位由 `time` 计算，随半径向外增大并淡出，限制在 `source.radius` 内；保留游戏紫色、蹦迪暖金色。沿用真实 `active/kind/radius`，不修改 100～170／180～320 半径公式、40% 阈值、声音积累/掩护/衰减/记忆规则，不加贴图或大面积模糊。
5. 在 Game 暂停后调用多次 draw，外部绘制时间即使不同也必须使用冻结的 `g.elapsed` 产生相同波纹；继续后再推进。收手完成后当前工位 volume/radius 及进度清零，不再显示余音回落，已听见的旧位置仍会调查；打印机掩护游戏声、蹦迪仍可传出，均以真实声场为准。
6. 验证办公室声场在人物之前；蹦迪舞台上只重画玩家自己的声源与声音进度，检查者提示留在办公室层，不以检查者距离改变波纹。375×667 截图对比游戏/蹦迪范围、进度与传出线，确认最外缘看得见但不抢占人物。

**组验收命令：** `node --test tests/noise-visual.test.js tests/render-dance.test.js tests/render-motion.test.js tests/sound-source.test.js tests/office-events.test.js`、`npm run build`、`git diff --check`。

预期几何/时间/无副作用/掩护和手机对比通过；提交建议：`使用轻薄水波纹表达真实声音范围`。

## 任务 6：存档版本迁移（3.1）

**依赖：** 任务 1、3、4 的新版规则已稳定。

**文件：** 修改 `src/app.js` 的存档加载段；扩充 `tests/save-migration.test.js`，必要时扩充 `tests/audio-app.test.js`。

1. 将迁移测试的四关占位 fixture 更新为真实六关数量。先写 v5→v6 用例：解锁到 6 仍保留，旧 `clean/assisted` 最佳不导入，旧键字节不变；v6 再载入只读新键并保留新版最佳；v6 优先于 v5；损坏 v6 可回退 v5，再按既有 v4→v1 顺序回退。
2. 运行 `node --test tests/save-migration.test.js` 确认当前仍读 v5、旧最佳未隔离而失败。
3. 使用新键 `moyu-master-save-v6-ripple-office`，在现有单一存储信任边界复用字段筛选与异常处理，旧 v5 加入解锁回退链；新版本首次写空 best，不删除或回写任一旧键。不在 Game/Renderer 再校验存档。
4. 核对声音现状：当前 `src/app.js` 只有会话变量 `sound=true` 及切换，没有独立声音 localStorage 键。迁移不读写或重置当前 `sound`，新局、重来和暂停保留已有开关行为；本轮不新增跨刷新声音持久化。技术设计已据此更正，以实际现码行为为准。
5. 重跑迁移与音频测试，浏览器使用隔离测试存储分别加载旧 v5 和新 v6 存档，核对六关解锁、新 best 和旧键；不覆盖用户真实存档。切换静音→开始/重来/暂停→继续，保持当前设置。

**组验收命令：** `node --test tests/save-migration.test.js tests/audio-app.test.js tests/office-result.test.js`、`npm run build`、`git diff --check`。

预期旧进度保留、新旧成绩隔离、会话声音行为保持；提交建议：`迁移办公室新版成绩并保留解锁`。

## 任务 7：全量验收、静态包与公司开发机发布（3.2）

**依赖：** 任务 1～6 全部通过。实施开始仍以前置用户确认计划及执行方式为门槛；本计划不执行任何发布。

**文件：** 修改 `dev/build-static-site.mjs`、`package.json`、`tests/static-site.test.js`；执行后新增 `docs/superpowers/reports/2026-11-16-ripple-office-progression-verify.md`，按仓库要求更新 `README.md`、`CHANGELOG.md`，最后更新本 change 的 `tasks.md`。公司主机/目录信息只写既有私有部署资料，截图只新增本轮明确命名文件，不整理原 `outputs/`。

**红绿循环：静态资源闭包**

1. 静态打包测试先断言包含 `src/office-layout.js`，仍排除 config、点文件、历史实验、源码仓库和无关目录，运行 `node --test tests/static-site.test.js` 确认新增模块缺失导致失败。
2. 在现有 `siteFiles` 白名单增加布局模块；更新固定文件基数 `10` 为本轮真实数量，不放宽整目录复制。`package.json` 的 build 加入 `node --check src/office-layout.js`。运行测试和 `npm run build:site` 确认新增 import 在 dist 中实际存在。

**自动验证与手机试玩**

3. 执行并保存结果：

   ```bash
   npm test
   npm run build
   npm run test:art
   npm run build:site
   openspec validate ripple-office-progression --strict
   git diff --check
   ```

   预期 JS 全量、构建、静态包及 OpenSpec 通过。当前系统 Python 缺 cv2；先核查是否有既有可用图像解释器，若有仅使用该环境运行原测试。不安装新依赖、不循环安装；若仍不可运行，记录具体命令、`ModuleNotFoundError: cv2` 和未验证范围，不能写“全部测试通过”。素材未改不代表本轮美术检查已通过。
4. 使用已有本地服务，或在空闲端口运行 `npm start`，记录实际端口；用 CUA 已连接的 Chrome 打开实际本地首页和 `/dev/dance-review.html`，检查资源、素材状态和控制台。浏览器交互统一使用 CUA，不另行运行浏览器 CLI 或外部 Playwright 脚本，也不注入修改游戏内部状态。
5. 375×667 本地验收矩阵：第 2／4／6 关对应 8／12／16 座；逐个空座真实点击；自然巡视和镜子路线；两把金椅分散/入座/独立过期/暂停；段子换条及收手、跑酷跳跃及收手、蹦迪声音进度和收椅；首次警告、失败重来、菜单返回。记录控制区位置、截图及资产 ready，不能只看 Canvas 截图断言 DOM 点击通过。
6. 从开始到结果完整试玩第 5 关“老板开会”和第 6 关“打印机故障”，不通过修改金币、目标、时间或隐藏检查者伪造完整试玩；记录 seed（能读取时）、策略、结果、用时、抓包、换位、是否助力。若失败则记录实际失败并重试，评估后期巡视密度与真实通关机会；不能只跑静态场景。修正引出的缺陷后重跑受影响测试和对应试玩。
7. 通过审核后提交运行文件，记录实际运行提交 SHA；构建工作树中白名单文件必须与该提交逐项一致。报告/截图可后续独立提交，不能把文档提交 SHA 冒充运行 SHA。

**公司开发机发布与资源校验**

8. 只读核对既有私有部署记录，取得当前公司开发机的 SSH alias、站点 release 根目录、`current` 指针、当前 release 和 HTTP 基址；记录前版与相邻站点首页摘要。公开仓库历史报告没有这些参数，不能按旧前端云地址、GitHub Pages 地址或猜测主机发布。缺少资料或访问失败只阻塞发布，保留本地可审查 dist 和验收结果。
9. 由 `siteFiles(manifest)` 生成准确文件清单和每文件 SHA256，保存到临时目录；核对清单与 dist 的文件集合完全相等，并将每个 dist 文件与运行提交 `git show "$RUNTIME_SHA:$file"` 的内容摘要比较。使用下列现有构建入口获取清单，不手写过时资源数量：

   ```bash
   node --input-type=module -e 'import {readFileSync} from "node:fs"; import {siteFiles} from "./dev/build-static-site.mjs"; console.log(siteFiles(JSON.parse(readFileSync("assets/manifest.json","utf8"))).join("\n"));'
   ```

10. 从 dist 根打包，仅上传该包及必要的版本/摘要元数据到该站点新 release；核对包的本地与远端 SHA256，再解包并逐项比较远端磁盘摘要。使用既有发布命令和目录约定，不上传整个工作区，不带 `.git`、config、密钥、测试、计划、预览临时文件或部署凭证。
11. 磁盘全部匹配才按现有方式原子切换 `current`；保留旧 release 与旧指针目标。对首页、CSS、全部 JS（包括新布局模块）、manifest、每张 manifest PNG 和 dance review 页面通过实际 HTTP GET 校验状态 200 与内容 SHA256；必须下载内容比较，不能只检查 HEAD 或文件名。每项证据明确“源码提交→dist→发布包→远端磁盘→HTTP”链路。
12. 公司开发机 375×667 再验三档布局、16 座点击、双金椅、两种波纹、蹦迪/跑酷收手、暂停与重来，检查无游戏模块错误且素材 ready；复测旧进度迁移。比较相邻站点首页摘要保持一致。若资源/关键流程失败，恢复已记录的旧 current 目标并验证旧版 HTTP，不能删除旧 release 后才尝试回退。
13. 报告列出自动测试结果、art 环境缺项（若仍存在）、本地与线上试玩结果、截图、运行 SHA、实际资源数与逐项摘要结果、回退版本和访问 URL。`README.md`/`CHANGELOG.md` 只记录可公开站点信息，不泄露私有主机。完成对应 OpenSpec 勾选，确认本轮文件范围，保持分支不 push、不归档。

**最终验收：** 七项任务均有对应证据；若发布或 art 受环境限制，明确区分“本地实现通过”“未执行检查”“已验证线上”，不把成功构建当作发布成功。

## 当前需保留的事实边界

1. **实施尚未获本轮 plan-ready 确认：** 本文件只供审阅，下一步由用户确认计划和执行方式；当前不修改运行文件或勾选任务。
2. **声音行为已澄清：** 当前只有会话内声音开关，技术设计已更正；保持现有行为和当前值，不新增跨刷新存储，无需另设功能确认。
3. **美术解释器环境：** 已知系统 python3 缺 cv2，需既有可用环境或如实保留未通过项，不引入依赖修环境。
4. **发布参数：** 私有部署记录尚未在本计划阶段读取；主机/目录/访问能力需发布前验证，缺失时不得猜测。没有发现阻塞编写计划的代码问题。

## 用户验收补充：打印机音量与纸签（4.1、4.2）

保持既有分支与自主发布授权。先补失败测试：高音量完整跨越掩护、掩护期间从零积累及停机后正常听觉延迟；更新原先错误期待无声源／音量回落的测试。随后将掩护从生成速率移到可听半径计算，收手清空保持。顶部打印机缩为约60单位，状态与秒数放并排纸签，整合细进度。回归、构建与独立审查后更新原公司开发机；真实浏览器不可用时记录验证边界，不虚报试玩。
