---
change: office-soundscape
design-doc: docs/superpowers/specs/2026-11-15-office-soundscape-design.md
base-ref: 74cc118
---
# 办公室声音实施计划
> 使用executing-plans按任务执行，保持当前分支。
**Goal:** 让10秒掩护状态可持续辨认，加入分场景音乐和清晰操作音。
**Architecture:** 原生WebAudio独立模块供app统一驱动，renderer直接读取既有事件时间；无引擎变化或新依赖。
**Tech Stack:** JavaScript、Canvas2D、WebAudio、node:test。

### Task 1 打印机状态
修改src/render.js和tests/office-events.test.js。先测开始/中段/停止/暂停/下一周期秒数，再实现printerStatus并接到draw。运行事件测试和build，勾选1.1提交。
### Task 2 声音模块
新增src/audio.js及tests/audio.test.js。先写PCM有限值/动态电平、循环边界、音色区分、按手势启动、暂停/静音清短音、切换不重建、不可用降级测试并确认失败。实现原创曲谱和单Context混音，测试通过后提交1.2。
### Task 3 接入与发布
修改src/app.js、dev/build-static-site.mjs、tests/static-site.test.js。document手势解锁，frame统一同步，visibility立即挂起，原声音开关覆盖全音频；交互使用命名短音，反馈只播一次。静态白名单纳入模块，所有node测试、build:site及OpenSpec严格校验通过。代码审查后实际手机试玩所有场景、核对资源，只发布公司开发机，勾选1.3/2.1并提交。
