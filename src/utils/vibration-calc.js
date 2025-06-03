/**
 * 振动计算核心模块
 */

export class VibrationCalculator {
    constructor() {
        this.resonanceTolerance = 0.05; // 5% tolerance
    }

    // 计算悬臂梁的固有频率
    calculateNaturalFrequency(length, radius, youngModulus, density, mode = 1) {
        const L = length; // length in meters
        const A = Math.PI * radius * radius;
        const I = (Math.PI * Math.pow(radius, 4)) / 4;
        
        // 悬臂梁第n阶模态的特征值
        const lambdaN = [1.875, 4.694, 7.855, 10.996];
        const lambda = lambdaN[mode - 1] || lambdaN[0];
        
        const beta = lambda / L;
        const omega = Math.pow(beta, 2) * Math.sqrt((youngModulus * I) / (density * A));
        
        return omega / (2 * Math.PI); // rad/s to Hz
    }

    // 判断是否发生共振
    isResonant(excitationFreq, naturalFreq, tolerance = this.resonanceTolerance) {
        const ratio = Math.abs(excitationFreq - naturalFreq) / naturalFreq;
        return ratio <= tolerance;
    }

    // 计算振动响应
    calculateVibrationResponse(rodParams, materialParams, excitationParams, time) {
        const responses = [];
        
        for (let i = 0; i < rodParams.count; i++) {
            const length = (rodParams.startLength + i * rodParams.lengthStep) / 1000; // mm to m
            const radius = rodParams.diameter / 2000; // mm to m
            
            const naturalFreq = this.calculateNaturalFrequency(
                length, 
                radius, 
                materialParams.youngModulus, 
                materialParams.density
            );
            
            // 计算振动幅度
            const amplitude = this.calculateAmplitude(
                excitationParams.frequency,
                naturalFreq,
                excitationParams.amplitude,
                excitationParams.damping
            );
            
            // 计算位移
            const displacement = amplitude * Math.sin(2 * Math.PI * excitationParams.frequency * time);
            
            responses.push({
                rodIndex: i,
                length: length * 1000, // back to mm
                naturalFreq: naturalFreq,
                amplitude: amplitude,
                displacement: displacement,
                isResonant: this.isResonant(excitationParams.frequency, naturalFreq)
            });
        }
        
        return responses;
    }

    // 计算振动幅度
    calculateAmplitude(excitationFreq, naturalFreq, inputAmplitude, dampingRatio) {
        const frequencyRatio = excitationFreq / naturalFreq;
        const magnificationFactor = 1 / Math.sqrt(
            Math.pow(1 - frequencyRatio * frequencyRatio, 2) + 
            Math.pow(2 * dampingRatio * frequencyRatio, 2)
        );
        
        return inputAmplitude * magnificationFactor;
    }

    // 计算悬臂梁在某一点的振动响应
    cantileverResponse(position, time, length, radius, youngModulus, density, excitationFreq, amplitude, mode = 1, damping = 0.01) {
        // 计算该模态的固有频率
        const naturalFreq = this.calculateNaturalFrequency(length, radius, youngModulus, density, mode);
        
        // 计算频率比
        const frequencyRatio = excitationFreq / naturalFreq;
        
        // 计算幅度放大因子
        const magnificationFactor = 1 / Math.sqrt(
            Math.pow(1 - frequencyRatio * frequencyRatio, 2) + 
            Math.pow(2 * damping * frequencyRatio, 2)
        );
        
        // 计算相位滞后
        const phaseDelay = Math.atan2(2 * damping * frequencyRatio, 1 - frequencyRatio * frequencyRatio);
        
        // 悬臂梁模态函数（简化版）
        const modeShape = Math.sin((position / length) * Math.PI / 2);
        
        // 计算位移响应
        return amplitude * magnificationFactor * modeShape * Math.sin(2 * Math.PI * excitationFreq * time - phaseDelay);
    }
} 