# ViewSound 声音可视化系统 - 系统架构图

## 系统架构概览

```mermaid
graph TB
    %% 外部依赖层
    subgraph "External Dependencies"
        THREE["Three.js<br/>3D渲染引擎"]
        D3["D3.js<br/>数据可视化"]
        WebAudio["Web Audio API<br/>音频处理"]
        Vue["Vue.js 3<br/>前端框架"]
        Vite["Vite<br/>构建工具"]
        Tailwind["Tailwind CSS<br/>样式框架"]
    end

    %% 前端界面层
    subgraph "Frontend UI Layer"
        App["App.vue<br/>主应用组件"]
        AudioPlayer["AudioPlayer.vue<br/>音频播放器组件"]
        VibrationControls["VibrationControls.vue<br/>振动控制面板"]
        Welcome["Welcome组件<br/>欢迎界面"]
    end

    %% 核心业务层
    subgraph "Core Business Layer"
        MainController["MainController<br/>主控制器"]
        RodManager["RodManager<br/>杆件管理器"]
        AudioGenerator["AudioGenerator<br/>音频生成器"]
        Visualization["Visualization<br/>数据可视化管理器"]
    end

    %% 工具模块层
    subgraph "Utility Modules"
        AudioProcessor["AudioProcessor<br/>音频处理器"]
        VibrationCalc["VibrationCalculator<br/>振动计算器"]
        MaterialProps["MaterialProperties<br/>材料属性管理"]
        SculptureManager["SculptureManager<br/>雕塑管理器"]
        ArrayManager["ArrayManager<br/>阵列管理器"]
        MathFunctions["MathFunctions<br/>数学函数库"]
        Config["Config<br/>配置管理"]
    end

    %% 数据处理层
    subgraph "Data Processing"
        FFT["FFT分析<br/>频率分析"]
        Resonance["共振计算<br/>固有频率计算"]
        PhysicsEngine["物理引擎<br/>杆件振动模拟"]
        RealTimeAudio["实时音频分析<br/>主导频率提取"]
    end

    %% 渲染层
    subgraph "Rendering Layer"
        Scene3D["3D场景<br/>杆件3D渲染"]
        Charts["数据图表<br/>波形/频谱/共振图"]
        Materials3D["3D材质<br/>钢材/木材/碳纤维等"]
        Lighting["光照系统<br/>环境光/平行光/点光源"]
        Controls["交互控制<br/>缩放/旋转/选择"]
    end

    %% 连接关系
    Vue --> App
    App --> AudioPlayer
    App --> VibrationControls
    App --> Welcome

    App --> MainController
    MainController --> RodManager
    MainController --> AudioGenerator
    MainController --> Visualization
    MainController --> AudioProcessor

    RodManager --> VibrationCalc
    RodManager --> MaterialProps
    RodManager --> SculptureManager
    RodManager --> ArrayManager
    RodManager --> THREE

    AudioProcessor --> WebAudio
    AudioGenerator --> WebAudio
    AudioPlayer --> WebAudio

    Visualization --> D3
    
    VibrationCalc --> MathFunctions
    VibrationCalc --> Config

    RodManager --> Scene3D
    RodManager --> Materials3D
    RodManager --> Lighting
    RodManager --> Controls

    AudioProcessor --> FFT
    AudioProcessor --> RealTimeAudio
    VibrationCalc --> Resonance
    VibrationCalc --> PhysicsEngine

    Visualization --> Charts

    %% 样式定义
    classDef externalDep fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef frontend fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef core fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef utility fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef data fill:#fce4ec,stroke:#880e4f,stroke-width:2px
    classDef render fill:#f1f8e9,stroke:#33691e,stroke-width:2px

    class THREE,D3,WebAudio,Vue,Vite,Tailwind externalDep
    class App,AudioPlayer,VibrationControls,Welcome frontend
    class MainController,RodManager,AudioGenerator,Visualization core
    class AudioProcessor,VibrationCalc,MaterialProps,SculptureManager,ArrayManager,MathFunctions,Config utility
    class FFT,Resonance,PhysicsEngine,RealTimeAudio data
    class Scene3D,Charts,Materials3D,Lighting,Controls render
```

## 详细功能模块架构

```mermaid
graph LR
    %% 音频处理流水线
    subgraph "Audio Processing Pipeline"
        AudioInput["音频输入<br/>• MP3文件<br/>• 实时麦克风<br/>• 生成的正弦波"]
        AudioAnalysis["音频分析<br/>• FFT频谱分析<br/>• 主导频率提取<br/>• 频率平滑处理"]
        FrequencyExtraction["频率提取<br/>• 多峰值检测<br/>• 基频识别<br/>• 置信度评估"]
        FrequencyOutput["频率输出<br/>• 实时频率值<br/>• 振幅信息<br/>• 频率变化回调"]
    end

    %% 杆件系统
    subgraph "Rod System"
        RodConfig["杆件配置<br/>• 数量/长度/直径<br/>• 材料属性<br/>• 排列模式"]
        DisplayModes["显示模式<br/>• 线性排列<br/>• 函数阵列<br/>• 空间雕塑"]
        RodPhysics["杆件物理<br/>• 固有频率计算<br/>• 共振分析<br/>• 阻尼效应"]
        RodRendering["杆件渲染<br/>• 3D几何体<br/>• 材质贴图<br/>• 动画变形"]
    end

    %% 可视化系统
    subgraph "Visualization System"
        WaveformPlot["波形图<br/>• 时域振动波形<br/>• 实时数据更新<br/>• 可选择杆件"]
        FrequencyPlot["频谱图<br/>• 频域分析结果<br/>• 响应强度显示<br/>• 频率范围控制"]
        ResonancePlot["共振图<br/>• 固有频率标记<br/>• 激励频率指示<br/>• 共振状态显示"]
        Status3D["3D状态<br/>• 杆件颜色编码<br/>• 振动幅度映射<br/>• 共振高亮"]
    end

    %% 交互控制
    subgraph "Interactive Controls"
        ParameterPanel["参数面板<br/>• 杆件参数调节<br/>• 材料选择<br/>• 激励设置"]
        ViewControls["视图控制<br/>• 相机控制<br/>• 预设视角<br/>• 全屏模式"]
        AudioControls["音频控制<br/>• 播放/暂停<br/>• 音量调节<br/>• 文件选择"]
        SimulationControls["仿真控制<br/>• 开始/停止<br/>• 重置<br/>• 时间缩放"]
    end

    %% 数据流连接
    AudioInput --> AudioAnalysis
    AudioAnalysis --> FrequencyExtraction
    FrequencyExtraction --> FrequencyOutput
    FrequencyOutput --> RodPhysics

    RodConfig --> DisplayModes
    DisplayModes --> RodPhysics
    RodPhysics --> RodRendering

    RodPhysics --> WaveformPlot
    RodPhysics --> FrequencyPlot
    RodPhysics --> ResonancePlot
    RodRendering --> Status3D

    ParameterPanel --> RodConfig
    ViewControls --> RodRendering
    AudioControls --> AudioInput
    SimulationControls --> RodPhysics
```

## 雕塑模式详细架构

```mermaid
graph TD
    %% 雕塑管理器
    SculptureManager["SculptureManager<br/>雕塑管理器"]
    
    %% 雕塑类型
    subgraph "Sculpture Types"
        Radial["放射状<br/>从中心向外辐射"]
        Wing["翼状<br/>V字形排列"]
        Spiral["螺旋状<br/>螺旋线上升"]
        Butterfly["蝴蝶状<br/>对称花瓣形"]
        Ring["环形<br/>圆环排列"]
        Wave["波浪状<br/>正弦波排列"]
        Helix["双螺旋<br/>DNA结构"]
        Sphere["球形<br/>球面分布"]
    end

    %% 雕塑参数
    subgraph "Sculpture Parameters"
        RodCount["杆件数量<br/>10-200根"]
        BaseLength["基础长度<br/>20-500mm"]
        LengthVariation["长度变化<br/>0-80%变化范围"]
        Scale["整体缩放<br/>0.1-3.0倍"]
        SpecialParams["特殊参数<br/>• 螺旋圈数<br/>• 张开角度<br/>• 半径参数"]
    end

    %% 生成算法
    subgraph "Generation Algorithms"
        PositionCalc["位置计算<br/>数学函数映射"]
        LengthCalc["长度计算<br/>基于位置的变化函数"]
        OrientationCalc["方向计算<br/>切线或法向量"]
        GeometryGen["几何生成<br/>3D圆柱体创建"]
    end

    SculptureManager --> Radial
    SculptureManager --> Wing
    SculptureManager --> Spiral
    SculptureManager --> Butterfly
    SculptureManager --> Ring
    SculptureManager --> Wave
    SculptureManager --> Helix
    SculptureManager --> Sphere

    SculptureManager --> RodCount
    SculptureManager --> BaseLength
    SculptureManager --> LengthVariation
    SculptureManager --> Scale
    SculptureManager --> SpecialParams

    RodCount --> PositionCalc
    BaseLength --> LengthCalc
    LengthVariation --> LengthCalc
    Scale --> PositionCalc
    SpecialParams --> PositionCalc

    PositionCalc --> GeometryGen
    LengthCalc --> GeometryGen
    OrientationCalc --> GeometryGen
```

## 数据流架构

```mermaid
sequenceDiagram
    participant User as 用户
    participant UI as 界面组件
    participant Main as 主控制器
    participant Audio as 音频处理器
    participant Rod as 杆件管理器
    participant Vis as 可视化器
    participant 3D as 3D渲染器

    User->>UI: 上传音频文件
    UI->>Audio: processAudioFile()
    Audio->>Audio: FFT分析
    Audio->>Main: 返回频率数据
    Main->>Rod: setExcitationParams()
    
    loop 实时播放
        Audio->>Main: onFrequencyChange()
        Main->>Rod: updateExcitation()
        Rod->>Rod: 计算杆件振动
        Rod->>3D: 更新3D几何体
        Rod->>Vis: 发送波形数据
        Vis->>UI: 更新图表显示
    end

    User->>UI: 调整杆件参数
    UI->>Main: updateConfig()
    Main->>Rod: setRodParams()
    Rod->>Rod: 重新创建杆件
    Rod->>3D: 更新3D场景

    User->>UI: 切换雕塑模式
    UI->>Main: setDisplayMode()
    Main->>Rod: setDisplayMode()
    Rod->>Rod: 应用雕塑算法
    Rod->>3D: 生成新的3D布局
```

## 技术栈总结

- **前端框架**: Vue.js 3 + Composition API
- **3D渲染**: Three.js (WebGL)
- **数据可视化**: D3.js
- **音频处理**: Web Audio API
- **构建工具**: Vite
- **样式框架**: Tailwind CSS
- **物理计算**: 自研振动算法
- **数学计算**: 自实现FFT + 共振分析 