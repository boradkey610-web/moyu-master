# Oh My Workflow Design Handoff

- Change: joke-hold-laugh
- Phase: design
- Mode: compact
- Context hash: e891f90c4fe310433448c2c424e53a8ce3148d75f3532f5a931025cb2db0e26c

Generated-by: omw-handoff.sh

OpenSpec remains the canonical capability spec. This handoff is a deterministic, source-traceable context pack, not an agent-authored summary.

## openspec/changes/joke-hold-laugh/proposal.md

- Source: openspec/changes/joke-hold-laugh/proposal.md
- Lines: 1-22
- SHA256: 2dd21ae9de34fd8348653f8bd43b754cbd33c22208c0803707185ae98f3962ae

```md
## Why

现有段子只换文字，玩家输入没有结果。用户已选择憋笑挑战：按住憋笑、松手喘气，让人物表情、奖励和失误声音形成可感知的互动。

## What Changes

- 用自动推进的短轮次取代点击换条，按住与松手控制笑意和气息。
- 用漫画人物、鼓腮、抖肩和两条图形状态展示操作结果，保留小窗口和办公室视野。
- 成功每轮额外3金币，金椅翻倍；失误产生真实座位上的短笑声，沿用闻声调查。
- 保留原基础收入、收手和先收手再换玩法流程。

## Capabilities

### New Capabilities
- `joke-hold-laugh`: 憋笑小游戏输入、状态、奖励、声音和暂停集成。

### Modified Capabilities
无。

## Impact

engine、app、index、style、render声音语义及相关测试。无新增依赖或网络，不更改目标、处罚、解锁和存档。保持当前分支，不推送和归档。
```

## openspec/changes/joke-hold-laugh/design.md

- Source: openspec/changes/joke-hold-laugh/design.md
- Lines: 1-28
- SHA256: 05e705900b820e46c5a845253618c0e2fc98783dc80dc917c5afb6a1d69c7b10

```md
## Context

段子窗口与跑酷共用固定高度的控制区，发动收入、检查和声音都由模拟时钟推进。现有声源记录座位快照，预测复制声场；必须保持这一契约。用户已选择憋笑，保留当前分支和先收手流程。

## Goals / Non-Goals

Goals：一只手可玩的按住/松手循环，图形可读的表情、笑意、气息，成功与失败有结果。
Non-Goals：不扩大窗口、不加玩法切换、不加检查者全知提示，不改基础收入、关卡目标、处罚、存档或依赖。

## Decisions

每轮1.2秒铺梗、6秒挑战、1.2秒结果后自动换条。初始笑意18/气息100；按住笑意每秒−30、气息−32，松手笑意+24、气息+50，范围0..100。笑意满或气息耗尽失败，否则到时成功。一直按住和挂机都不能刷成功奖励。

成功额外3金币，金椅翻倍且按现有连续奖励比例累计待收奖金。失败不直接扣款或抓包，只在当前座位发出一次笑声，声源强度60沿原声场衰减，仅实际听见的检查者调查该位置。不能改写已调查位置或跟踪移动中的玩家。

engine保有轮次、按住和计时状态，UI只读；所有推进随暂停和弹窗冻结。开始收手、换座、抓包及页面失焦释放按住，重新进入从新轮开始，不能靠切换刷奖。原nextJoke输入去除，Enter按住/松开与触摸同一语义，空格仍收手。指针捕获防止抬手在窗口外丢失，cancel/lost capture释放。

用内联SVG漫画表情和已有办公室风格展示，图形两侧分别笑意/气息，状态文字只提示操作。保留一键工作坐标。笑声的渲染和无障碍语义统一为笑声，不误标手柄。不引入资源加载或新模块。

## Risks / Trade-offs

按住太久和松太久都失败可能初见不懂 → 用脸红/鼓腮/喘气表情、明确两种状态和实际试玩验证。
额外奖励使低风险收益略升 → 每轮限奖一次，挂机无成功奖，保留原每秒收入。
松手丢失会卡住 → 在真实输入边界处理取消、暂停和失焦，不增加内部重复校验。

## Migration Plan

自动测试、构建、手机可见试玩后按现有开发机发布方式更新，保留前版。当前分支不推送、不归档。
```

## openspec/changes/joke-hold-laugh/tasks.md

- Source: openspec/changes/joke-hold-laugh/tasks.md
- Lines: 1-8
- SHA256: 2aab8c8ecd215ecb82e284e89468c27093734785e50ed49a0153029b4348fe61

```md
## 1. 互动模拟
- [ ] 1.1 用回归测试实现按住/松手、成功失败、暂停收手、金椅奖金和固定笑声声源，运行相关测试。

## 2. 窗口与输入
- [ ] 2.1 漫画表情、双状态条、触摸/鼠标/键盘与声音语义集成，测试取消和失焦，手机确认控制区不跳位。

## 3. 实玩与交付
- [ ] 3.1 全量测试、构建、审查和手机成功/失败/收手/跑酷回归，更新开发机并校验资源，保留分支与前版。
```

## openspec/changes/joke-hold-laugh/specs/joke-hold-laugh/spec.md

- Source: openspec/changes/joke-hold-laugh/specs/joke-hold-laugh/spec.md
- Lines: 1-38
- SHA256: 6478fecf44dc38d83b162ccc60981df2087725b7ae4dc2b40a56411ac740d47e

```md
## Purpose

把职场摸鱼中的看段子从点击翻文字变成按住憋笑、松手喘气的短轮次互动，让玩家能通过人物表情理解状态、取得小额成功奖励，并在失误时面对真实声源带来的巡逻风险。

## ADDED Requirements

### Requirement: 按住和松手影响轮次结果
系统 SHALL 自动推进段子轮次，按住降低笑意并消耗气息，松手恢复气息并增加笑意；任一状态失控失败，平衡到轮次结束成功。

#### Scenario: 交替操作成功
- **WHEN** 玩家交替按住憋笑和松手喘气，坚持到本轮结束
- **THEN** 显示成功表情并自动进入下一轮

#### Scenario: 挂机或持续按住
- **WHEN** 玩家完全不操作或整轮一直按住
- **THEN** 本轮失败，不取得成功奖励

### Requirement: 奖励和声源具有实际后果
系统 SHALL 保留原基础收入，成功额外奖励3金币且金椅翻倍；失败仅产生固定座位的短笑声，检查者按听觉范围与原巡逻逻辑响应。

#### Scenario: 成功只发一次奖励
- **WHEN** 本轮成功且结果动画仍在显示
- **THEN** 奖励只发一次，金椅与连续奖金按现有规则计算

#### Scenario: 笑声不是全知追踪
- **WHEN** 玩家笑出声后换座
- **THEN** 检查者只能调查听见的原声源，不能自动追踪新座位

### Requirement: 互动兼容暂停收手和手机布局
系统 SHALL 保持办公室可见、收手入口与控制区总高度；暂停和弹窗冻结计时，收手、取消输入、失焦释放按住，离开本玩法不继续推进或发奖。

#### Scenario: 收手不跳位
- **WHEN** 玩家在挑战中点一键工作
- **THEN** 按原耗时收手并结算，按住释放，控制区和一键工作不跳位

#### Scenario: 暂停和恢复
- **WHEN** 玩家按住时暂停、弹窗或切出页面
- **THEN** 计时冻结，按住释放，恢复后须重新按住
```

