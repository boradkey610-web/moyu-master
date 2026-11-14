# 全关卡试玩与同事支援单验证

- 全关卡入口不再受save.unlocked影响，保留所有原存档和成绩，顶部标明全关卡开放。
- 支援页使用便签借用清单、剩余次数、工具栏原SVG和实质disabled状态；移除旧大卡片样式与重复说明。首关明确仅玩法帮助，其余支援条件不改。
- 新增3项定向测试覆盖新/旧低进度全部start回调与成绩不变、原图标与reward入口、已持有/已加时/30秒/次数上限/首关限制。原实现2项失败，修改后132/132通过。
- build:site通过，29运行文件，轻量只读审查及独立构建/diff检查通过，无正确性或保存兼容问题。
- 本地375×667：从旧3关进度直接进入第四关；支援单254.48宽、475.64高，无内部溢出。打开帮助后时间一直01:29；借镜后剩1且已持有禁用，再借开会后剩0全部禁用，返回按钮仍可用。
- 首关帮助只显示说明且不误报可借次数。默认桌面布局亦已检查。
- 本地证据：outputs/all-levels-open-local.jpg、support-slip-mobile.jpg、support-slip-exhausted-mobile.jpg、support-slip-desktop.jpg。
- 发布：运行e3dea7c已更新开发机，29文件HTTP SHA256一致，前版保留，其他3服务首页内容不变。线上全四关开放，直接第四关进入新帮助页，借镜后剩1/已持有禁用，返回按钮有效，无内部溢出，console warn/error为空，临时视口已恢复。线上图outputs/all-levels-open-deployed.jpg与support-slip-deployed.jpg。
- 继续保留原功能分支，不推送、不归档。
