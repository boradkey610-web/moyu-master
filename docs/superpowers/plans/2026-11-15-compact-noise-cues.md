---
change: compact-noise-cues
design-doc: docs/superpowers/specs/2026-11-15-compact-noise-cues-design.md
base-ref: 1710fb2
---
# 声音标记与范围实施计划
使用executing-plans，保持用户当前分支。
1. engine按kind计算半径，sound-source测试验证满强度及实际200距离听觉差异；先失败再通过。
2. render收拢横槽与图标、短字，noisemeter/旧手柄绘制测试覆盖，手机检查实际效果。
3. 全量测试和构建、只读审查；30运行资源严格校验，只更新公司开发机，保留前版和当前分支。
