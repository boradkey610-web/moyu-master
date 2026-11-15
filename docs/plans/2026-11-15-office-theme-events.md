# 主题关卡 Implementation Plan

> 使用 executing-plans 按以下三个任务执行。

base-ref: ff0455cb0555ad4dd3b1c678763d4032227b97b3

**Goal:** 从四关扩为六关，增加环境机会，保留自然巡视与旧存档。
**Architecture:** 扩展共享事件时钟，复用开会队列，渲染只读取状态。
**Tech Stack:** JavaScript、Canvas、node:test，不新增依赖。

### Task 1: Event simulation
- [x] 在tests/office-events.test.js先写会议、打印机、暂停和预测失败测试。
- [x] 修改src/engine.js实现两关配置、事件时钟及开会复用，运行测试通过。

### Task 2: Presentation
- [x] 修改src/app.js、src/render.js、style.css，增加入口与环境视觉、移除星标、内容撑开任务卡；更新关卡数量断言。
- [x] 在375×667和412×915实际操作两关，检查历史成绩及事件。

### Task 3: Delivery
- [ ] npm test、npm run build:site和审查通过，记录两关实际试玩。
- [ ] 仅向公司开发机5178发布并校验资源摘要，保留旧发布。
