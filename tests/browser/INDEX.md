| Case | Routes | Script |
|---|---|---|
| Loading/retry full viewport, readable content and 44px retry button at eight sizes (16 cases) | `/` | `scripts/loading-layout-check.js` |
| Home illustration, sound/guide round trips, level grid and controls at five viewports | `/` | `scripts/paper-ui-check.js` |
| Deployed game, art and static resource smoke check | `/`, `/dev/dance-review.html` | `smoke.test.sh`, `scripts/site-smoke.js` |
| Production disco crossfade, full replacement, pause and catch | `/dev/dance-review.html` | `scripts/disco-game-check.js` |
| Typing drawings load and screen overlay preserves all other pixels | `/dev/game-screen-review.html` | `scripts/game-monitor-check.js` |
| 127.0.0.1:4178 | /dev/caught-review.html | 抓包演出、冻结计时、回应、罚款与助力 | scripts/caught-runtime-check.js |
| 127.0.0.1:4178 | /dev/caught-review.html | 抓包演出手机、横屏与桌面布局 | scripts/caught-layout-check.js |
| 127.0.0.1:4178 | /dev/caught-review.html | 自然巡视闻声走近后触发抓包动画和处罚 | scripts/caught-natural-check.js |

| Published game | Verify 70 non-HTML runtime assets match release SHA-256 | scripts/caught-release-check.js |

| Phone caught game UI | /dev/caught-review.html?activity=joke | scripts/caught-phone-runtime-check.js |

| Portrait phone catch responsive UI | /dev/caught-review.html?activity=joke | scripts/caught-phone-layout-check.js |
| Phone catch UI export | /dev/caught-review.html?activity=joke | scripts/caught-phone-ui-export.js |

| All caught portrait cards | /dev/caught-review.html | scripts/all-caught-portrait-check.js |

| Dance catch first person, stable camera, pause, fines and response | /dev/caught-review.html?activity=dance | scripts/caught-dance-runtime-check.js |

| Stable dialogue typing and response layout across three activities and four sizes | /dev/caught-review.html | scripts/caught-stable-layout-check.js |
| Pause layout, stable sound switch, frozen HUD and resume/restart/levels at five sizes | / | scripts/paper-ui-check.js |
| Guide expansion, readable last topic, fixed footer and home/game return at six sizes | / | scripts/guide-ui-check.js |
