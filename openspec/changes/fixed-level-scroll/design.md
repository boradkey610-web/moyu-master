## Context
当前选关整页overflow-y:auto，六关及短屏规则又设置列表flex:none。活动提示只跳过蹦迪按钮，导致打游戏按钮在蹦迪时仍显示风险。
## Decisions
外层overflow:hidden；标题和返回按钮保留flex:none；列表flex:1/min-height:0/overflow-y:auto，并隐藏标准及WebKit滚动条。移除六关和短屏旧覆盖，留出焦点轮廓与纸卡旋转边距。
活动提示以当前玩家activity和按钮活动共同决定是否查询风险，蹦迪及收手阶段不查询且不输出范围提示；引擎与其他状态不变。
## Verification
回归先失败再通过；手机尺寸实际滚动，检查标题/返回按钮坐标不变，整页scrollTop为0，仅列表scrollTop变化，六关和返回均可点击。测试构建后只更新公司5178。
