---
omw_change: restore-text-jokes
role: technical-design
canonical_spec: openspec
---

## Context
已核对工作区干净，dfef31a是憋笑实验前的文本版本。自此到HEAD的运行差异都来自两次被用户否定的实验，没有其他待保留运行修改。

## Goals / Non-Goals
恢复用户指定交互，不重新设计；保持24条内容、首次警告奖金反馈、第四关抢座及进度。

## Decisions
按明确文件白名单恢复dfef31a的app、engine、index、style、package、静态构建与既有文本测试，删除comic.js和实验测试。其他文件及历史文档不动，不reset分支。先恢复旧测试证明当前实现不满足文本契约，再恢复运行源码，检查所有运行文件与基线字节一致。

## Risks / Trade-offs
主要风险是误带回无关代码，因此先核对完整差异，只恢复实验涉及的明确文件；以运行字节对比、全量测试和真实手机点击验证。构建恢复29运行文件，发布保留前版。
