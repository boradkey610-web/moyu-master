# 实现说明

沿用 `Game.setActivity` 和 `updateUI` 的现有活动切换路径，移除两处按关卡判断蹦迪可用性的条件。按钮收益文案使用已有统一格式，手册同步说明第一关可用。使用已有蹦迪回归测试文件验证全部关卡可进入、准备期无收入和收手动作正常。

本次生产代码涉及 `src/engine.js`、`src/app.js`，测试涉及 `tests/render-dance.test.js`，玩法说明涉及 `README.md`。
