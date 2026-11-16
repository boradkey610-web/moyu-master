# Oh My Workflow Design Handoff

- Change: preload-game-assets
- Phase: design
- Mode: compact
- Context hash: e8d9017f96401aa368d156fcc464fea7ac1f305cdad94f6f1c8a8ab214bc8cac

Generated-by: omw-handoff.sh

OpenSpec remains the canonical capability spec. This handoff is a deterministic, source-traceable context pack, not an agent-authored summary.

## openspec/changes/preload-game-assets/proposal.md

- Source: openspec/changes/preload-game-assets/proposal.md
- Lines: 1-18
- SHA256: f2a1579d3724b5e9832f3a72b8bfc23792d7d2fe5ca258ff690eff0e7d430f5f

```md
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
```

## openspec/changes/preload-game-assets/design.md

- Source: openspec/changes/preload-game-assets/design.md
- Lines: 1-11
- SHA256: 090556252abd309edbdf0cd6d28440b9f1ab42252cefc29aa709e06ac822a4f4

```md
## Context

Renderer.ready 已等待清单、运行图片及工具图标，但应用未等待便调用 menu() 和启动 RAF。

## Decisions

HTML 初始显示不依赖图片的加载页，并隐藏场景、HUD、控制和原弹层。boot() 冻结对局并等待 renderer.ready，有错误则留在加载页提供重试，无错误才显示首页、绘制完整首帧并启动唯一主循环。重试复用已有 loadArt() 和同一启动流程。不新增模块或依赖，沿用原生 HTML/CSS 和办公室风格；参考 UI 技能的加载语义，保留用户无新依赖约束。

## Verification

用可控 Promise 执行真实 boot，证明慢资源不放行、不启动时钟，失败保持阻挡，重试成功只启动一次。验证加载器等待全部图片及工具图标，保持 onload 契约。回归、构建、审查后发布公司开发机，逐项校验并保留旧版本。
```

## openspec/changes/preload-game-assets/tasks.md

- Source: openspec/changes/preload-game-assets/tasks.md
- Lines: 1-5
- SHA256: 9c058c0ca096eeff20bac681ac5b73386d9847dca8061f107082a68d61898327

```md
## 1. 首次资源加载

- [ ] 1.1 补失败测试，实现启动等待、失败阻挡及重试，复用 Renderer.ready 和 onload。
- [ ] 1.2 加入无需图片的办公室风格加载页，等待中隐藏场景与操作，适配手机。
- [ ] 1.3 完成回归、构建、独立审查及发布校验，更新公司开发机并记录验证边界。
```

## openspec/changes/preload-game-assets/specs/ready-before-entry/spec.md

- Source: openspec/changes/preload-game-assets/specs/ready-before-entry/spec.md
- Lines: 1-17
- SHA256: 316ad2e0e778f045fb46e81ce400996845d62ec0fd8118fcca21785522fa2984

```md
## ADDED Requirements

### Requirement: 资源就绪后进入

首访 SHALL 显示无需外部图片的加载页，全部运行贴图和工具图标就绪后才显示首页与启动主循环，等待期间不推进对局。

#### Scenario: 首访慢网
- **WHEN** 任一运行图片或工具图标尚未完成
- **THEN** 保持加载页，不显示未完成画面，不运行对局时钟

### Requirement: 资源失败可重试

任一必需资源失败 SHALL 保持加载页并提供重试，成功前不放行；重试成功后只启动一次循环。

#### Scenario: 失败后重新加载成功
- **WHEN** 首次加载失败，用户重试后全部成功
- **THEN** 重试期间仍阻止进入，成功后显示完整首页并启动唯一循环
```

