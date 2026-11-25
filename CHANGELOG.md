## 2026-11-25 15:16 GMT+8 — 270160ed

- 游戏：https://moyulijin15.frontend-cloud.corp.kuaishou.com/
- 固定版本：https://moyulijin15-270160ed.frontend-cloud.corp.kuaishou.com/
- 来源：`finial_ui` 运行源码 `8c8cb7e`；只上传重建并复审后的 `dist/` 72项运行文件。
- 更新：极简开屏，奶油色背景、小鱼SVG、标题和细加载条；覆盖整个视口，保留素材就绪后放行及失败重试。
- 验证：253项JS测试、15项美术检查在源码提交前通过；本次重新构建发布包，补充8种尺寸×加载/失败重试共16项版式检查，全部通过。SSO认证后70项非HTML文件SHA-256全部匹配，单个图片请求超时后复查成功；首页和蹦迪预览HTML均返回200且包含游戏结构，首页含新开屏。
- 白屏回归：未完成。宿主浏览器打开正式游戏和蹦迪预览均 `EXECUTION_TIMEOUT`，HTTP验证不等同于浏览器运行时验收。
- 访问：仍需快手SSO；未更新GitHub Pages。发布哈希基线已刷新。

## 2026-11-24 16:46 GMT+8 更新批次 — 83c7f133

- 游戏：https://moyulijin15.frontend-cloud.corp.kuaishou.com/
- 固定版本：https://moyulijin15-83c7f133.frontend-cloud.corp.kuaishou.com/
- 来源：`finial_ui` 提交 `6d664ae`；仅发布复审后的 `dist/` 72项运行文件。
- 更新：确认后的清爽玩法说明，默认三条核心提示，四组进阶规则展开收起；标题及金色确认按钮固定，内容独立滚动，保留完整规则与暂停/返回行为。
- 验证：源码253项JS测试、15项美术检查此前通过，本次重新构建与发布清单复审通过。70项非HTML资源SHA-256匹配，两张HTML返回200并包含游戏结构。线上正式游戏与蹦迪预览浏览器检查均 `passed=true`；说明页六种视口的展开收起、文字可读、固定按钮、返回及HUD冻结检查全部通过。
- 访问：需要快手SSO登录；未更新GitHub Pages。

## 2026-11-23 21:51 GMT+8 更新批次 — e4e57cad

- 游戏：https://moyulijin15.frontend-cloud.corp.kuaishou.com/
- 固定版本：https://moyulijin15-e4e57cad.frontend-cloud.corp.kuaishou.com/
- 来源：`finial_ui` 提交 `01ce31c`；仅发布复审后的 `dist/` 72项运行文件。
- 更新：已确认的奶油色暂停面板、金色继续按钮、等宽重开/关卡按钮及声音开关；暂停遮罩脱离游戏尺寸约束，修正横屏挤压。
- 验证：源码253项JS测试、15项美术检查通过；本次重新构建与发布清单检查通过。70项非HTML资源SHA-256匹配，两张HTML返回200并包含游戏结构。线上正式游戏与蹦迪预览浏览器白屏/资源检查均 `passed=true`，素材 `ready`、资源200，控制台未返回报错。暂停页完整多视口验收仍未完成。
- 访问：需要快手SSO登录；未更新GitHub Pages。

## 2026-11-23 21:19 GMT+8 更新批次 - 74a5bebf

- 游戏：https://moyulijin15.frontend-cloud.corp.kuaishou.com/
- 固定版本：https://moyulijin15-74a5bebf.frontend-cloud.corp.kuaishou.com/
- 来源：`finial_ui` 提交 `fbe9afa`；通过 PDE frontend-cloud 发布审查过的 `dist/` 72项运行文件，未上传设计稿、实验、配置或凭据。
- 更新：确认后的 GPT-Image-2 首页标题与办公插画、双列关卡选择页，以及活动/工具图标和规则圆角按钮。暂停界面的新设计稿尚未接入。
- 验证：该源码253项JS测试、15项美术检查与五视口UI交互验证已通过；本次重新构建及发布清单复审通过。SSO认证后70项非HTML文件SHA-256全部匹配，首页与蹦迪预览HTML均HTTP 200且包含游戏结构。线上原生浏览器打开两路均超时，白屏/运行时回归未完成，不能以HTTP检查代替浏览器通过结论。
- 访问：仍需快手SSO登录；未更新GitHub Pages。

## 2026-11-18 15:58 GMT+8 - 48b3f95f

## 2026-11-23 15:09 GMT+8 - b9487922

- 游戏：https://moyulijin15.frontend-cloud.corp.kuaishou.com/
- 固定版本：https://moyulijin15-b9487922.frontend-cloud.corp.kuaishou.com/
- 来源：`lj_step` 游戏提交 `5bf3a02`（合并 `b73a3ff` 蹦迪抓包演出与三类抓包弹窗布局稳定修复）；仅发布审查通过的 `dist/` 44项运行文件。
- 更新：接入跳舞抓包（蹦迪被发现→对话）演出；三类抓包弹窗（打游戏/看手机/蹦迪）对话打字与回应按钮出现时不再引起弹窗高度/位置抖动，48种场景验证 0px 偏移。
- 验证：252项JS测试、15项美术检查与构建通过；线上首页白屏/加载检查 `passed=true`；44项非HTML运行文件SHA-256与本次发布 `dist/` 一致，全部HTTP 200。HTML由平台注入SDK，通过页面回归验证代替逐字节比较。
- 访问：保持快手登录用户可访问；未更新GitHub Pages。

- 游戏：https://moyulijin15.frontend-cloud.corp.kuaishou.com/
- 固定版本：https://moyulijin15-48b3f95f.frontend-cloud.corp.kuaishou.com/
- 来源：`li_step` 游戏提交 `c200895`；仅发布审查通过的 `dist/` 46项运行文件。
- 更新：所有抓包弹窗在桌面、手机及横屏统一上下排版；看手机抓包使用被发现→对话两镜头及真实段子，保持暂停、回应、警告和罚款。
- 验证：250项JS测试、14项美术检查与构建通过；三活动四尺寸布局、游戏/手机抓包流程本地浏览器验证通过。线上首页及蹦迪预览白屏/加载检查均 passed=true；44项非HTML运行文件SHA-256一致，全部HTTP 200。HTML由平台注入SDK，通过页面回归验证。首次哈希请求遇到网络切换，分批复核已通过。
- 访问：保持快手登录用户可访问；未更新GitHub Pages。

## 2026-11-17 15:08 GMT+8 - 06da4e39

- 游戏：https://moyulijin15.frontend-cloud.corp.kuaishou.com/
- 固定版本：https://moyulijin15-06da4e39.frontend-cloud.corp.kuaishou.com/
- 来源：`li_step` 提交 `4c5aa8a`；通过 PDE frontend-cloud 更新现有站点 29425，仅上传 `dist/` 中 42 项运行文件。
- 更新：打游戏敲键盘连续帧与真实小游戏屏幕；老板和生气女主管抓包演出；横向文字、紧凑跳过按钮及手机/电脑响应式布局；修复老板声音调查未进入抓包范围的问题。演出暂停对局，保留警告与罚款。
- 验证：248 项 JS 测试、13 项素材测试、构建通过。线上 `/` 和 `/dev/dance-review.html` 白屏及素材回归均 `passed=true`；15 项抓包/打字代码、样式及素材 SHA-256 与发布包一致，HTTP 200。控制台只有平台指纹脚本的 localhost WebSocket 提示，无游戏模块错误；游戏无表单，存档留在本机。
- 访问范围：保持现有快手登录用户权限。此次没有更新 GitHub Pages。

# CHANGELOG

## 2026-11-16 - 六关按机制逐步递进

- 第一关基础巡逻，第二关随机会议，第三关打印机，第四关单金椅；第五关混合环境与双金椅并加入主管，第六关更多同事抢座。前四关单老板。
- 会议和打印独立运行、暂停和联合预测一致；自然会议等待老板返场完成，避免门口反复掉头。选关名称、说明、插图及音频已同步，v7继承旧进度并隔离成绩。
- 运行 `a8521b8` 已更新原公司开发机，232项测试、静态构建和31项资源校验通过；六关各30种子及时收手策略均通过，后四关原地贪收益均未通过。模拟与离线画面不代替真人试玩。

## 2026-11-16 - 开会通知更容易掉落

- 第二关起优先补开会通知，其次反光镜，库存和地图已有同种时不重复刷；道具在实际步行最近三个空工位中随机出现。首关、14秒首刷及22秒间隔、开会效果保持。
- 运行 `fd584ed` 更新原公司开发机，222项测试、静态构建及31项发布资源校验通过。

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
