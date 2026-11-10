# 设计稿到 UI 的落地路径

这份流程的目标是：设计稿不是“参考图”，而是能被程序稳定复现、验收、迭代的组件契约。

## 1. 设计稿输入

设计稿必须至少包含以下信息：

- 目标画布尺寸，例如 `720×920`
- 组件名，例如 `map-base`、`activity-layer`
- 状态列表，例如 `joke / game / dance`
- 视角，例如后视图
- 布局约束，例如 `2×3 工位`、`12 个座位`
- 视觉参考图，例如 `outputs/ui-mapstyle/02-layout-with-doors.png`

整页效果图只能作为风格参考，不能直接当成实现输入。

## 2. 契约文件

组件契约统一放在 [design/contract.json](../design/contract.json)。

每个组件记录：

- `id`：组件名
- `type`：`canvas` 或 `dom`
- `implementation`：实现文件
- `export`：实现函数
- `consumer`：调用方
- `designReference`：设计参考图
- `states`：组件状态
- `constraints`：布局和视觉约束

## 3. 实现映射

当前映射是：

- 地图：`drawMapBase()`
- 三种摸鱼：`drawActivity()`
- 老板视线：`drawVision()`
- HUD 和按钮：`initStickerHud()`

实现文件在 [src/components.js](../src/components.js)。

渲染层只负责调用组件，不再把设计稿整图贴进去。

## 3.1 组件生产与复检

组件不是“生成后直接使用”，必须经过四步：

1. **生成**
   - 地板单独生成纯纹理，不包含道路
   - 门、桌子、椅子、有人椅生成在同一张组件表里
   - 主角的工作、看段子、打游戏、蹦迪生成在同一张状态表里

2. **抠图**
   - 组件表使用纯绿背景
   - 用 `colorkey` 抠出透明 PNG
   - 抠图后再检查边缘是否干净

3. **一致性**
   - 同一张组件表内共享风格、描边、透视和配色
   - 主角状态表内共享同一把椅子和同一套人物造型
   - 空椅、有人椅、主角状态都来自同一套视觉语言

4. **组装复检**
   - 用真实游戏截图检查地板、门、桌子、椅子、主角是否协调
   - 检查是否出现尺寸过大、错位、风格断裂
   - 检查有人座和无人座是否区分清楚

## 4. 验收路径

每次改 UI 后必须做两类验收：

1. **行为验证**
   - `npm test`
   - `npm run build`

2. **视觉验证**
   - 用 `dev/shoot-scenes.mjs` 截取真实页面
   - 输出改前/改后对比图
   - 确认布局没有被破坏

## 5. 变更流程

1. 设计侧给出组件级设计稿和状态
2. 更新 `design/contract.json`
3. 在 `src/components.js` 实现或修改组件
4. 在 `src/render.js` 或 `src/app.js` 接入组件
5. 运行 `npm run design:check`
6. 运行 `npm test` 和 `npm run build`
7. 生成截图对比
