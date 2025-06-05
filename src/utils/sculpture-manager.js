/**
 * 空间雕塑管理模块
 * 实现各种预设的几何雕塑形状
 */

// 默认雕塑配置
const DEFAULT_SCULPTURE_CONFIG = {
    type: 'radial',          // 雕塑类型
    rodCount: 300,            // 杆件总数
    baseLength: 20,          // 基础长度 (mm)
    lengthVariation: 100,     // 长度变化范围 (mm)
    radius: 0.15,           // 雕塑半径 (m)
    height: 0.1,            // 雕塑高度变化 (m)
    angleOffset: 0,         // 角度偏移
    spiralTurns: 3,         // 螺旋圈数
    symmetry: true          // 是否对称
};

class SculptureManager {
    constructor() {
        // 雕塑配置
        this.sculptureConfig = { ...DEFAULT_SCULPTURE_CONFIG };
    }

    /**
     * 生成雕塑杆件数据
     * @param {Object} config - 雕塑配置
     * @returns {Array} 杆件数据数组
     */
    generateSculptureRods(config = {}) {
        this.sculptureConfig = { ...DEFAULT_SCULPTURE_CONFIG, ...config };
        
        switch (this.sculptureConfig.type) {
            case 'radial':
                return this.generateRadialRods();
            case 'wing':
                return this.generateWingRods();
            case 'spiral':
                return this.generateSpiralRods();
            case 'butterfly':
                return this.generateButterflyRods();
            case 'ring':
                return this.generateRingRods();
            default:
                console.warn(`未知雕塑类型: ${this.sculptureConfig.type}`);
                return this.generateRadialRods();
        }
    }

    /**
     * 生成放射状杆件 (从中心向外放射)
     */
    generateRadialRods() {
        const rods = [];
        const { rodCount, baseLength, lengthVariation, radius } = this.sculptureConfig;

        for (let i = 0; i < rodCount; i++) {
            // 球面坐标：在球面上均匀分布
            const phi = Math.acos(1 - 2 * (i + 0.5) / rodCount); // 极角 [0, π]
            const theta = Math.PI * (1 + Math.sqrt(5)) * i; // 方位角，使用黄金角

            // 转换为笛卡尔坐标
            const x = radius * Math.sin(phi) * Math.cos(theta);
            const y = radius * Math.cos(phi);
            const z = radius * Math.sin(phi) * Math.sin(theta);
            const z_p=z+radius;

            // 计算杆件方向（从中心指向外）
            const length = Math.sqrt(x*x + y*y + z*z);
            const dirX = x / length;
            const dirY = y / length;
            const dirZ = z / length;

            // 杆件长度：基于距离中心的角度变化
            const distanceFromCenter = Math.sqrt(x*x + z*z);
            const lengthFactor = 0.3 + 0.7 * (distanceFromCenter / radius);
            const rodLength = (baseLength + lengthVariation * lengthFactor) / 1000; // mm to m

            rods.push({
                position: { x, y, z },
                direction: { x: dirX, y: dirY, z: dirZ },
                length: rodLength,
                index: i
            });
        }

        return rods;
    }

    /**
     * 生成翼状杆件 (V字形鸟翼效果)
     */
    generateWingRods() {
        const rods = [];
        const { rodCount, baseLength, lengthVariation, radius, height } = this.sculptureConfig;
        const halfCount = Math.floor(rodCount / 2);

        // 生成左翼
        for (let i = 0; i < halfCount; i++) {
            const t = i / (halfCount - 1); // 参数 t ∈ [0, 1]
            const angle = -Math.PI * 0.25 - t * Math.PI * 0.3; // 左翼角度

            const x = radius * t * Math.cos(angle);
            const y = height * Math.sin(Math.PI * t) * 0.5; // 轻微的高度变化
            const z = radius * t * Math.sin(angle);

            // 杆件方向：沿翼展方向，略微向上
            const dirX = Math.cos(angle);
            const dirY = 0.2 * (1 - t); // 根部向上，翼尖水平
            const dirZ = Math.sin(angle);
            const dirLength = Math.sqrt(dirX*dirX + dirY*dirY + dirZ*dirZ);

            // 杆件长度：翼根短，翼尖长
            const lengthFactor = 0.3 + 0.7 * t;
            const rodLength = (baseLength + lengthVariation * lengthFactor) / 1000;

            rods.push({
                position: { x, y, z },
                direction: { x: dirX/dirLength, y: dirY/dirLength, z: dirZ/dirLength },
                length: rodLength,
                index: i
            });
        }

        // 生成右翼 (镜像)
        for (let i = 0; i < halfCount; i++) {
            const t = i / (halfCount - 1);
            const angle = Math.PI * 0.25 + t * Math.PI * 0.3; // 右翼角度

            const x = radius * t * Math.cos(angle);
            const y = height * Math.sin(Math.PI * t) * 0.5;
            const z = radius * t * Math.sin(angle);

            const dirX = Math.cos(angle);
            const dirY = 0.2 * (1 - t);
            const dirZ = Math.sin(angle);
            const dirLength = Math.sqrt(dirX*dirX + dirY*dirY + dirZ*dirZ);

            const lengthFactor = 0.3 + 0.7 * t;
            const rodLength = (baseLength + lengthVariation * lengthFactor) / 1000;

            rods.push({
                position: { x, y, z },
                direction: { x: dirX/dirLength, y: dirY/dirLength, z: dirZ/dirLength },
                length: rodLength,
                index: halfCount + i
            });
        }

        return rods;
    }

    /**
     * 生成螺旋状杆件
     */
    generateSpiralRods() {
        const rods = [];
        const { rodCount, baseLength, lengthVariation, radius, spiralTurns } = this.sculptureConfig;

        for (let i = 0; i < rodCount; i++) {
            const t = i / (rodCount - 1); // 参数 t ∈ [0, 1]
            const angle = t * spiralTurns * 2 * Math.PI; // 螺旋角度
            const r = radius * (0.1 + 0.9 * t); // 半径从内到外递增

            const x = r * Math.cos(angle);
            const y = t * this.sculptureConfig.height; // 高度随螺旋上升
            const z = r * Math.sin(angle);

            // 杆件方向：切线方向 + 径向分量
            const tangentX = -Math.sin(angle);
            const tangentZ = Math.cos(angle);
            const radialX = Math.cos(angle);
            const radialZ = Math.sin(angle);

            // 混合切线和径向方向
            const mixRatio = 0.7; // 切线权重
            const dirX = mixRatio * tangentX + (1 - mixRatio) * radialX;
            const dirY = 0.3; // 轻微向上
            const dirZ = mixRatio * tangentZ + (1 - mixRatio) * radialZ;
            const dirLength = Math.sqrt(dirX*dirX + dirY*dirY + dirZ*dirZ);

            // 杆件长度：螺旋外侧较长
            const lengthFactor = 0.4 + 0.6 * t;
            const rodLength = (baseLength + lengthVariation * lengthFactor) / 1000;

            rods.push({
                position: { x, y, z },
                direction: { x: dirX/dirLength, y: dirY/dirLength, z: dirZ/dirLength },
                length: rodLength,
                index: i
            });
        }

        return rods;
    }

    /**
     * 生成蝴蝶状杆件 (对称花瓣形)
     */
    generateButterflyRods() {
        const rods = [];
        const { rodCount, baseLength, lengthVariation, radius } = this.sculptureConfig;
        const quarterCount = Math.floor(rodCount / 4);

        // 生成四个花瓣
        for (let petal = 0; petal < 4; petal++) {
            const petalAngle = petal * Math.PI * 0.5; // 每个花瓣90度间隔

            for (let i = 0; i < quarterCount; i++) {
                const t = i / (quarterCount - 1); // 参数 t ∈ [0, 1]
                
                // 花瓣形状：使用心形曲线的变形
                const angle = t * Math.PI; // 半圆
                const r = radius * Math.sin(angle) * (1 + 0.5 * Math.cos(angle));
                
                const localX = r * Math.cos(angle * 0.5);
                const localZ = r * Math.sin(angle * 0.5);

                // 旋转到对应花瓣位置
                const x = localX * Math.cos(petalAngle) - localZ * Math.sin(petalAngle);
                const z = localX * Math.sin(petalAngle) + localZ * Math.cos(petalAngle);
                const y = this.sculptureConfig.height * Math.sin(angle) * 0.3; // 轻微高度变化

                // 杆件方向：沿花瓣展开方向
                const dirX = Math.cos(petalAngle + angle * 0.3);
                const dirY = 0.1 * Math.sin(angle);
                const dirZ = Math.sin(petalAngle + angle * 0.3);
                const dirLength = Math.sqrt(dirX*dirX + dirY*dirY + dirZ*dirZ);

                // 杆件长度：花瓣中部最长
                const lengthFactor = 0.3 + 0.7 * Math.sin(angle);
                const rodLength = (baseLength + lengthVariation * lengthFactor) / 1000;

                rods.push({
                    position: { x, y, z },
                    direction: { x: dirX/dirLength, y: dirY/dirLength, z: dirZ/dirLength },
                    length: rodLength,
                    index: petal * quarterCount + i
                });
            }
        }

        return rods;
    }

    /**
     * 生成环形杆件 (圆环排列)
     */
    generateRingRods() {
        const rods = [];
        const { rodCount, baseLength, lengthVariation, radius } = this.sculptureConfig;

        for (let i = 0; i < rodCount; i++) {
            const angle = (i / rodCount) * 2 * Math.PI; // 均匀分布在圆周上
            
            const x = radius * Math.cos(angle);
            const y = 0; // 保持在同一水平面
            const z = radius * Math.sin(angle);

            // 杆件方向：径向向外，略微向上
            const dirX = Math.cos(angle);
            const dirY = 0.3; // 向上分量
            const dirZ = Math.sin(angle);
            const dirLength = Math.sqrt(dirX*dirX + dirY*dirY + dirZ*dirZ);

            // 杆件长度：根据位置变化，创造波浪效果
            const waveCount = 8; // 波浪数量
            const wavePhase = angle * waveCount;
            const lengthFactor = 0.5 + 0.5 * Math.sin(wavePhase);
            const rodLength = (baseLength + lengthVariation * lengthFactor) / 1000;

            rods.push({
                position: { x, y, z },
                direction: { x: dirX/dirLength, y: dirY/dirLength, z: dirZ/dirLength },
                length: rodLength,
                index: i
            });
        }

        return rods;
    }

    /**
     * 设置雕塑配置
     * @param {Object} config - 配置对象
     */
    setConfig(config) {
        this.sculptureConfig = { ...this.sculptureConfig, ...config };
    }

    /**
     * 获取当前配置
     * @returns {Object} 当前配置
     */
    getConfig() {
        return { ...this.sculptureConfig };
    }

    /**
     * 获取默认雕塑配置
     * @returns {Object} 默认配置
     */
    static getDefaultConfig() {
        return { ...DEFAULT_SCULPTURE_CONFIG };
    }

    /**
     * 获取所有可用雕塑类型
     * @returns {Array} 雕塑类型列表
     */
    static getAvailableTypes() {
        return [
            { value: 'radial', name: '放射状', description: '从中心向外放射的球形分布' },
            { value: 'wing', name: '翼状', description: 'V字形鸟翼效果' },
            { value: 'spiral', name: '螺旋状', description: '螺旋上升的分布' },
            { value: 'butterfly', name: '蝴蝶状', description: '对称的花瓣形状' },
            { value: 'ring', name: '环形', description: '圆环波浪排列' }
        ];
    }
}

// ES6 模块导出
export { SculptureManager, DEFAULT_SCULPTURE_CONFIG }; 