# Oh My Workflow Design Handoff

- Change: interactive-office-comics
- Phase: design
- Mode: compact
- Context hash: 4a3e951ac7f22a6374717e4492044a1b77872d24a9f871fbb40f6137d282d298

Generated-by: omw-handoff.sh

OpenSpec remains the canonical capability spec. This handoff is a deterministic, source-traceable context pack, not an agent-authored summary.

## openspec/changes/interactive-office-comics/proposal.md

- Source: openspec/changes/interactive-office-comics/proposal.md
- Lines: 1-22
- SHA256: 50889e48c5291608f08324ce4ecc016dbda00981ac469430900a1835acd200fc

```md
## Why

用户试玩后否定憋笑的双状态管理，已选择互动漫画。把点击直接连到职场笑点，提供轻松、可随时收手的三幕演出。

## What Changes

- 用老板画饼、六点下班、开会犯困三幕替换憋笑，点击道具触发角色与物件动画。
- 画饼三次点击逐步变大后压住老板；闹钟让同事离场、空椅转动；咖啡让同事短暂惊醒又倒下。
- 沿用基础2金币/秒，完成每幕一次额外3金币、金椅翻倍；每幕至少6秒，不连点刷奖。
- 撤掉按住/气息/笑意和失误笑声；办公室正常巡视，原收手规则不变。

## Capabilities

### New Capabilities
- `interactive-office-comics`: 三幕点击演出、一次奖励、暂停收手与原场景兼容。

### Modified Capabilities
无已归档能力。

## Impact

新增comic模拟与Canvas绘制模块，复用现有人物和办公室素材。修改engine/app/index/style、静态白名单及相关测试；删除废弃憋笑输入。无新依赖、位图或网络，不改关卡/存档/处罚。保留分支，不推送、不归档。
```

## openspec/changes/interactive-office-comics/design.md

- Source: openspec/changes/interactive-office-comics/design.md
- Lines: 1-26
- SHA256: 180a66a0a698cf9b5704607864c7f61a0266c40002af95ca1f6db724a9b30710

```md
## Context

用户明确选择三幕互动漫画替换憋笑。现有runner提供独立模拟/Canvas绘制、引擎步进和静态白名单先例；Renderer已有可复用角色、座椅和办公室素材。

## Goals / Non-Goals

Goals：点击具体道具，得到与剧情一致的分段动画；窗口保持原高度、办公室可见、随时收手。
Non-Goals：不保留憋笑资源管理或失败笑声，不加新玩法入口、巡逻预警、依赖、网络、位图和局外系统。

## Decisions

新增comic.js，沿用runner的独立模拟/绘制方式。状态只有post、clock、step、anim、phase、doneAt、reward。三幕固定循环，场景配置给出标题、提示、道具命中区和点击步数。画饼3步，每步前两段0.35秒膨胀，最终2秒落饼压住老板；下班闹钟1步、2秒演出，同事冲走椅子旋转；咖啡1步、2.6秒演出，惊醒后再睡倒。动画期间忽略新点击，完成后只发一次3金币；金椅和现有连续奖励比例叠加。每幕clock至少6秒且结果展示至少2秒后自动下一幕，避免连点刷奖。

离开玩法冻结当前幕，重入继续，不能靠重入重置已得奖场景。所有推进用Game模拟时钟，暂停、弹窗、收手和移动时不演。绘制只读。原2金币/秒、收手0.1秒、视觉暴露与处罚保留。删除holdLaugh、双条、按住监听、burstUntil声场扩展和笑声标记，恢复看段子的安静定位。

小窗口用480×128 Canvas；具体道具上方一个透明原生按钮，命中区域由同一场景配置定位，确保触摸/鼠标/Enter相同语义并有可见焦点。保留标题、简短操作提示及原控制区高度。图片复用Renderer，演出用模拟时间的位移、转动、放缩；不采用新生成的静态图片代替动画。

## Risks / Trade-offs

三个场景内容有限 → 这版用于验证点击演出是否有趣，明确三幕循环，不用不同文案伪装新内容。
小屏命中区过小 → 每个可点道具给足至少约40px点击区，图形脉冲和提示指向实物，试玩验证。
动画与办公室同时分心 → 保持下方固定窗口和一键工作，原办公室继续推进。

## Migration Plan

先模型与绘制回归，再三幕真实试玩和跑酷回归，构建只上传dist；现有开发机保留前版。当前分支不推送、不归档。
```

## openspec/changes/interactive-office-comics/tasks.md

- Source: openspec/changes/interactive-office-comics/tasks.md
- Lines: 1-8
- SHA256: ec73f07121bcc528767e5aa07beb9a4424683d6db6fdbd40a8464c87e0809efb

```md
## 1. 漫画模拟
- [ ] 1.1 先测试后实现三幕点击、演出、一次奖励、轮换与暂停收手，移除憋笑及笑声逻辑，相关回归通过。

## 2. 场景和窗口
- [ ] 2.1 复用原素材绘制三幕动画，原生道具点击支持手机与键盘，构建白名单包含新模块，绘制/输入测试通过。

## 3. 实玩交付
- [ ] 3.1 全量测试构建审查与三幕真实试玩、跑酷和手机布局回归，更新开发机并校验资源，保留分支和前版。
```

## openspec/changes/interactive-office-comics/specs/interactive-office-comics/spec.md

- Source: openspec/changes/interactive-office-comics/specs/interactive-office-comics/spec.md
- Lines: 1-30
- SHA256: 6ba8d3b411c1b633e4b7eb09f4ca15694cbb9adc2ef6f05e2494015612fc319c

```md
## Purpose

让玩家通过点击职场漫画中的具体道具触发搞笑演出，将操作与段子内容直接连接，同时保留办公室巡逻、随时收手、安静基础收益和固定小窗口，验证三幕轻松互动的实际体验。

## ADDED Requirements

### Requirement: 点击道具推动三幕漫画
系统 SHALL 提供老板画饼、六点下班和开会犯困三幕，点击饼逐步膨胀并压住老板，点闹钟使同事离场椅子旋转，点咖啡使角色惊醒后又睡倒；演完自动轮换。

#### Scenario: 画饼分段点击
- **WHEN** 玩家依次点击三次饼，等待各段演出
- **THEN** 饼逐渐变大，最终压住老板；动画中点击不跳过动作

#### Scenario: 闹钟与咖啡
- **WHEN** 玩家点击对应场景的闹钟或咖啡
- **THEN** 分别播放同事下班或短暂醒来再睡倒的动作

### Requirement: 完成奖励不能连点或重入刷取
系统 SHALL 保留基础收益，每幕完成只奖一次3金币、金椅翻倍并叠加原连续奖金；每幕至少6秒且结果停留至少2秒，离开后重入保留演出进度，不产生失败笑声。

#### Scenario: 连点与重新进入
- **WHEN** 已完成一幕后反复点按或收手重入
- **THEN** 不重复发奖、不提前跳幕，原收益与检查仍遵循原规则

### Requirement: 兼容原输入布局与暂停
系统 SHALL 支持触摸、鼠标和键盘点击道具，暂停冻结演出，办公室继续正常巡逻，控制区与一键工作保持位置一致。

#### Scenario: 暂停收手
- **WHEN** 演出中暂停或按一键工作
- **THEN** 暂停冻结画面，收手按原耗时完成并恢复活动入口，小游戏不继续发奖
```

