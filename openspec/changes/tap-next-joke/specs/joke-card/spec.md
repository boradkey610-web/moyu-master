## ADDED Requirements

### Requirement: 单击浏览段子

游戏 SHALL 通过整张原生卡片按钮的单次点击切换下一条段子，不依赖滑动或双击。

#### Scenario: 一次点击
- **WHEN** 玩家在看段子时点击卡片一次
- **THEN** 条数恰好递增1，不发换条奖励，原基础收入保持

#### Scenario: 状态限制
- **WHEN** 游戏暂停、弹窗、玩家移动或正在收手
- **THEN** 卡片不能推进

#### Scenario: 键盘与说明
- **WHEN** 玩家用Enter激活卡片或空格收手
- **THEN** Enter换一条、空格工作，卡片不再出现上滑、双击或点赞提示
