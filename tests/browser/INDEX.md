| Case | Routes | Script |
|---|---|---|
| Deployed game, art and static resource smoke check | `/`, `/dev/dance-review.html` | `smoke.test.sh`, `scripts/site-smoke.js` |
| Production disco crossfade, full replacement, pause and catch | `/dev/dance-review.html` | `scripts/disco-game-check.js` |
| Typing drawings load and screen overlay preserves all other pixels | `/dev/game-screen-review.html` | `scripts/game-monitor-check.js` |
| 127.0.0.1:4178 | /dev/caught-review.html | 抓包演出、冻结计时、回应、罚款与助力 | scripts/caught-runtime-check.js |
| 127.0.0.1:4178 | /dev/caught-review.html | 抓包演出手机、横屏与桌面布局 | scripts/caught-layout-check.js |
| 127.0.0.1:4178 | /dev/caught-review.html | 自然巡视闻声走近后触发抓包动画和处罚 | scripts/caught-natural-check.js |
