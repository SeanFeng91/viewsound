/**
 * 材料特性模块
 * 定义各种材料的物理参数
 */

export class MaterialProperties {
    constructor() {
        this.materials = {
            steel: {
                name: '钢材',
                youngModulus: 200e9,  // Pa
                density: 7850,        // kg/m³
                color: 0x888888
            },
            aluminum: {
                name: '铝合金',
                youngModulus: 70e9,   // Pa
                density: 2700,        // kg/m³
                color: 0xaaaaaa
            },
            brass: {
                name: '黄铜',
                youngModulus: 110e9,  // Pa
                density: 8500,        // kg/m³
                color: 0xb8860b
            },
            copper: {
                name: '紫铜',
                youngModulus: 110e9,  // Pa
                density: 8960,        // kg/m³
                color: 0xb87333
            },
            custom: {
                name: '自定义',
                youngModulus: 200e9,  // Pa
                density: 7850,        // kg/m³
                color: 0x0077ff
            }
        };
    }

    getMaterial(type) {
        return this.materials[type] || this.materials.steel;
    }

    setCustomMaterial(youngModulus, density) {
        this.materials.custom.youngModulus = youngModulus * 1e9; // GPa to Pa
        this.materials.custom.density = density;
    }

    getAllMaterials() {
        return this.materials;
    }

    // 计算音速
    calculateSoundSpeed(material) {
        return Math.sqrt(material.youngModulus / material.density);
    }

    // 计算第一阶固有频率（悬臂梁）
    calculateNaturalFrequency(length, diameter, material, mode = 1) {
        const L = length / 1000;  // mm to m
        const r = diameter / 2000; // mm to m, radius
        const A = Math.PI * r * r;
        const I = (Math.PI * Math.pow(r, 4)) / 4;
        
        // 悬臂梁第n阶模态的特征值
        const lambdaN = [1.875, 4.694, 7.855, 10.996];
        const lambda = lambdaN[mode - 1] || lambdaN[0];
        
        const beta = lambda / L;
        const omega = Math.pow(beta, 2) * Math.sqrt((material.youngModulus * I) / (material.density * A));
        
        return omega / (2 * Math.PI); // rad/s to Hz
    }

    // 计算所有模态的固有频率
    calculateAllModalFrequencies(length, diameter, material) {
        const frequencies = [];
        for (let mode = 1; mode <= 4; mode++) {
            frequencies.push({
                mode: mode,
                frequency: this.calculateNaturalFrequency(length, diameter, material, mode)
            });
        }
        return frequencies;
    }
} 