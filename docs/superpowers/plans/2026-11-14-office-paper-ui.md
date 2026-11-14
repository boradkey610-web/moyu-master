---
change: clear-reward-noise
design-doc: docs/superpowers/specs/2026-11-14-office-paper-ui.md
base-ref: 9828350
---

# 实施计划

采用 executing-plans 执行，当前隔离分支为 feature/20261114/office-paper-ui。

1. 修改 src/render.js 的 playerStakes、noiseBadge 和 noiseLabel，同步 src/app.js 的无障碍文案与手册。补充金额和声音阈值回归。
2. 修改 src/app.js 的共享标题、结算结构及活动流水，style.css 增加工名称条与便签样式。复用原有角色和 SVG，维持弹窗暂停、焦点和操作入口。
3. 运行测试、构建、审查和浏览器验证，检查真实成功失败与小屏页面。提交运行版本并更新原开发机，验证全部运行资源和线上截图。
