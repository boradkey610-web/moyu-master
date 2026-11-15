# Oh My Workflow Design Handoff

- Change: office-soundscape
- Phase: design
- Mode: compact
- Context hash: 589f6e34c74cc025fcaf919526f5aef50090e0fa1a055562bd7904096c9c0035

Generated-by: omw-handoff.sh

OpenSpec remains the canonical capability spec. This handoff is a deterministic, source-traceable context pack, not an agent-authored summary.

## openspec/changes/office-soundscape/proposal.md

- Source: openspec/changes/office-soundscape/proposal.md
- Lines: 1-13
- SHA256: 797198980bb8b015461972c58ef2d199ef6f8398140969e0379672f92c234bdc

```md
## Why
打印机开始提示淡出后不清楚掩护是否继续；现有声音只有相同短蜂鸣，没有背景音乐和事件层次。用户已确认普通轻爵士、蹦迪迪斯科、打印机持续机器声与倒计时，以及暂停/后台/静音统一控制，并更新公司开发机。
## What Changes
- 打印机运转全程显示掩护剩余秒数及动画，结束明确切回待机。
- 原创电钢琴/贝斯/轻鼓办公室循环，蹦迪切迪斯科，重做点击、跳跃和到账短音。
- 复用现有声音开关；暂停、弹窗和后台停止发声，首次操作解锁音频。
## Capabilities
### New Capabilities
- `office-soundscape`: 可辨识的环境掩护状态、背景音乐与统一声音生命周期。
### Modified Capabilities
无。
## Impact
新增独立声音模块，接入app；打印机绘制、发布白名单、回归测试。无新依赖、网络服务、存档规则或检查提示。
```

## openspec/changes/office-soundscape/design.md

- Source: openspec/changes/office-soundscape/design.md
- Lines: 1-10
- SHA256: 7b1e25bf81aa3c87d13f64e20d0ad7d3b15945f0457cfd4cd4e98cdd4dd58450

```md
## Context
见proposal。现有app只有即时WebAudio蜂鸣；声音开关仅布尔值；frame已统一推进模拟与绘制；office时钟/activeUntil定义10秒掩护，无需新增状态。
## Goals / Non-Goals
Goals：持续状态可见、声音分层、循环切换自然、暂停和静音可靠。Non-Goals：不改收益/AI/关卡平衡、不播报老板危险、不引入在线音乐或新设置面板。
## Decisions
声音独立为原生WebAudio模块，原创谱面合成电钢琴/贝斯/鼓点循环。采用预生成内存PCM循环，不依赖外部音乐下载；相对逐帧调度音符可避免手机卡顿漏拍。相对音频文件无版权或资源下载负担，但音色须实测。音乐、打印机、操作音分别混音；蹦迪按活动状态切换，切工作回爵士。ctx只在操作手势创建，暂停/静音挂起并清理短音，恢复继续循环。后台通过既有visibility暂停路径立即同步。渲染复用printer和chip，持续进度/秒数根据既有模拟时间计算，不能查询检查者。
## Risks / Trade-offs
首次生成PCM可能耗时：采用16k采样率、短循环与缓存，每种只生成一次；测实际生成时间。移动浏览器可能挂起AudioContext：用户手势resume，异步失败只影响音频，不阻塞游戏。合成音色：降低音量、使用和弦/FM包络及轻打击，留试听样本并验证电平/循环边界。
## Migration Plan
保留当前分支，静态白名单加入audio模块。测试/构建/手机试玩通过后更新公司5178，保留9e083ae可回退，公网与远端不变。
```

## openspec/changes/office-soundscape/tasks.md

- Source: openspec/changes/office-soundscape/tasks.md
- Lines: 1-6
- SHA256: 48a1c9f6491c5513d7f36cb8fb06847c62ef0180fa262420c270899c3ef7b10d

```md
## 1. 实现
- [ ] 1.1 增加打印机持续掩护秒数与待机表现，事件回归验证。
- [ ] 1.2 实现原创双场景音乐、打印机循环和操作音混音，验证PCM和音频生命周期。
- [ ] 1.3 接入活动/暂停/后台/开关及收益音，更新静态白名单，完整测试构建通过。
## 2. 验收与发布
- [ ] 2.1 手机试玩打印机全周期、音乐切换和静音恢复；审查及发布资源校验通过后更新公司开发机。
```

## openspec/changes/office-soundscape/specs/office-soundscape/spec.md

- Source: openspec/changes/office-soundscape/specs/office-soundscape/spec.md
- Lines: 1-29
- SHA256: 0ca20775ea0208fa02984b23de4dc7501d07f6ad5bdd71565c64c38d2d6175bf

```md
## Purpose
让玩家持续辨认环境掩护的有效时间，并以原创办公室音乐、蹦迪音乐及机器和操作声音提升游戏氛围。声音仅反馈真实事件与操作，不预告检查者，暂停、后台和静音受统一控制，不改变玩法规则。
## ADDED Requirements
### Requirement: 打印机有效期间状态持续可辨识
系统 SHALL 在打印机运转期间持续显示掩护剩余整数秒，配合运转动画；停止后切回待机。中央起止提示仍短暂出现。
#### Scenario: 掩护开始与结束
- **WHEN** 打印机开始运转且随后停止
- **THEN** 运转全程显示倒计时和机器状态；停止移除掩护倒计时并显示待机，掩护按原10秒规则结束。
#### Scenario: 暂停事件
- **WHEN** 玩家暂停
- **THEN** 倒计时和打印动画冻结。
### Requirement: 音乐与活动匹配
系统 SHALL 在用户首次操作且声音开启后播放轻爵士办公室音乐，蹦迪期间切换为迪斯科，收手后恢复办公室音乐；不重复创建叠加循环。
#### Scenario: 活动切换
- **WHEN** 玩家进入蹦迪然后完成收手
- **THEN** 音乐切换迪斯科并在完成收手后恢复轻爵士，其他操作音可辨识。
### Requirement: 环境与操作声音
系统 SHALL 在实际打印机运转期间持续播放机器声，并使用区别于旧蜂鸣的点击、起跳、到账声音，不因检查者靠近播报。
#### Scenario: 打印机掩护声音
- **WHEN** 打印机实际运转或停止
- **THEN** 机器声同步开始或停止；视线检查、蹦迪声音规则不变。
### Requirement: 统一音频生命周期
系统 SHALL 使用现有声音开关控制全部声音；暂停、弹窗和后台挂起声音，恢复时不补播过期短音，音频不可用不阻断游戏。
#### Scenario: 静音与恢复
- **WHEN** 玩家关闭声音再开启或暂停再继续
- **THEN** 全部声音同步停止并按当前场景恢复，不叠加循环，不补播旧奖励。
#### Scenario: 后台与首次访问
- **WHEN** 首次访问或页面转后台
- **THEN** 首次操作前不自动播放；后台静音，回前台仍按暂停界面等待继续。
```

