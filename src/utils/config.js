/**
 * 配置文件 - 定义全局设置和常量
 */

// 全局配置对象
const CONFIG = {
    // 物理常量
    physics: {
        gravity: 9.81,                  // 重力加速度 (m/s²)
        airDensity: 1.225,              // 空气密度 (kg/m³)
        resonanceTolerance: 0.05,       // 共振判定容差 (5%)
        maxDeformation: 0.01,           // 最大变形显示 (m)
        timeStep: 0.01                  // 时间步长 (s)
    },

    // 杆件参数范围
    rod: {
        lengthRange: {
            min: 0.02,                  // 最小长度 20mm
            max: 0.2,                   // 最大长度 200mm
            step: 0.01                  // 步长 10mm
        },
        diameterRange: {
            min: 0.001,                 // 最小直径 1mm
            max: 0.02,                  // 最大直径 20mm
            step: 0.0005                // 步长 0.5mm
        },
        countRange: {
            min: 1,                     // 最少杆件数
            max: 20,                    // 最多杆件数
            default: 5                  // 默认杆件数
        }
    },

    // 激励参数范围
    excitation: {
        frequencyRange: {
            min: 20,                    // 最小频率 20Hz
            max: 2000,                  // 最大频率 2000Hz
            default: 100                // 默认频率 100Hz
        },
        amplitudeRange: {
            min: 0.001,                 // 最小振幅 1mm
            max: 0.01,                  // 最大振幅 10mm
            default: 0.005              // 默认振幅 5mm
        },
        dampingRange: {
            min: 0.001,                 // 最小阻尼比
            max: 0.1,                   // 最大阻尼比
            default: 0.01               // 默认阻尼比
        }
    },

    // 音频处理参数
    audio: {
        sampleRate: 44100,              // 采样率
        fftSize: 2048,                  // FFT窗口大小
        maxDuration: 60,                // 最大音频时长 (秒)
        dominantFreqCount: 10,          // 提取的主要频率数量
        frequencyThreshold: 0.1         // 频率幅度阈值
    },

    // 3D渲染参数
    rendering: {
        camera: {
            fov: 75,                    // 视场角
            near: 0.1,                  // 近裁剪面
            far: 1000,                  // 远裁剪面
            position: { x: 0, y: 0, z: 5 }  // 初始位置
        },
        lighting: {
            ambient: 0x404040,          // 环境光颜色
            directional: 0xffffff,      // 方向光颜色
            intensity: 1.0              // 光照强度
        },
        animation: {
            frameRate: 60,              // 帧率
            deformationScale: 1000,     // 变形放大倍数
            colorTransition: true       // 启用颜色过渡
        }
    },

    // 图表配置
    plotting: {
        waveform: {
            maxPoints: 1000,            // 波形图最大点数
            lineWidth: 2,               // 线宽
            colors: {
                primary: '#3b82f6',     // 主色
                secondary: '#ef4444',   // 次色
                background: '#1f2937'   // 背景色
            }
        },
        frequency: {
            binCount: 512,              // 频率箱数
            logScale: false,            // 是否使用对数刻度
            smoothing: 0.8              // 频谱平滑参数
        }
    },

    // UI设置
    ui: {
        theme: 'dark',                  // 主题 ('light' | 'dark')
        updateInterval: 100,            // UI更新间隔 (ms)
        responsiveBreakpoint: 768,      // 响应式断点 (px)
        animations: {
            enabled: true,              // 启用动画
            duration: 300               // 动画持续时间 (ms)
        }
    },

    // 开发调试设置
    debug: {
        showFPS: false,                 // 显示FPS
        showAxes: false,                // 显示坐标轴
        logCalculations: false,         // 记录计算过程
        showModeShapes: false           // 显示模态振型
    }
};

// 颜色配置
const COLORS = {
    materials: {
        steel: '#c0c0c0',              // 钢材颜色
        aluminum: '#b8b8b8',           // 铝材颜色
        brass: '#b5a642',              // 黄铜颜色
        copper: '#b87333',             // 铜材颜色
        custom: '#6366f1'              // 自定义材料颜色
    },
    status: {
        normal: '#10b981',             // 正常状态 (绿色)
        resonant: '#ef4444',           // 共振状态 (红色)
        nearResonant: '#f59e0b',       // 接近共振 (橙色)
        inactive: '#6b7280'            // 非活动状态 (灰色)
    },
    ui: {
        primary: '#3b82f6',            // 主要颜色
        secondary: '#6366f1',          // 次要颜色
        success: '#10b981',            // 成功颜色
        warning: '#f59e0b',            // 警告颜色
        error: '#ef4444',              // 错误颜色
        text: '#f9fafb',               // 文本颜色
        background: '#111827',         // 背景颜色
        surface: '#1f2937'             // 表面颜色
    }
};

// 国际化文本
const TEXTS = {
    zh: {
        title: '多杆件振动模拟系统',
        rodConfig: '杆件配置',
        materialProps: '材料特性',
        excitationParams: '激励参数',
        controls: '控制',
        audioProcessing: '音频处理',
        soundGenerator: '声音生成器',
        visualization: '可视化',
        play: '播放',
        pause: '暂停',
        reset: '重置',
        calculate: '计算共振',
        upload: '上传音频文件',
        process: '分析频率',
        generate: '生成声音',
        resonant: '共振',
        normal: '正常',
        nearResonant: '接近共振'
    }
};

// 导出配置对象
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, COLORS, TEXTS };
} 