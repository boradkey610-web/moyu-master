# 首页刷新焦点修复验证

- 根因：初始show自动focus主按钮，focus-visible命中2px灰绿outline、offset3px，与按钮本身描边阴影叠加。
- 修复：首页聚焦tabIndex=-1的dialog容器，只隐藏该容器outline；按钮键盘焦点及其他弹窗首按钮焦点保持。
- 本地真实刷新：activeElement=dialog，start focus-visible=false；按Tab后主按钮focus-visible=true，按Enter正常进入全关卡页；点击返回首页聚焦dialog。
- 132项原套件和构建通过；段子功能合并后141项测试和构建通过。只读审查通过。
- 实景：outputs/home-refresh-before.jpg、home-refresh-fixed-local.jpg。
- 运行源码：合并于3d28063已发布。线上刷新activeElement=dialog、start focus-visible=false，实际截图outputs/home-focus-fixed-deployed.jpg。
- 继续保留现有分支，不推送、不归档。
