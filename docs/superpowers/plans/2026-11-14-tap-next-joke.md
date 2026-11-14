---
change: tap-next-joke
design-doc: docs/superpowers/specs/2026-11-14-tap-next-joke.md
base-ref: f3827de
---

# 单击换段子实施计划

1. 将模型回归改为nextJoke、换条不发奖和原收益保持；运行确认旧版失败。
2. 清理engine点赞状态与方法，app仅原生click，index与CSS更新提示/箭头/卡内焦点；删除失效手势专测。
3. 全套测试、构建、审查；浏览器单击一次/两次、Enter、收手、重新进入及375×667布局，发布后再次验证。
