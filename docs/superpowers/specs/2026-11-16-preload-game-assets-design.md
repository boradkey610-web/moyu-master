---
omw_change: preload-game-assets
role: technical-design
canonical_spec: openspec
---

# 首次素材就绪后进入

变更：preload-game-assets。用户已要求自主完成并发布、后续验收，沿用当前分支及主窗口测试先行，不重复确认、不 push、不归档。

根因是已有 Renderer.ready 未用于启动顺序。初始加载页沿用办公室资料便签风格，无图片依赖；保持图片 onload 契约，避免内嵌浏览器 decode 悬挂。boot 等待所有资源，失败留在加载页可重试，成功后首页及首帧就绪才解除遮挡、启动 RAF。重试复用 loadArt，不新增运行模块或依赖，不改变玩法和声音。

通过可控 Promise 和真实加载器验证慢网、图片及图标延迟、失败、重试、唯一主循环和初始阻挡。浏览器连接不可用时记录验证边界。静态白名单文件与运行提交逐项核对，只发布原公司开发机，保留上一版。
