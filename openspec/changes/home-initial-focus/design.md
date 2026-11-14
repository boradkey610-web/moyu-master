# 根因与修复

复现确认刷新后activeElement为home-start，focus-visible=true，outline2px、offset3px，与原按钮3px描边和6px/10px阴影叠加。show微任务在menu聚焦tabIndex=-1的dialog，其余状态仍聚焦首个可用按钮。仅menu容器去掉自身outline，按钮focus-visible保留，验证初始/Tab/Enter/返回/刷新以及手机截图。
