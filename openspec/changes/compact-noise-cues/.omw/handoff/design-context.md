# Oh My Workflow Design Handoff

- Change: compact-noise-cues
- Phase: design
- Mode: compact
- Context hash: df2d3577b9ed4e7ca3eb65cbbd2606c020e54010b0317e7db2730d28d19ea98d

Generated-by: omw-handoff.sh

OpenSpec remains the canonical capability spec. This handoff is a deterministic, source-traceable context pack, not an agent-authored summary.

## openspec/changes/compact-noise-cues/proposal.md

- Source: openspec/changes/compact-noise-cues/proposal.md
- Lines: 1-8
- SHA256: fcb6633c1c2b243059f2b657ecd3f44f63617dd5d2e5f96b3dda3fbdba8714ec

```md
## Why
用户认为散开的柱形/长字/手柄不好看，且游戏与蹦迪不应拥有相同听觉半径。当前两者增长率不同但共用180-320，反馈截图覆盖桌面且圈过大。
## What Changes
统一紧凑图标与横向音量槽、短状态；删除独立漂浮手柄及大柱长字，减轻范围线。游戏声音半径90-150，蹦迪180-320，仍共享动静40阈值并按既有速度增长。绘制直接沿用实际半径。
## Capabilities
既有声音反馈局部改版与数值调优，无新增能力、接口、依赖或存档字段。
## Impact
引擎半径计算、绘制及两处回归测试；只更新公司开发机，保留分支、不push、不归档。
```

## openspec/changes/compact-noise-cues/design.md

- Source: openspec/changes/compact-noise-cues/design.md
- Lines: 1-9
- SHA256: 8137bab959f477385a863538acb11c717f9c397a11c4a7a3acfc46490019c0c4

```md
## Context
原radius只看volume不区分kind；noiseMeter和noiseBadge各画一份漂浮UI，纵柱和长状态分散。用户要求界面重做、游戏与蹦迪范围实际不同。
## Decisions
半径公式按source.kind分支：游戏90+强度比例*60，蹦迪180+比例*140，比例仍是(volume-40)/60。增长、衰减、听觉资格、镜子预测、视线保持。渲染用一组贴近人物的图标+横音量槽/40刻线和“轻声/近处/外放/较响/回落/无声/掩护”，无百分比和长提示。手柄图形移动进该组；舞台音箱作为场景物件保留。范围边界淡化，游戏/蹦迪在同强度实际大小不同。
## Verification
先测半径上限和同距离实际听觉不同，再实现；原预测/掩护/暂停测试保持。手机验证横槽、顶部座位布局和游戏/蹦迪不同实际范围。测试构建和发布摘要通过后更新公司开发机。

## Workflow
同步更新旧手柄图形测试后实际共5文件（2实现+3测试），使用full验证。实现范围仍为用户要求的界面收拢和数值差异，无额外功能。
```

## openspec/changes/compact-noise-cues/tasks.md

- Source: openspec/changes/compact-noise-cues/tasks.md
- Lines: 1-4
- SHA256: bab3ec0ee1b90f2364e8bfc074b98157642e4f4eedfcf36c60f299d80a1e130e

```md
## 1. 调整
- [ ] 1.1 收拢音量UI并区分游戏/蹦迪真实听觉范围，相关回归先失败后通过。
## 2. 验收
- [ ] 2.1 手机试玩UI/不同范围/掩护及暂停，测试构建、审查和资源核验通过后更新公司开发机。
```

