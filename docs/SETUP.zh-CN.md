# 内容维护与本地预览

仓库：<https://github.com/mikamikasuki/mikamikasuki>

Pages：<https://mikamikasuki.github.io/mikamikasuki/>

需要 Node.js 22.15.0（CI 固定此版本）。首次运行：

```sh
npm ci
npx playwright install chromium
npm run build && npm run preview
```

打开 <http://127.0.0.1:4173/mikamika/>。完整构建与验证：

```sh
npm run verify
```

Linux 首次运行浏览器测试时使用 `npx playwright install --with-deps chromium`。

## 添加照片

把 JPEG、PNG 或 WebP 放进 `photos/<整理组>/<州代码>/`，例如 `photos/Pacific/CA/`、`photos/Eastern/NJ/`，然后 commit/push。50 州目录表见 [photo-directories.md](photo-directories.md)。分组只是整理方式，不表示州只有一个实际时区。

识别依据是两字母州代码，移动到另一整理组仍有效。一个州出现两个目录会明确报错；先合并目录。文件名支持空格、中文和混合大小写扩展名。默认封面：配置的 `cover` → `cover.*` → 自然文件名顺序。`.gitkeep`、隐藏文件、说明文件、SVG 和脚本均不作为照片。损坏图片会按州和文件名报告并跳过，其余内容继续构建。HEIC/AVIF 不支持；请先转换成已支持格式。

照片会转正方向、转换到 sRGB、清除 EXIF/GPS，并输出哈希命名 WebP：长边最多 1800px；README 缩略图 420×260。缓存键包含图片内容、焦点与处理参数，同名替换、删除和配置变化均会刷新。超出 photos 根目录的符号链接会报错；根目录内的链接也会跳过。

**公开仓库中的原图及 Git 历史也公开。只清理生成图片不能保护已经提交的原图。** 建议先在仓库外保存原件，再用以下本地导入命令清理元数据：

```sh
npm run import-photos -- --state CA --from /path/to/private/photos
```

导入前后检查照片内容本身是否适合公开。脚本没有上传接口。

## 访问状态、气泡文字与颜色

编辑 `content/travel.yaml`。此例只展示配置格式，照片文件名和地点需要替换成自己的内容：

```yaml
states:
  CA:
    visited: true
    title: California
    subtitle: "San Francisco, Los Angeles, Yosemite..."
    color: "#CAA3C2"
    cover: cover.jpg
    preview_photos:
      - cover.jpg
      - 02-coast.jpg
      - 03-city.jpg
    photo_focus:
      cover.jpg: [0.5, 0.5]
    preview_enabled: true
```

`visited: false` 优先级最高：不着色、不轮播、不发布相册照片。`true` 表示去过，无照片也计数。省略或 `null` 时，根据 `map.infer_visited_from_photos` 和有效照片推断。地图、唯一州数量、README 轮播和相册使用同一个规范化 manifest。州数量只统计 50 州；DC 在 `regions.DC` 中配置并单独显示，照片目录为 `photos/Eastern/DC/`。当前已配置 25 个州及 DC。

`cover` 选择封面；`preview_photos` 控制气泡照片及顺序；`photo_order` 控制相册顺序。`photo_focus` 是 0–1 的横/纵焦点，缩略图按焦点裁切，不拉伸。州名缩字号以保留全文，灰字按实际字宽加省略号，详情页保留全文。空灰字保持空白。默认最多三张；第四张可把 `max_photos` 设为 4。

`preview.order` 可填写 `[CA, NJ, AK]`。未列出的候选州按州代码排序。`max_states` 设为 51，涵盖全部 50 州及 DC；当前所有已访问的 25 州和 DC 都参与 README 轮播。`selection: stable` 按固定顺序播放；`daily` 按 UTC 构建日期改变起始州。每处 4 秒，当前完整一轮为 104 秒。

`preview.initial_idle_ms` 为初始停顿，默认 2000；`state_cycle_ms` 为单州完整周期，默认 4000。`phases` 集中控制高亮、进入、展开、保持、收叠、退出和恢复阶段。调整周期时也调整阶段结束时间，保留安静窗口。schema 会拒绝不合理范围和顺序。后层照片间隔 40ms 向右下有序展开，保持相同尺寸且不旋转，气泡指针底部居中，末端对准州内坐标；前层保持清晰。

没有可预览照片时只显示正常状态，不会生成空气泡。没有真实照片的已访问州使用三张模拟风景样张，上传真实照片后自动替换。

## 本地编辑器

预览服务运行后打开 <http://127.0.0.1:4173/mikamika/editor.html>。

编辑器支持访问状态、灰字、颜色、已有封面、照片顺序、州轮播顺序、预览上限、初始停顿、周期和阶段 JSON，也支持导入/导出 travel YAML。修改会立即发送到同源预览；“Preview animation” 按当前节奏播放。导出后手动替换 `content/travel.yaml`，再构建并提交。界面不会把内存预览称为已保存到 GitHub。没有 Token、账户、写入接口或匿名上传功能。新增照片仍直接放入州目录。预览只能使用当前构建已发布的照片清单；此前被 `visited: false` 排除的照片，在重新设为 true 并构建后才会出现在封面选择和照片预览中。

## 个人介绍与布局

`content/profile.yaml`：两句横幅、三行简介、用户名和 streak 时区。简介文案来自原主页快照，并不自动随年份改写。

`content/layout.json`：固定 1200×606 画布、横幅/介绍/三卡/气泡位置、字体与地图区域。README 和 Pages 共用地图路径与锚点。Pages 使用独立大地图、访问列表与相册布局；手机保留可点击地图和选择器。气泡尾部从底部正中发出，末端对准州内锚点，完整气泡随锚点移动并在边缘避让；`bubble.tail_length` 控制尾部长度。州边界来自 Census 2017，通过 us-atlas 简化并采用 Albers USA 投影；AK/HI 有独立 inset。锚点使用最大可见多边形的内点算法，不使用 bounding-box 中心。

横幅、介绍、气泡与统计卡使用圆润的 Nunito 粗体，字体按固定版本提供并采用 SIL OFL 授权。README 构建时生成字形路径，播放时不加载外部字体。Pages 使用相同字体的本地 WOFF2。默认英文内容和州名可完整显示；Nunito 不含中文字形，若改为中文介绍/州名，需更换有授权且包含这些字形的字体后构建。中文照片文件名不受影响。

## Pages 操作

悬停已访问州约 140ms 出现气泡；没有照片的已访问州使用三张柔和配色的模拟风景图片，真实照片上传后自动替换。移出后保留 250ms，可移入气泡取消关闭。点击州固定；另一州可切换；空白、关闭按钮或 Esc 解除。照片叠层和 View album 打开相册，大图可用左右键切换，Esc 返回并恢复焦点。手机使用选择器或点击地图，细小州也可通过选择器访问。相册链接 `#state=CA` 可刷新定位。

Pages 不自动弹出气泡；reduced-motion 会关闭交互动画。主题支持 light/dark/system；气泡放在根级 overlay 并限制在 viewport 内。

## 统计口径与缓存

详见 [statistics.md](statistics.md)。`GH_TOKEN`/`GITHUB_TOKEN` 只用于本地或 Actions。本地也可以使用已登录 gh 的凭据，脚本不会输出 Token。Actions 可配置 `PROFILE_TOKEN` secret，以保证公开用户数据的读取权限；未配置时先尝试工作流 Token。数据失败使用上次成功快照并标记 `stale`，从未成功时显示 `—`。公开详情能查看来源、时间和窗口。

## 部署与缓存排查

工作流响应 main 上的代码/配置/照片变化、手动触发和每日一次统计更新（12:27 UTC）。依赖与 Actions 均固定版本/提交，先运行完整验证，再一次性上传 dist 到 Pages。定时任务只更新部署产物，不创建每日机器人 commit。Pages 仓库设置应使用 **GitHub Actions**；基路径为 `/mikamikasuki/`。构建输出使用相对资源地址，README 使用绝对 Pages URL。

稳定动画地址：

- `https://mikamikasuki.github.io/mikamikasuki/assets/readme/profile-light.svg`
- `https://mikamikasuki.github.io/mikamikasuki/assets/readme/profile-dark.svg`
- 同目录 `profile-light-static.svg` / `profile-dark-static.svg`

GitHub 图片代理可能延迟显示更新。先检查 Actions 成功的 SHA，再直接检查 Pages 图片和 data.json 的构建日期；必要时在 embed 的资源 URL 增加一个新的 `?v=` 版本号。不要每分钟改变版本或承诺代理立即刷新。

`docs/profile-embed.md` 包含将来粘贴到个人主页 README 的完整片段，整幅图只有一个 Pages 链接；逐州点击在 Pages 中实现。

`preview.sample_photos_when_empty` 控制无照片时的模拟图片。每州的 `subtitle` 填写城市与地点，显示为 `Visited:`。README 只显示一行，按粗体字形实际宽度截断并以 `...` 结束；Pages 气泡最多显示两行。完整周期是 4000ms，其中 0–2000ms 出现，2000–4000ms 完全收回。模拟图片源文件位于 `assets/samples/`。

Pages 只响应悬停和点击：气泡跟随州内鼠标位置，点击后固定，Escape 或关闭按钮收回。README 自动播放。两种界面的气泡和照片叠放均使用 `src/render/motion.mjs` 的无回弹弹簧响应；后层间距为 18px / 9px（SVG 坐标），保持相同尺寸与方向。边缘避让移动气泡，尾部起点保持正中，末端保留州内坐标。横幅的逐字显示和闪烁光标同步，静态版本不显示光标。

README 气泡按 `bubble.scale: 1.18` 整体放大；说明的逻辑字号为 10.5px，照片逻辑尺寸为 132 × 82px，实际显示约 156 × 97px；三张模拟风景统一采用柔和紫、粉与灰蓝配色。

横幅高度 170px，主标题 48px；三行简介字号 19.5px、基线间隔 41px，云朵比例 1.08。统计标签与数字 16.5px，卡片高度 250px，地图区域 360×195px，评级圆与 streak 圆半径均为 44px。README 使用 100% 内容宽度；外层边距由 GitHub 决定。
