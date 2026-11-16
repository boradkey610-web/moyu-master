# CHANGELOG

## 2026-11-16 - 素材就绪后进入

- 加入不依赖图片的办公室风格加载页，全部贴图及道具图标就绪后才显示首页并启动循环，失败保留加载页可重试。
- 运行 `48329a6` 已更新原公司开发机，218项测试和静态构建通过，31项发布资源一致；真实浏览器验证受连接故障限制，未声称完成手机试玩。

## 2026-11-16 - 持续打印机故障表现

- 打印机放大居中、去掉常驻文字板；故障全程有卡纸动效、暖色闪灯及持续机器声，背景音乐暂时降低，停机恢复。游戏声音积累与掩护规则保持。
- 运行 `8b1d25b` 更新原公司开发机，212项自动测试及静态构建通过，31项发布资源核对一致。离线画面和音频数据已检查，真实浏览器／手机试听未完成。

## 2026-11-16 - 打印机本体居中

- 打印机回到屏幕水平正中，下方纸签居中对齐，保持原有声音规则。
- 运行 `45827f2` 已更新原公司开发机，210项测试与静态构建通过，31项资源核对一致；检查离线画面，真实浏览器连接仍不可用。

## 2026-11-16 - 打印机掩护与状态纸签

- 打印机仅掩盖游戏声传播，游戏自身音量照常积累；停机恢复当前范围，检查者仍需正常听觉延迟才调查。
- 顶部改为小打印机配并排纸签，整合状态、倒计时及细进度；同步修正无障碍描述。
- 运行提交 `9592b1b` 已更新原公司开发机，31项磁盘及HTTP资源均已核对，保留上一版。210项测试及静态构建通过；检查了375像素宽离线Canvas画面，浏览器连接异常，未补做真实试玩。

## 2026-11-15 - GitHub Pages 公网试玩

- 试玩地址：https://boradkey610-web.github.io/moyu-master/ 。无需安装或 GitHub 登录。
- 发布来源：`gh-pages` 根目录，发布提交 `3fbff51`，构建来源 `88e1bf7`；保持当前纯文本段子玩法和全部关卡开放，不修改游戏代码。
- 仅发布29项运行资源、`.nojekyll`及版本清单，没有上传源码文档、内部部署配置或仓库历史。
- 已在375×667浏览器检查首页、关卡选择、点击换段子、收手、跑酷跳跃和暂停；素材状态为ready，控制台无警告或错误。148项JavaScript测试及静态构建通过。

## 2026-11-12 17:49 GMT+8 - 55c383f9

- Site: https://moyulijin15.frontend-cloud.corp.kuaishou.com/
- Immutable version: https://moyulijin15-55c383f9.frontend-cloud.corp.kuaishou.com/
- Source game revision: `9b4319f` on `lj_step`.
- Release: independent illustrated disco background, mirror ball, crossed cyan/amber beams, floating notes, 1.3x dancer and cleaned enclosed white matte pockets. Office-to-disco fade follows the 0.8-second warmup; return follows the 1-second stop period. Inspection simulation is unchanged; inspector positions are hidden by the disco, with a fixed threat warning retained.
- Upload: 28 allowlisted runtime files from `dist/`; no credentials, generation configuration, historical experiments or unrelated files.
- Access: existing site permissions retained for signed-in Kuaishou users; not anonymous public internet access.
- Regression: `/` and `/dev/dance-review.html` both returned `passed=true` after artwork loaded; all checked JS/CSS/manifest resources returned HTTP 200, no blank page and no game-module console errors.
- Dance browser checks: full background replacement, exact half-opacity crossfade, office restoration, pause freeze, caught recovery and 28 distinct animation frames all passed on the deployed site.
- Verification: 109 JavaScript tests and 7 artwork tests passed; static build, diff checks and credential scan passed. Platform-injected security/telemetry requests remain separate from game networking.

## 2026-11-12 10:57 GMT+8 - ddc50699

- Site: https://moyulijin15.frontend-cloud.corp.kuaishou.com/
- Immutable version: https://moyulijin15-ddc50699.frontend-cloud.corp.kuaishou.com/
- Source game revision: `0a79894`.
- Release: eight-beat dance, full-scene ambient darkness, soft tapered spotlight, floating notes and chair tuck animation. Uploaded 27 allowlisted runtime files only.
- Access: all signed-in Kuaishou users; no anonymous public internet access. Updated in the site access-control console.
- Regression: passed on `/` and `/dev/dance-review.html`; loaded artwork is ready, JS/CSS/manifest requests return HTTP 200, no blank page, and level selection opens.
- Safety: no game forms or external business-data requests. The hosting platform injects SSO/security/telemetry SDKs; its localhost WebSocket warnings did not block game rendering.
- Verification: 101 JavaScript tests passed; static-release build and diff checks passed.
- Management: https://myflicker.corp.kuaishou.com/web-artifacts/detail?id=29425&tab=AccessControl
