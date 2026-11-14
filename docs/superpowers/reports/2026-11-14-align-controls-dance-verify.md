# 控制区对齐与蹦迪预判验证

- 用户两条要求：去除普通活动上方及下方空白、保持高度一致；蹦迪不提示有人靠近快收手。
- 蹦迪：删除discoWarning方法及draw调用；实际暴露条仅显示正在暴露。迪厅、声音、巡逻、捕获规则未改。
- 测试：旧行为在新增断言下失败；同步旧专用预警用例后129/129通过，build:site29文件成功，diff检查通过。轻量审查无需修复问题。
- 普通/跑酷共用控制区方案：375×667控制区高203.640625、work顶559.0078125，两状态相同；首行95.640625，两侧间距8。
- 320×568：控制区188.3515625、work顶460，两状态相同，游戏底边551小于568。
- 桌面：控制区234.515625、work顶763.5，两状态相同。
- 本地蹦迪实际画面无顶部主动预警条，仍显示音乐声范围和额外奖金。
- 证据：outputs/controls-aligned-normal-mobile.jpg、controls-aligned-runner-mobile.jpg、dance-no-alert-local.jpg。
- 发布：用户确认是普通和跑酷底部总高一致、一键工作不跳位。运行提交b41d22b已更新开发机；29文件HTTP SHA256一致，前版本保留，其他3个服务首页校验和不变。线上375×667两种状态控制区203.640625、work顶559.0078125完全一致；已实际切换到蹦迪，无主动预警条，warn/error为空，临时视口恢复。线上图outputs/controls-aligned-normal-deployed.jpg、controls-aligned-runner-deployed.jpg、dance-no-alert-deployed.jpg。
- 分支继续保留，不推送、不归档。
