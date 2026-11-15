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
