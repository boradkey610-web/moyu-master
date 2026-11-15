# Oh My Workflow Design Handoff

- Change: restore-text-jokes
- Phase: design
- Mode: compact
- Context hash: f3de8c74788b9b983c1b226500b9ade1182e89d71d85ecd08d5537cc2f7070d4

Generated-by: omw-handoff.sh

OpenSpec remains the canonical capability spec. This handoff is a deterministic, source-traceable context pack, not an agent-authored summary.

## openspec/changes/restore-text-jokes/proposal.md

- Source: openspec/changes/restore-text-jokes/proposal.md
- Lines: 1-16
- SHA256: 5218701bdbfddb15f84301f2de930970d23a1cf0ba709b7b8fe16d28ac7abcc1

```md
## Why
用户明确要求恢复最初的纯文字、点击换段子，撤销憋笑和互动漫画两次实验。

## What Changes
- 恢复dfef31a的文本卡片、24条段子、一次点击下一条。
- 恢复原2金币/秒与连摸、金椅规则，不发点击奖励。
- 删除漫画模块与对应运行白名单，保留关卡、巡逻、移动和其他已有改动。

## Capabilities
### New Capabilities
- `text-joke-feed`: 恢复既有纯文本点击换条契约。
### Modified Capabilities
无已归档规格。

## Impact
仅恢复两次实验涉及的运行与测试文件，历史文档保留。无新玩法、依赖、接口、存档变化；当前分支保留，不推送、不归档。
```

## openspec/changes/restore-text-jokes/design.md

- Source: openspec/changes/restore-text-jokes/design.md
- Lines: 1-11
- SHA256: 221b5b44117aaf33f6ccb1d9c2869d2b99d1fcbdda510ac912697a410a004e8f

```md
## Context
已核对工作区干净，dfef31a是憋笑实验前的文本版本。自此到HEAD的运行差异都来自两次被用户否定的实验，没有其他待保留运行修改。

## Goals / Non-Goals
恢复用户指定交互，不重新设计；保持24条内容、首次警告奖金反馈、第四关抢座及进度。

## Decisions
按明确文件白名单恢复dfef31a的app、engine、index、style、package、静态构建与既有文本测试，删除comic.js和实验测试。其他文件及历史文档不动，不reset分支。先恢复旧测试证明当前实现不满足文本契约，再恢复运行源码，检查所有运行文件与基线字节一致。

## Risks / Trade-offs
主要风险是误带回无关代码，因此先核对完整差异，只恢复实验涉及的明确文件；以运行字节对比、全量测试和真实手机点击验证。构建恢复29运行文件，发布保留前版。
```

## openspec/changes/restore-text-jokes/tasks.md

- Source: openspec/changes/restore-text-jokes/tasks.md
- Lines: 1-6
- SHA256: 81972e992b13c9e2927d6011d3fab0b3796f0b3e1cfe5f583f5a52599bce0e6c

```md
## 1. 恢复
- [ ] 1.1 恢复旧测试确认失败，再恢复指定运行文件并删除实验模块；全量测试构建及基线字节一致。
## 2. 核验
- [ ] 2.1 审查恢复范围，手机实际点击多条、收手重入及布局核验。
## 3. 发布
- [ ] 3.1 更新开发机，校验29资源并复验文本交互，保留分支和前版。
```

## openspec/changes/restore-text-jokes/specs/text-joke-feed/spec.md

- Source: openspec/changes/restore-text-jokes/specs/text-joke-feed/spec.md
- Lines: 1-14
- SHA256: d9f4dfbbab5aa343304a10b95904bdc2192c19194380c65eacf70e615235da80

```md
## Purpose
恢复职场摸鱼游戏中简洁的纯文字段子窗口，玩家通过一次点击切换下一条内容，保留安静摸鱼的基础收益与随时收手流程，并确保被撤销的动画、资源条及点击奖励不再出现在运行版本。

## ADDED Requirements
### Requirement: 纯文本点击换条
系统 SHALL 展示纯文字段子，一次点击换下一条，不要求按住、不播放漫画，不为点击额外发奖。
#### Scenario: 连续点击
- **WHEN** 玩家点击段子卡片
- **THEN** 每次前进一条，原基础收入和金椅、连摸规则保持
### Requirement: 原收手与暂停行为
系统 SHALL 保留老板巡逻、暂停冻结和一键工作；重新进入段子保留当前条数。
#### Scenario: 收手重入
- **WHEN** 玩家收手后再进入看段子
- **THEN** 当前条数保留，底部布局和一键工作位置不跳动
```

