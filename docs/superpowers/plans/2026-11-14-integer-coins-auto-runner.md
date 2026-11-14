---
change: integer-coins-auto-runner
design-doc: docs/superpowers/specs/2026-11-14-integer-coins-auto-runner.md
base-ref: a70a676
---

# 实施计划

1. 先调整整数收入/差额/奖金/反馈及自动跑动用例，确认原实现失败。
2. app/render统一整数，runner移除首次点击门槛，模拟策略按障碍位置起跳。
3. 全量测试、构建、只读审查及浏览器验证，发布静态白名单并校验。
