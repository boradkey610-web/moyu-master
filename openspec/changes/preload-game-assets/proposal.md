## Why

应用在 Renderer.ready 完成前显示首页和启动主循环，首访慢网时出现缺图。用户要求资源加载完再进入。

## What Changes

- 初始 HTML 显示无需外部图片的办公室风格加载页，等待中阻止交互。
- 复用 Renderer.ready，全部贴图和工具图标成功后显示完整首页、启动循环。
- 失败保留加载页并提供重试。

## Capabilities

### New Capabilities
- `ready-before-entry`: 全部素材就绪后进入，失败可重试。

## Impact

修改 src/app.js、index.html、style.css 及启动回归测试。保持 onload 加载语义、无新依赖、存档和音频手势限制，只更新公司开发机。
