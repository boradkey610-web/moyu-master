# Oh My Workflow Design Handoff

- Change: mechanic-level-progression
- Phase: design
- Mode: compact
- Context hash: 9607e4925bcbaab2dbfc139b31295bc8f34b2fc14abb5662f05e2d35b0d47653

Generated-by: omw-handoff.sh

OpenSpec remains the canonical capability spec. This handoff is a deterministic, source-traceable context pack, not an agent-authored summary.

## openspec/changes/mechanic-level-progression/proposal.md

- Source: openspec/changes/mechanic-level-progression/proposal.md
- Lines: 1-20
- SHA256: a53284dac6ad25d2f488a9dda6fc5c1218ccac9b961337cd13e58827fc01d656

```md
## Why

当前关卡先靠人数和目标拉开差异，会议和打印机被放在末尾，玩家缺少逐步认识机制的过程。用户希望第二关开会、第三关打印机、第四关金椅，后续混合并提高难度。

## What Changes

- 六关按巡逻基础、随机会议、打印机、金椅、混合、抢座混合排列，前四关单老板，后两关加主管，末关增加同事抢座。
- 金椅第四关起出现，第四关一把、后两关两把。开会道具仍从第二关起掉落。
- 自然会议有独立种子驱动的随机机会，首次有机会保底；会议与打印机可在混合关独立同时运行。
- 更新名称、说明、选关插图和难度目标；保留测试版所有关卡直接选择及所有摸鱼活动开放。
- 保留存档进度，隔离新规则成绩。

## Capabilities

### New Capabilities
- `mechanic-progression`: 六关逐步介绍机制并在后两关组合。

## Impact

引擎配置、环境事件、金椅门槛、抢座门槛、渲染和音频事件读取、选关内容与成绩迁移。复用现有寻路、随机、绘制和静态发布，无新依赖、接口或素材。原声音掩护/积累、正常巡逻、反光镜联合预测和首次警告保持。
```

## openspec/changes/mechanic-level-progression/design.md

- Source: openspec/changes/mechanic-level-progression/design.md
- Lines: 1-13
- SHA256: 954116f1f24a4a072f9e1329f0984e1e9551d12de7d188ed4e3e3c91ea745a6a

```md
## Decisions

保留六关及8/8/12/12/16/16座地图。选择前四关专注单机制、后两关组合；相比逐关叠满全部机制，更容易辨认本关机会。关卡配置明确 events、goldSeats、rivals，替换事件字符串和索引硬编码。初始金币目标90/170/300/360/420/480，时长60/75/90/90/90/90，按固定种子模拟结果调节目标并同步说明。

office改为独立meeting/printer子状态，允许同时存在。会议机会最早16至22秒，每次60%概率，未出现且老板在场可用时最晚第30秒给首次机会；最多两场，自然会议离场后等待12秒，后续机会32至40秒。随机源独立且与玩家位置/行为无关，正常步行离返；暂停和预测复用同一推进逻辑，预测不消耗真实随机状态。打印机仍持续10秒、间隔24秒，掩护不清音量。

前四关仅老板；第五关加主管，第六关增加同事并开启抢座。金椅第四关起，数量1/2/2，原18秒独立寿命和补刷不变。开会通知第二关起优先补缺不变。

选关内容和插图按新顺序调整，保持全关可选和三活动开放。存档升v7并继承v6及更早解锁，新旧成绩区分。

## Verification

先补机制表、随机会议、混合事件、金椅门槛、预测一致性及存档失败测试，再实现并调整旧用例的主题夹具。全回归、静态构建、六关固定30种子策略模拟和独立审查后更新原公司开发机。浏览器无法恢复时明确真实试玩缺项，不虚报手机验证。
```

## openspec/changes/mechanic-level-progression/tasks.md

- Source: openspec/changes/mechanic-level-progression/tasks.md
- Lines: 1-10
- SHA256: e9ef5bbb254c1defd0d1950c785e4bb0ce879895325532f1f6a3deda2fa59e14

```md
## 1. 六关机制与事件

- [ ] 1.1 测试先行实现逐关配置、前三关禁金椅、第四关单金椅、后两关双金椅和末关抢座。
- [ ] 1.2 实现独立随机会议与打印机共存，覆盖概率、保底、正常离返、暂停、掩护和预测一致性。
## 2. 呈现与兼容

- [ ] 2.1 调整选关名称说明及插图、渲染和音频多事件读取、v7成绩迁移；全关和三活动保持开放。
## 3. 验证和发布

- [ ] 3.1 全回归、构建、固定30种子六关模拟调参与独立审查，更新原公司开发机并记录缺项、资源校验和回退。
```

## openspec/changes/mechanic-level-progression/specs/mechanic-progression/spec.md

- Source: openspec/changes/mechanic-level-progression/specs/mechanic-progression/spec.md
- Lines: 1-41
- SHA256: 70366daa6920471acb7c360cb190a5896cf523bf1e367da79969c771edae4a8a

```md
## ADDED Requirements

### Requirement: 逐关引入机制

六关 SHALL 顺序为基础巡逻、自然会议、打印机、金椅、混合、抢座混合。前四关仅老板，后两关有主管，第六关同事抢座；所有关卡仍可直接测试，三种摸鱼活动不锁。

#### Scenario: 前四关
- **WHEN** 玩家进入前四关
- **THEN** 第一关无环境事件和金椅，第二关只有自然会议环境，第三关只有打印机环境，第四关只有金椅机制；开会通知从第二关起可拾取

### Requirement: 自然会议有随机机会

会议 SHALL 与玩家位置和活动无关，按正常速度离返并暂停时钟；首次机会有保底，老板已离场时不重复支走。后续机会有随机性，最多两场。

#### Scenario: 随机机会未触发
- **WHEN** 初始会议机会未触发且老板持续可用
- **THEN** 第30秒给予首次会议，仍须步行离场

### Requirement: 混合事件互不覆盖

后两关 SHALL 同时允许会议、打印机和金椅，会议离场时主管照常巡逻，打印机只遮盖游戏传播而不清音量。反光镜联合预测 SHALL 与实际随机事件推进一致，且不修改真实状态。

#### Scenario: 会议与打印同时发生
- **WHEN** 两种事件处于有效期
- **THEN** 会议离返与打印机持续音效/掩护各自生效，暂停冻结两者，预测复现相同行为

### Requirement: 金椅逐步开放

前三关 SHALL 不出现金椅，第四关最多一把，第五六关最多两把，沿用18秒寿命、独立补刷与双倍结算。

#### Scenario: 前三关到达刷新时间
- **WHEN** 前三关运行超过第10秒或调用刷新
- **THEN** 不生成黄金工位

### Requirement: 保留测试入口与旧进度

更新 SHALL 保留已有解锁和全部关卡可直接选择，将新规则成绩与旧规则区分。选关名称、机制说明和插图应与实际关卡一致。

#### Scenario: 旧v6存档进入
- **WHEN** 玩家加载旧版存档
- **THEN** 已有进度保留，旧成绩不参与新规则最佳用时
```

