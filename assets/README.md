# 办公室插画素材

2026-11-07 使用内置 image_gen 生成及定向编辑，按用户提供的暖色漫画办公室参考图制作。所有文件复制到本项目，运行不依赖生成工具或外部地址。

- office：空办公室背景，浅奶油地砖、玻璃窗、沙发、植物，侧墙清空后按道路出口绘门。
- room-details：早期办公室图，仅用于侧门裁片。
- desk / chair：透明背景浅木双人桌及独立蓝灰办公椅。
- player / boss / supervisor / npc：四列三行原始角色图集，黄色玩家、深西装老板、眼镜主管、蓝衬衫同事；作为动作缺失时的回退与蹦迪素材。
- supervisor-female / idle-supervisor-female / front-steps-supervisor-female / back-steps-supervisor-female / side-steps-supervisor-female：女性主管的独立角色图集，保留暖色手绘办公室风格，用于替换原男性主管。
- idle：四列三行静止姿态；列依次玩家、老板、主管、同事；行依次右、下、上。
- back_steps / front_steps / side_steps：四列两行，列序同 idle；两行分别对应左右腿交换的接触相位，侧面统一向右，由渲染器镜像到左。背面做过定向修订，提包与文件夹保持在同一只手，不能直接整体镜像来代替反相步态。
- seated：三列两行独立坐姿，玩家办公、手机、游戏分别取首行；同事使用次行蓝色坐姿，椅背单独叠绘。

manifest.json 记录原图尺寸、透明区包围盒和头部重心锚点；画面用头部锚点与脚底对齐，避免脚步伸展造成左右抖动。四相位为接触A、经过、接触B、经过，以实际移动距离驱动；停步用 idle。生成图本身仍须逐帧目检，索引测试不能证明人体姿态正确。

生成提示的共同约束：柔和手绘手游插画、正交俯视办公室视角、完整头脚、透明背景角色、网格等分、无文字与水印、同角色衣服和配件一致。修订重点：背面两行必须露出不同脚底，侧面近腿与远腿互换，前面左右脚轮流迈出。

2026-11-07：chair-gold.png 使用内置 image_gen 编辑 chair.png，仅把蓝色软垫改为暖金色，维持同一轮廓、透明背景和深色椅脚。用于限时双倍工位，替代原大边框；空座和占座共用此素材。

## 女性主管修订版

当前生效文件位于 `assets/generated/supervisor-v7/`，以 `manifest.json` 为准。根目录早期 `*-supervisor-female.png` 保留作失败版本记录，不再被游戏加载。共享的原版人物图集没有改动。

- `poses.png`：3 列、4 行；列为站立、迈步 A、迈步 B，行为右、正面、背面、左。
- `supervisor.png`：4 列、4 行；列为迈步 A、站立、迈步 B、站立，行序同上，用于回退。
- `idle.png`：1 列、4 行；`front-steps.png`、`back-steps.png` 为 1 列、2 行。
- `side-steps.png`：2 列、2 行；列为右、左，行为两种步态。左向不再水平镜像。
- 每格 384x480；有效裁片从格内 y=50 开始、高 420，头部中心锚点 x=192。游戏人物高度仍为 98。
- `supervisor-review-dark.png`、`supervisor-review-white.png`、`supervisor-review-warm.png` 和 `supervisor-walk-review.gif` 用于边缘与动作检查；`provenance.json` 记录源图校验和、模型和处理步骤。

配置集中于 `config/image-generation.json`。`dev/generate-character.py` 固定使用 GPT-Image-2、真实图片参考和有限重试，不自动换模型；认证由宿主负责，不在仓库保存密钥。本轮实际调用的是 MyFlicker 生图服务，没有验证或使用此前提供的宛清网关。

抠图改为 OpenCV GrabCut 前景分割，加局部背景色估计、窄边缘 alpha 求解和白底颜色去污染，不使用阈值抠图后模糊 alpha 的旧方法。`dev/build-supervisor-art.py` 负责生成透明 PNG、统一尺寸和头部锚点。上下方向仅在裙摆以下交换腿部，侧面使用独立生图。`dev/animate-supervisor-arms.py` 从 v5 基础素材分离空着的左手臂，绕肩膀在两个接触相位间摆动；右向的左手臂位于躯干后方。头部和持文件夹的右手保持固定，不能再把整个上半身固定以防换手。图像测试同时验证摆臂变化与持握侧稳定，仍需实际动画目检。

生成入口示例：`python3 dev/generate-character.py --prompt-file dev/ref/supervisor-front.txt --images assets/front_steps.png <approved-reference.png>`。四方向及侧向补帧的提示文件在 `dev/ref/supervisor-*.txt`。本地验收页为 `/dev/supervisor-review.html`。测试为 `npm test`、`npm run test:art`、`npm run build`；图像测试需要 Pillow、NumPy、SciPy 和 OpenCV。
