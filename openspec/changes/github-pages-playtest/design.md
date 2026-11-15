## Context
游戏无服务端依赖，现有build:site输出29文件，资源URL相对模块定位，适合项目子路径。GitHub仓库公开且有管理权限，Pages目前关闭，连接器不提供Pages配置能力，浏览器已登录。
## Decisions
沿用现有构建白名单，gh-pages孤立分支只含dist产物、.nojekyll和版本清单。通过GitHub网页选择gh-pages根目录，保持main和当前游戏内容不变。不增加Actions工作流或新服务。后续更新通过重新构建和发布该分支完成。
## Verification
测试及构建通过，静态内容不含内部主机/文档。公开HTTP资源摘要与构建一致，375×667实际换条、收手与跑酷正常；最后记录地址、提交和证据。
