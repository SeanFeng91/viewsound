# 声音可视化 - 多杆件振动模拟系统

## 项目简介

这是一个将声音转化为视觉艺术的数字创作工具，通过分析音频的频率特性，驱动三维空间中的杆件产生振动，创造出动态的视觉效果。你可以上传自己喜爱的音乐，看它如何转变为舞动的杆件群，展现出音乐内在的结构与韵律。

![项目预览图](这里放一张项目的截图)

## ✨ 功能特点

- **多种激励模式**：支持正弦波、扫频和音频文件三种激励源
- **丰富的杆件排列**：线性排列、函数阵列和空间雕塑等多种布局方式
- **精美的空间雕塑**：放射状、翼状、螺旋状、蝴蝶状等多种艺术造型
- **实时频率分析**：智能提取音乐中的主导频率，驱动杆件振动
- **物理模拟**：基于真实物理参数的共振效应模拟
- **数据可视化**：实时显示杆件振动波形、响应强度和共振分析
- **材质定制**：支持多种材质选择，如钢材、木材、碳纤维等
- **全方位观察**：支持缩放、旋转等多种视角操作

## 🛠️ 安装使用

### 系统要求

- 现代浏览器（推荐 Chrome、Firefox 或 Edge 的最新版本）
- 支持 WebGL 的显卡
- 2GB 以上内存

### 安装步骤

```bash
# 克隆仓库
git clone https://github.com/SeanFeng91/viewsound.git

# 进入项目目录
cd viewsound

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 `http://localhost:5173` 即可开始使用。

## 📖 使用指南

### 基本操作流程

1. **选择显示模式**：在左侧控制面板中选择杆件的排列方式（线性、阵列或雕塑）
2. **调整杆件参数**：设置杆件数量、长度、直径等物理属性
3. **选择激励方式**：
   - **正弦波**：设置特定频率的正弦波激励
   - **扫频**：自动扫描一定范围内的频率，观察不同频率下的响应
   - **音频文件**：上传MP3音频文件或使用示例音频，分析其频率特性

4. **开始模拟**：点击"开始"按钮，观察杆件振动效果
5. **调整视角**：通过鼠标拖拽、滚轮缩放等操作调整3D视图

### 功能区域说明

![功能区域示意图](这里放一张标注了功能区域的截图)

- **左侧面板**：参数控制区，包含显示模式、杆件参数、激励设置等
- **中央区域**：3D可视化区，展示杆件振动效果
- **右下区域**：数据分析图表，包括：
  - 振动波形图：显示当前杆件的振动波形
  - 响应强度图：展示不同长度杆件的振动强度
  - 共振分析图：显示杆件固有频率与激励频率的关系

### 空间雕塑模式

在显示模式中选择"雕塑"，可以使用以下预设造型：
- 放射状：杆件从中心向四周辐射排列
- 翼状：形似鸟翼的V字形排列
- 螺旋状：杆件沿螺旋线排列上升
- 蝴蝶状：对称的花瓣形排列
- 环形：杆件围绕中心形成环状

每种雕塑类型都有专属参数可调整，如杆件数量、基础长度、长度变化范围、整体缩放等。

## 🔧 高级功能

### 音频分析

系统采用复杂的音频分析算法，能够从音乐中提取主导频率：
- 多峰值检测：识别频谱中的能量峰值
- 基频识别：分析频率的谐波关系，识别基础音高
- 频率平滑：确保频率变化的连续性，避免杆件振动剧烈跳动
- 置信度评估：评估提取频率的可靠性

### 共振分析

系统可以计算不同长度、材质杆件的固有频率，并在激励频率接近固有频率时显示共振效应。你可以通过共振分析图直观地看到哪些杆件正处于共振状态。

### 数据导出

支持导出共振数据和可视化结果，便于进一步分析或用于其他创作。

## 🧩 技术架构

- **前端框架**：Vue.js
- **3D渲染**：Three.js
- **音频处理**：Web Audio API
- **数据可视化**：Plotly.js
- **物理计算**：自研杆件振动算法

### 系统架构图

```mermaid
graph TD
    subgraph "用户交互层"
        User[用户]
    end

    subgraph "前端表现层 (Vue.js)"
        direction LR
        Controls[控制面板]
        Visualization[3D 视图]
        Charts[数据图表]
    end

    subgraph "数据与逻辑层"
        subgraph "输入源"
            AudioFile[音频文件]
            SignalGen[正弦波/扫频]
        end

        subgraph "处理核心"
            WebAudio[Web Audio API]
            AudioAnalysis[音频分析算法]
            Physics[物理计算算法]
        end

        subgraph "渲染引擎"
            ThreeJS[Three.js]
            PlotlyJS[Plotly.js]
        end
    end

    User -- "操作" --> Controls
    Controls -- "选择并加载" --> AudioFile
    Controls -- "设置参数" --> SignalGen

    AudioFile --> WebAudio
    WebAudio -- "解码与分析" --> AudioAnalysis
    AudioAnalysis -- "提取主导频率" --> Physics
    SignalGen -- "提供激励频率" --> Physics

    Physics -- "杆件振动数据" --> ThreeJS
    Physics -- "响应分析数据" --> PlotlyJS

    ThreeJS -- "渲染 3D 动画" --> Visualization
    PlotlyJS -- "绘制分析图表" --> Charts
```

## 💡 常见问题

**Q: 为什么我上传的音乐文件没有声音或效果不明显？**  
A: 请确保音乐文件格式正确（推荐MP3格式），并检查系统音量。不同类型的音乐效果可能有所不同，节奏明显、音高变化丰富的音乐通常效果更佳。

**Q: 如何获得最佳的视觉效果？**  
A: 尝试不同的雕塑模式，调整杆件数量和长度参数。通常，在激励频率接近某些杆件固有频率时，会产生明显的共振效果和视觉冲击力。

**Q: 系统运行缓慢怎么办？**  
A: 减少杆件数量或简化杆件形状可以提升性能。在高配置计算机上，系统可支持上百根杆件的实时模拟。

**Q: 如何贡献代码或报告问题？**  
A: 欢迎在GitHub仓库提交Issue或Pull Request，我们非常欢迎社区贡献。

## 📝 许可证

本项目采用 MIT 许可证，详见 LICENSE 文件。

## 🙏 致谢

感谢所有为本项目提供支持和建议的贡献者。特别感谢Cursor和Claude AI在开发过程中提供的技术支持。

---

祝你在探索声音与视觉艺术的奇妙旅程中获得乐趣！
