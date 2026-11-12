# 摸鱼大师

暖色漫画办公室中的竖屏摸鱼小游戏。原生 JavaScript + Canvas 2D，无第三方运行时依赖。

## 启动

安装 Node.js 22 或以上后，在本目录运行：

```sh
npm start
```

打开 http://127.0.0.1:4178 。浏览器需要 JavaScript，不能直接双击 index.html（ES modules 需 HTTP）。手机样式自动适配；当前服务只监听本机，不对局域网开放。

## 玩法

- 选择看段子/打游戏/蹦迪：每秒2/3/6金币，蹦迪第三关解锁；启动音箱需要0.8秒。
- 收手分别需要0.1/0.5/1秒；期间仍可能被抓。空格一键工作，数字1/2/3切活动，Esc暂停。
- 点击空椅子换工位，移动不赚钱；路过检查者用头顶气泡打招呼，不打断移动。
- 连续摸鱼满3/6/9秒，额外奖励升至20%/40%/60%；切玩法保留连摸，安全工作或换座才结算，被抓会丢失未结算奖金。
- 段子无声，游戏缓慢积累噪声，蹦迪更吵。附近检查者听见后调查当时的工位，换座不会全知追踪。感叹号、声浪、目标工位与检查倒计时提示风险。
- 每局首次抓包仅警告，三种活动有不同台词。后续每次扣50，负余额失败。
- 反光镜显示所有在场检查者未来10秒路线与停留点。开会通知使一人步行离场，离场后10秒返回。
- 金色工位基础持续18秒，收益与连摸奖金×2；道具坐下拾取。空库存按钮置灰，反光镜生效时显示剩余秒数。
- 四关目标90/170/400/440，限时60/75/90/90秒。达标立即胜利。
- 本地保存关卡解锁、无助力与助力最佳成绩。浏览器存储不可用时仍可玩。

## 首版边界

这是可玩的浏览器版本。奖励入口明确标注为“测试奖励”，没有接入真实广告、账户或付费服务。没有发布到游戏CDN。场景、桌椅和角色采用本地插画素材，保留向量回退；参考提供图片的布局和暖色风格。

`src/engine.js` 管理关卡、收益、巡查、声源、道具和双倍参数；`src/render.js` 负责绘画；`src/app.js` 管理UI和存档。金椅首次10秒出现，之后每25秒尝试刷新，时长包含可达性保障；道具首次14秒出现，之后每22秒尝试刷新。

## 验证

```sh
npm test
npm run build
```

`build` 是无打包项目的语法检查。测试覆盖收入、连摸结算、收手、首次警告、罚款、冻结、联合预测、独立声源与待查记忆、双倍、道路最短路、占座竞争、存档迁移和绘制回归。

## 静态站发布包

运行 `npm run build:site` 生成 `dist/`。发布包仅包含首页、样式、四个运行模块、素材清单及其引用图片和蹦迪验收页，不包含仓库配置、生图配置、密钥、历史试验素材或 `DramaClip/`。

使用 MyFlicker 静态站平台部署时，先运行 `appwrite-cf whoami`，未登录则通过 `appwrite-cf login-ks` 授权；只上传经过审查的 `dist/`，不要上传整个工作目录。部署生成的本地站点配置不纳入 Git。

## 在线访问（2026-11-12）

- 游戏：https://moyulijin15.frontend-cloud.corp.kuaishou.com/
- 蹦迪预览：https://moyulijin15.frontend-cloud.corp.kuaishou.com/dev/dance-review.html
- 当前固定版本：https://moyulijin15-55c383f9.frontend-cloud.corp.kuaishou.com/
- 访问范围：所有已登录的快手用户；这是公司站点，不是匿名公网地址。
- 权限管理：https://myflicker.corp.kuaishou.com/web-artifacts/detail?id=29425&tab=AccessControl
- 更新：在 SSO 已登录的前提下，运行 `npm run build:site`，复审 `dist/` 后通过 `npx -y --registry https://npm.corp.kuaishou.com/ @codeflicker/frontend-cloud-cli@latest deploy --dir dist` 上传。
- 浏览器回归：打开游戏或预览页，获得当前浏览器的 tab ID 后运行 `bash tests/browser/smoke.test.sh <tab-id>`；检查脚本结果 `passed=true`，并检查控制台和网络结果。

首次上线已验证首页、关卡选择、全部素材加载及蹦迪预览；部署记录详见 `CHANGELOG.md`。

## 迪厅版部署（2026-11-12 17:49 GMT+8）

已发布 `lj_step` 的游戏提交 `9b4319f`，固定版本为 `55c383f9`，游戏分享地址保持 https://moyulijin15.frontend-cloud.corp.kuaishou.com/ 。快手同事登录后可直接玩，蹦迪第三关解锁；可通过在线蹦迪验收页直接观察效果。

蹦迪切换为独立迪厅背景，角色放大至 1.3 倍，扶帽舞姿白底空隙已清理。准备期 0.8 秒渐入，收手期 1 秒渐回；暂停冻结动画，被抓恢复办公室。检查规则不变，迪厅遮挡检查者的位置，但保留固定风险提醒。

此次部署上传 28 个运行文件；109 项 JavaScript 测试、7 项素材测试及线上游戏/蹦迪浏览器回归通过。线上像素检查确认完整背景替换、渐变、办公室恢复与全部 28 帧正常。生产渲染在 `src/disco.js`，素材清理在 `dev/clean-dance-matte.py`，回归脚本在 `tests/browser/scripts/disco-game-check.js`。
