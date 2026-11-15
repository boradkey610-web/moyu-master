---
omw_change: office-soundscape
role: technical-design
canonical_spec: openspec
---
# 办公室声音与持续掩护设计

需求以openspec/changes/office-soundscape/specs/office-soundscape/spec.md为准。

声音独立为src/audio.js：原生AudioContext按手势创建，原创短谱合成为16k PCM，每个循环只有一个source，独立gain控制爵士/迪斯科/打印机。软限幅、淡入淡出和轻鼓电钢琴包络避免旧纯音蜂鸣；无需运行依赖或在线下载。首次生成缓存，重复暂停不重建。

app统一向audio传递enabled/paused/mode/printer。paused覆盖弹窗和后台，首页/选关允许用户操作后播普通音乐；ctx挂起时循环冻结，短音清除，恢复无过期音。静音开关改称声音，覆盖音乐和效果。操作音按事件类型命名；到账依据反馈对象/跑酷cleared增加，不能因每帧收入反复鸣叫。音乐和机器声不读取检查者，避免危险预报。

打印机状态就近从office.activeUntil-clock推导，持续显示绿色掩护秒数/进度；停止灰色待机。中央起止通知保持原短时表现，模拟暂停冻结。

验证以纯PCM数据和AudioContext替身测生命周期，再真实浏览器手势、音乐状态、静音暂停后台、打印机完整周期。保持原检查、收益和存档。发布白名单仅新增audio.js，保留前版可回退。
