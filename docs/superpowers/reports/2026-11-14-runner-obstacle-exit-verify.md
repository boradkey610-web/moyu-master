# 障碍离场修复验证

- 两项回归先在旧实现失败，修复后通过。覆盖计分后继续左移、保持外观、完全出屏后移除，以及不重复计分。
- 完整 JavaScript 测试 124 项通过，静态构建通过。
- 只读审查无阻塞问题，独立运行 12 项 runner 测试通过。
- 正常浏览器入口实际起跳越障，收入为 4 金币。得分后的文件堆仍在角色左侧显示，随后到左边界消失，下一障碍继续接近，收入仍为 4。
- 屏幕记录为 `outputs/obstacle-after-clear.jpg` 和 `outputs/obstacle-after-left-exit.jpg`。
- 原开发机已发布运行提交 `657ea4047198eb1a5b0eef8a2830873c3eb171af`，29 个运行文件 HTTP SHA256 全部一致，本机复核新版本与 runner.js 一致。
- 线上通过正常入口起跳，越障后文件堆继续留在角色左边，随后滑出左边界。两次截图时收入均为 4 金币，确认离场过程不重复计分。
- 线上截图为 `outputs/obstacle-exit-deployed.jpg` 和 `outputs/obstacle-left-deployed.jpg`。旧版本保留，可回退。
- 本修复的修改规格依赖前一 `tap-jump-game` 变更中的规格，归档时按先主功能、后修复的顺序处理。
