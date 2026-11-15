# Oh My Workflow Design Handoff

- Change: office-theme-events
- Phase: design
- Mode: compact
- Context hash: 612f3e354f66f70c0aa964a88d0f83122f5259356eaf4b7a8a114ad8af65a6b2

Generated-by: omw-handoff.sh

OpenSpec remains the canonical capability spec. This handoff is a deterministic, source-traceable context pack, not an agent-authored summary.

## openspec/changes/office-theme-events/proposal.md

- Source: openspec/changes/office-theme-events/proposal.md
- Lines: 1-11
- SHA256: 458b679a8ef9c8a63918492ab530275248fff5a44ef8124661bc11f9407cfd48

```md
## Why
用户确认从四关扩为六关，先做老板开会与打印机故障，通过环境机会带来真实玩法差异。同时移除主角头顶五角星。
## What Changes
增加两关及可观察环境事件，保留自然巡视、三种活动、旧存档与全关开放。只部署公司开发机。
## Capabilities
### New Capabilities
- office-events: 会议离场和打印机声音掩护。
### Modified Capabilities
无。
## Impact
引擎、绘制、选关及测试，无新依赖、网络或操作按钮。
```

## openspec/changes/office-theme-events/design.md

- Source: openspec/changes/office-theme-events/design.md
- Lines: 1-9
- SHA256: 9083636415c0ae2f8457d035d28f1a8f80ba9c4befb1bdc48ff572a6df3bab4c

```md
## Context
用户已明确确认两关方向，保持当前分支。现有检查使用soundField共享时钟，forecastAll深复制后调用同一推进逻辑。
## Decisions
第5关老板开会、主管继续巡视，90秒/360金币。首次会议在12至16秒，由本局种子偏移；第二次间隔38秒。复用现有开会道具的正常步速和最近出口路线，离场后停留12秒再走回。
第6关打印机故障，90秒/360金币。首次运转10至14秒，每24秒一次、持续10秒。仅掩护游戏的新按键声，原有调查记忆和视觉检查不变，蹦迪仍然发声。两关各两名检查者、四名同事。
事件放在advanceInspectors共享时钟中，预测与实际共用，暂停冻结，预测不消费真实随机数。会议用便笺、打印机用出纸与声波表现，不增加老板靠近警告。
新增关卡使用独立成绩下标。六关任务板允许滚动，内容决定卡片高度。去掉主角星标，保持黄色衣服识别。
## Verification
TDD覆盖会议、打印机掩护边界、旧调查与视觉、暂停、跨事件预测一致性和无污染。手机实际试玩后只更新公司开发机，保留前版。
```

## openspec/changes/office-theme-events/tasks.md

- Source: openspec/changes/office-theme-events/tasks.md
- Lines: 1-6
- SHA256: 23f16bf5c2f1d0269199d6773934c4958648ce317fa62d9a6107e636042da4b6

```md
## 1. 仿真
- [ ] 1.1 写失败测试，实现两关事件、会议复用、声音掩护与共享预测，验证旧检查规则。
## 2. 表现
- [ ] 2.1 六关任务入口与环境动画，移除星标，修复历史成绩布局并验证手机交互。
## 3. 交付
- [ ] 3.1 测试构建、两关实际试玩及审查，仅发布公司开发机，记录版本与证据。
```

## openspec/changes/office-theme-events/specs/office-events/spec.md

- Source: openspec/changes/office-theme-events/specs/office-events/spec.md
- Lines: 1-16
- SHA256: 474fec5ba815b90c63cefbb8de6a7598bc04f62162bd3a47ce6b8cf0ebd51285

```md
## ADDED Requirements
### Requirement: Meeting opportunity
系统 SHALL 在会议主题关安排老板按正常步速离场、停留及返回，主管继续巡视。
#### Scenario: Meeting starts
- **WHEN** 本局会议时刻到达
- **THEN** 老板沿道路走向出口，不瞬移、不全知追踪玩家
### Requirement: Printer cover
系统 SHALL 在打印机运转期间掩护游戏的新按键声，保留视觉检查、既有调查记忆和蹦迪声源。
#### Scenario: Game during printing
- **WHEN** 打印机运转且玩家打游戏
- **THEN** 不增加可听新按键声，已开始的调查和视觉风险继续
### Requirement: Shared event clock
系统 SHALL 让事件与检查预测共用推进逻辑，暂停冻结计时。
#### Scenario: Forecast crosses event
- **WHEN** 预测跨过环境事件开始或结束
- **THEN** 预测与实际推进一致且不污染真实状态
```
