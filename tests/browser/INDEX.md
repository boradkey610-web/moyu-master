| Case | Routes | Script |
|---|---|---|
| Deployed game, art and static resource smoke check | `/`, `/dev/dance-review.html` | `smoke.test.sh`, `scripts/site-smoke.js` |
| Production disco crossfade, full replacement, pause and catch | `/dev/dance-review.html` | `scripts/disco-game-check.js` |
| Typing drawings load and screen overlay preserves all other pixels | `/dev/game-screen-review.html` | `scripts/game-monitor-check.js` |
| 127.0.0.1:4178 | /dev/caught-review.html | 抓包演出、冻结计时、回应、罚款与助力 | scripts/caught-runtime-check.js |
| 127.0.0.1:4178 | /dev/caught-review.html | 抓包演出手机、横屏与桌面布局 | scripts/caught-layout-check.js |
| 127.0.0.1:4178 | /dev/caught-review.html | 自然巡视闻声走近后触发抓包动画和处罚 | scripts/caught-natural-check.js |

| Published game | Verify 44 non-HTML runtime assets match release SHA-256 | scripts/caught-release-check.js |

| Phone caught game UI | /dev/caught-review.html?activity=joke | scripts/caught-phone-runtime-check.js |

| Portrait phone catch responsive UI | /dev/caught-review.html?activity=joke | scripts/caught-phone-layout-check.js |
| Phone catch UI export | /dev/caught-review.html?activity=joke | scripts/caught-phone-ui-export.js |

| All caught portrait cards | /dev/caught-review.html | scripts/all-caught-portrait-check.js |
