/**
 * 阵列配置管理模块
 * 统一管理阵列模式的所有配置参数
 */

// 默认阵列配置
const DEFAULT_ARRAY_CONFIG = {
    gridX: 40,               // 网格X方向数量
    gridY: 40,               // 网格Y方向数量  
    heightFunction: 'sine',  // 高度函数类型
    baseHeight: 20,          // 基础高度 (mm)
    amplitude: 80,           // 高度变化幅度 (mm)
    scaleFactor: 2.0,        // 缩放因子
    spacing: 10              // 杆件间距 (mm)
};

class ArrayManager {
    constructor() {
        // 阵列配置
        this.arrayConfig = { ...DEFAULT_ARRAY_CONFIG };
    }

    /**
     * 设置阵列配置
     * @param {Object} config - 配置对象
     */
    setConfig(config) {
        this.arrayConfig = { ...this.arrayConfig, ...config };
    }

    /**
     * 获取当前配置
     * @returns {Object} 当前配置
     */
    getConfig() {
        return { ...this.arrayConfig };
    }

    /**
     * 重置配置为默认值
     * @returns {Object} 重置后的配置
     */
    resetConfig() {
        this.arrayConfig = { ...DEFAULT_ARRAY_CONFIG };
        return this.getConfig();
    }

    /**
     * 获取默认阵列配置
     * @returns {Object} 默认配置
     */
    static getDefaultConfig() {
        return { ...DEFAULT_ARRAY_CONFIG };
    }

    /**
     * 获取所有可用高度函数
     * @returns {Array} 高度函数列表
     */
    static getAvailableHeightFunctions() {
        return [
            { value: 'sine', name: '正弦波', description: '正弦波形高度分布' },
            { value: 'gaussian', name: '高斯分布', description: '钟形高度分布' },
            { value: 'linear_slope', name: '线性斜坡', description: '线性渐变高度' },
            { value: 'peak', name: '中心峰', description: '中心最高的锥形分布' },
            { value: 'ripple', name: '涟漪', description: '同心圆涟漪效果' }
        ];
    }

    /**
     * 验证配置参数的有效性
     * @param {Object} config - 要验证的配置
     * @returns {Object} 验证结果 {isValid, errors}
     */
    static validateConfig(config) {
        const errors = [];
        
        // 验证网格大小
        if (config.gridX < 1 || config.gridX > 50) {
            errors.push('X方向网格数量必须在1-50之间');
        }
        if (config.gridY < 1 || config.gridY > 50) {
            errors.push('Y方向网格数量必须在1-50之间');
        }
        
        // 验证高度参数
        if (config.baseHeight < 1 || config.baseHeight > 200) {
            errors.push('基础高度必须在1-200mm之间');
        }
        if (config.amplitude < 0 || config.amplitude > 200) {
            errors.push('高度幅度必须在0-200mm之间');
        }
        
        // 验证间距
        if (config.spacing < 5 || config.spacing > 100) {
            errors.push('杆件间距必须在5-100mm之间');
        }
        
        // 验证缩放因子
        if (config.scaleFactor < 0.1 || config.scaleFactor > 5.0) {
            errors.push('缩放因子必须在0.1-5.0之间');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

// ES6 模块导出
export { ArrayManager, DEFAULT_ARRAY_CONFIG }; 