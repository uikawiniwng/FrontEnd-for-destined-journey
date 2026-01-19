# 任务：地图页设计文档（OpenSeadragon 统一方案）

创建时间：2026-01-19T19:38:31+08:00评估结果：理解深度-中｜变更范围-模块｜风险等级-中

## 目标

在现有项目中新增“地图页”，支持：

- 超大图与普通图统一加载（15MB 与 200MB）
- 静态地图缩放/平移
- 根据 `世界.位置`（文本路径）定位大概区域
- 固定地标/区域/城市标记及悬浮展示
- 基础涂画/标记编辑（玩家自由涂画）

## 统一技术方案

- **主图层**：OpenSeadragon（OSD）
  - 支持大图深度缩放、切片加载
  - 统一适配 15MB 与 200MB（均转为 DZI/IIIF）
- **标记与交互**：OSD HTML Overlay
  - 用 DOM 元素做地标标记，hover 显示信息卡
- **可编辑绘制层**：OSD + 原生Canvas
  - 轻量涂画、线条、简单形状
  - 绘制数据与地图坐标统一映射

## 一、地图资源准备

### 1. 图像切片

- **输入**：15MB 与 200MB 两套地图原图
- **输出**：DZI 或 IIIF 结构（推荐 DZI）
  - `map.dzi` + `map_files/`

#### 推荐切片工具与流程（本地离线）

> 说明：**图床直链无法在前端“在线切片”**，必须离线或服务器侧先生成切片后再上传。

**首选工具：libvips（最快、稳定）**

- 安装：
  - Windows：下载预编译包并将 `vips` 加入 PATH
  - macOS：`brew install vips`
  - Linux：`apt install libvips-tools` 或 `yum install vips`
- 生成 DZI：
  - `vips dzsave "./input/world.png" "./public/assets/maps/world-small/map" --suffix .jpg[Q=90]`
  - 输出：`map.dzi` + `map_files/`

**备选工具：Python deepzoom（易集成脚本）**

- 依赖：`pip install deepzoom`
- 生成 DZI：
  - `python -m deepzoom input/world.png --destination ./public/assets/maps/world-small --tile-size 256 --format jpg`

**备选工具：ImageMagick（跨平台）**

- 安装后执行：
  - `magick "./input/world.png" -define dz:tile-size=256 -define dz:overlap=1 -define dz:format=jpg "./public/assets/maps/world-small/map.dzi"`

**切片结果结构示例：**

```
/public/assets/maps/world-small/
  map.dzi
  map_files/
    0/0_0.jpg
    1/0_0.jpg
    ...
```

### 2. 元数据

- 记录原始图像宽高，用于坐标映射

推荐配置结构（JSON）：

```json
{
  "id": "world-map-default",
  "title": "主世界地图",
  "tileSource": "/assets/maps/world-map/map.dzi",
  "imageWidth": 12000,
  "imageHeight": 8000
}
```

## 二、世界.位置 解析与定位

### 1. 字符串格式

`世界.位置` 规则：

```
${大陆方位}-${区域/地理特征}-${国家/势力范围}-${聚落点/地标}-${具体方位/内部区域}-${详细位置}
```

### 2. 解析策略

- 以 `-` 分段解析为层级路径
- 允许缺省：后续字段为空时向上回退

建议解析函数输出：

```ts
interface WorldPositionPath {
  continent?: string; // 大陆方位
  region?: string; // 区域/地理特征
  realm?: string; // 国家/势力范围
  settlement?: string; // 聚落点/地标
  subArea?: string; // 具体方位/内部区域
  detail?: string; // 详细位置
}
```

### 3. 定位映射（核心）

**理念**：用“层级路径”映射到**地图坐标区域**（归一化坐标）。

坐标定义（归一化）：

- `nx, ny` ∈ [0,1] 表示全图相对位置
- 区域可用 `bbox` 表示：`{x, y, width, height}`

位置索引表（建议数据文件）：

```json
{
  "continent": {
    "北大陆": { "bbox": { "x": 0.12, "y": 0.08, "width": 0.35, "height": 0.4 } },
    "南大陆": { "bbox": { "x": 0.1, "y": 0.55, "width": 0.45, "height": 0.35 } }
  },
  "region": {
    "北大陆/寒霜高原": { "bbox": { "x": 0.18, "y": 0.12, "width": 0.18, "height": 0.12 } }
  },
  "realm": {
    "北大陆/寒霜高原/凛冬王国": { "bbox": { "x": 0.22, "y": 0.16, "width": 0.08, "height": 0.08 } }
  },
  "settlement": {
    "北大陆/寒霜高原/凛冬王国/冰石城": { "nx": 0.26, "ny": 0.2 }
  }
}
```

### 4. 定位规则（层级回退）

- 优先匹配最细粒度路径（settlement）
- 若缺失，则回退到 realm → region → continent
- 取 `bbox` 中心或 `nx/ny` 作为定位点

定位伪代码：

```ts
const path = [continent, region, realm, settlement, subArea, detail].filter(Boolean);
const key = path.join('/');

if (index.settlement[key]) focusPoint(index.settlement[key]);
else if (index.realm[key]) focusBbox(index.realm[key].bbox);
else if (index.region[key]) focusBbox(index.region[key].bbox);
else if (index.continent[key]) focusBbox(index.continent[key].bbox);
else focusDefault();
```

## 三、地标/区域/城市标记与交互

### 1. 数据结构

```ts
interface MapMarker {
  id: string;
  name: string;
  type: 'city' | 'landmark' | 'region';
  position: { nx: number; ny: number };
  summary?: string;
  imageUrl?: string;
}
```

### 2. 展示策略

- 使用 OSD Overlay 添加 DOM 标记
- hover 显示信息卡（name + summary + image）
- click 可固定弹窗或切换面板

## 四、可编辑（涂画/标记）

### 1. 绘制层

- Canvas 叠加在 OSD 容器上方
- 通过 OSD viewport 同步 Canvas 缩放/平移

### 2. 绘制数据存储

```ts
interface DrawStroke {
  id: string;
  tool: 'pen' | 'erase';
  color: string;
  width: number;
  points: Array<{ nx: number; ny: number }>; // 归一化
}
```

### 3. 交互建议

- 只做最基础功能：画笔、橡皮、清空
- 保存/加载涂画数据（JSON）

## 五、页面结构建议

### 模块划分

- `map-viewer`：OSD 初始化与图层加载
- `map-positioning`：世界.位置解析与定位
- `map-markers`：标记数据与 overlay 管理
- `map-draw`：涂画层逻辑

### Tab 入口与布局交互

- 在 [src/status/config/tabs.config.ts](src/status/config/tabs.config.ts) 中新增 `map` Tab
- 页面内常规模式：地图容器固定在页面内容区

> 实现更新：最终采用**页面内铺满显示**（移除弹层），避免与标题栏重叠与 iframe 全屏限制。

### iframe 约束说明

- 本项目运行在 iframe 内部，**浏览器全屏 API 可能受限或需用户手势**
- 若宿主页面禁用 `allowfullscreen`，则无法真正进入全屏
- 兼容策略：使用 **80% 视口弹层** 作为“伪全屏”，在 iframe 内也能稳定工作

### 数据目录建议

- `src/status/pages/map/`：地图页组件
- `src/status/pages/map/data/`：位置索引与标记

## 六、性能与风险点

- **风险**：200MB 原图直接加载会卡顿
  - **措施**：优先切片（DZI/IIIF），按需加载
- **风险**：切片目录总量过大导致 CDN/托管限制或首批下载过慢
  - **措施**：改用原图直链 + 强缓存，并提供多档画质切换
- **风险**：涂画层与缩放同步异常
  - **措施**：监听 OSD viewport 事件，使用统一转换函数
- **风险**：OSD 全屏与 iframe 冲突
  - **措施**：禁用 `showFullPageControl`，避免绘制层脱离视口

## 七、落地完成情况（2026-01-19）

- ✅ 采用 OSD + Canvas 方案并完成基础页面布局
- ✅ 地标 overlay 与 hover 图文卡片
- ✅ 绘制坐标归一化并持久化到 chat 变量 `map_drawings`
- ✅ 绘制层与 OSD 视口同步（缩放/平移重绘）
- ✅ 原图直链加载 + 画质切换（高清/超清）
- ✅ 禁用 OSD FullPage 控件避免 iframe 覆盖问题

> 备注：DZI/IIIF 切片仍保留为可选方案（当托管/容量允许时可切换）。

---

以上设计保持统一方案、可扩展、易维护，满足 15MB 与 200MB 地图的同一套加载与交互逻辑。
