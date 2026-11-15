# GitHub Pages 试玩发布验收

结论：PASS。公开地址 https://boradkey610-web.github.io/moyu-master/ ，无需安装或登录 GitHub。

## 版本和范围

- 构建来源：`88e1bf74aeb97e822b623ed7be8c59b0ed8a4d2d`。保留点击切换纯文本段子和全关卡开放，不修改游戏源码、存档或玩法。
- 发布提交：`3fbff51eea7f74ee0ba89cb52d7453b7a121a6b5`。独立无父历史的`gh-pages`分支，31个文件：29项运行资源、`.nojekyll`和`version.json`。
- 本次实际源码分支交付仅README、CHANGELOG和本报告3个文档；其余为工作流记录，不涉及新游戏能力、接口或依赖，采用轻量验证。
- Pages设置页已显示“Your site is live”，来源为`gh-pages`的根目录，默认HTTPS。发布运行记录： https://github.com/boradkey610-web/moyu-master/actions/runs/43702048753 。

## 验证

| 检查 | 结果 |
| --- | --- |
| tasks与范围 | 2项任务完成；运行源码无修改 |
| 编译与发布构建 | `npm run build:site`通过，29项白名单资源 |
| JavaScript测试 | `npm test` 148/148通过 |
| 素材测试 | 主管4项、舞蹈透明度3项通过 |
| 公开HTTP与版本 | 首页及29项运行资源全部HTTP 200，SHA256与构建及源码逐项一致；线上版本清单一致 |
| 安全与审查 | 只读发布审查通过；无源码文档、内部部署配置、私钥或凭证进入发布树 |

静态路径均相对模块或文档定位，适配`/moyu-master/`。JS、CSS、HTML和JSON的Content-Type正确。资源总量约21.9MB，首次加载速度取决于访问者网络；没有测试不同地区网络表现。

375×667浏览器实测：首页正常；4关均可选；进入第3关点击看段子，再点击两次显示第3条；一键工作返回活动选择；点击打游戏直接启动，跳跃、收手与暂停按钮可操作。素材状态为`ready`，控制台无error/warn。不以本次发布冒充全关卡玩法复测。

实际首页画面：`outputs/github-pages-live-mobile.jpg`（本地截图，不纳入静态发布）。网页保留为可直接打开的试玩页。

## 环境和边界

系统Python缺少cv2，素材测试导入失败；定位为测试解释器环境，使用本机已有离线缓存Python3.12图像工具环境重跑，7项通过，未安装或增加项目依赖。并发curl下载大素材曾达到40秒上限；完整HTTP下载校验随后全部成功，未改变发布内容。

源码保留`feature/20261114/office-paper-ui`，沿用用户已有的保留分支及暂不归档决定，不合并main、不创建PR、不删除分支。后续源码更新需要重新构建发布gh-pages，本次未增加自动发布工作流。
