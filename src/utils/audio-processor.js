/**
 * 音频处理模块
 * 处理音频文件上传、分析、声音生成等功能
 */

class AudioProcessor {
    constructor() {
        this.audioContext = null;
        this.audioBuffer = null;
        this.sourceNode = null;
        this.analyser = null;
        this.isPlaying = false;
        this.currentAudioFile = null;
        this.generatedAudioBuffer = null;
        
        this.initAudioContext();
    }

    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.error('Web Audio API not supported:', e);
        }
    }

    /**
     * 处理音频文件上传
     * @param {File} file - 音频文件
     * @returns {Promise} 处理结果
     */
    async processAudioFile(file) {
        try {
            this.currentAudioFile = file;
            const arrayBuffer = await file.arrayBuffer();
            this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            return {
                success: true,
                duration: this.audioBuffer.duration,
                sampleRate: this.audioBuffer.sampleRate,
                channels: this.audioBuffer.numberOfChannels
            };
        } catch (error) {
            console.error('音频文件处理失败:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 分析音频频率内容
     * @returns {Array} 频率分析结果
     */
    analyzeAudioFrequency() {
        if (!this.audioBuffer) return [];

        const channelData = this.audioBuffer.getChannelData(0);
        const sampleRate = this.audioBuffer.sampleRate;
        const fftSize = 2048;
        const frequencyBins = [];

        // 使用FFT分析频率内容
        for (let i = 0; i < channelData.length; i += fftSize) {
            const segment = channelData.slice(i, i + fftSize);
            if (segment.length === fftSize) {
                const fftResult = this.performFFT(segment);
                frequencyBins.push(fftResult);
            }
        }

        // 计算平均频谱
        const avgSpectrum = this.calculateAverageSpectrum(frequencyBins);
        return this.convertToFrequencyData(avgSpectrum, sampleRate);
    }

    /**
     * 简化的FFT实现（用于演示，实际项目中建议使用专业库）
     * @param {Float32Array} data - 输入数据
     * @returns {Array} FFT结果
     */
    performFFT(data) {
        const N = data.length;
        const spectrum = new Array(N / 2);
        
        for (let k = 0; k < N / 2; k++) {
            let real = 0, imag = 0;
            for (let n = 0; n < N; n++) {
                const angle = -2 * Math.PI * k * n / N;
                real += data[n] * Math.cos(angle);
                imag += data[n] * Math.sin(angle);
            }
            spectrum[k] = Math.sqrt(real * real + imag * imag);
        }
        
        return spectrum;
    }

    /**
     * 计算平均频谱
     * @param {Array} spectrums - 频谱数组
     * @returns {Array} 平均频谱
     */
    calculateAverageSpectrum(spectrums) {
        if (spectrums.length === 0) return [];
        
        const length = spectrums[0].length;
        const average = new Array(length).fill(0);
        
        for (const spectrum of spectrums) {
            for (let i = 0; i < length; i++) {
                average[i] += spectrum[i];
            }
        }
        
        return average.map(val => val / spectrums.length);
    }

    /**
     * 转换为频率数据
     * @param {Array} spectrum - 频谱数据
     * @param {number} sampleRate - 采样率
     * @returns {Array} 频率数据
     */
    convertToFrequencyData(spectrum, sampleRate) {
        const frequencyData = [];
        for (let i = 0; i < spectrum.length; i++) {
            const frequency = (i * sampleRate) / (2 * spectrum.length);
            if (frequency >= 20 && frequency <= 2000) { // 只保留感兴趣的频率范围
                frequencyData.push({
                    frequency: frequency,
                    amplitude: spectrum[i]
                });
            }
        }
        return frequencyData;
    }

    /**
     * 生成正弦波音频
     * @param {number} frequency - 频率 (Hz)
     * @param {number} duration - 持续时间 (秒)
     * @param {number} amplitude - 幅度 (0-1)
     * @returns {AudioBuffer} 生成的音频缓冲区
     */
    generateSineWave(frequency, duration, amplitude = 0.5) {
        const sampleRate = this.audioContext.sampleRate;
        const numSamples = sampleRate * duration;
        
        this.generatedAudioBuffer = this.audioContext.createBuffer(1, numSamples, sampleRate);
        const channelData = this.generatedAudioBuffer.getChannelData(0);
        
        for (let i = 0; i < numSamples; i++) {
            const t = i / sampleRate;
            channelData[i] = amplitude * Math.sin(2 * Math.PI * frequency * t);
        }
        
        return this.generatedAudioBuffer;
    }

    /**
     * 生成扫频信号
     * @param {number} startFreq - 起始频率 (Hz)
     * @param {number} endFreq - 结束频率 (Hz)
     * @param {number} duration - 持续时间 (秒)
     * @param {number} amplitude - 幅度 (0-1)
     * @returns {AudioBuffer} 生成的音频缓冲区
     */
    generateSweepSignal(startFreq, endFreq, duration, amplitude = 0.5) {
        const sampleRate = this.audioContext.sampleRate;
        const numSamples = sampleRate * duration;
        
        this.generatedAudioBuffer = this.audioContext.createBuffer(1, numSamples, sampleRate);
        const channelData = this.generatedAudioBuffer.getChannelData(0);
        
        for (let i = 0; i < numSamples; i++) {
            const t = i / sampleRate;
            const freq = startFreq + (endFreq - startFreq) * (t / duration);
            channelData[i] = amplitude * Math.sin(2 * Math.PI * freq * t);
        }
        
        return this.generatedAudioBuffer;
    }

    /**
     * 播放音频缓冲区
     * @param {AudioBuffer} audioBuffer - 要播放的音频缓冲区
     * @param {Function} onEnded - 播放结束回调
     */
    playAudioBuffer(audioBuffer, onEnded = null) {
        console.log('[AudioProcessor.playAudioBuffer] 开始播放指定的 audioBuffer。');
        if (!this.audioContext) {
            console.error('[AudioProcessor.playAudioBuffer] AudioContext 未初始化!');
            return false;
        }
        if (!audioBuffer) {
            console.error('[AudioProcessor.playAudioBuffer] 传入的 audioBuffer 为 null!');
            return false;
        }

        console.log('[AudioProcessor.playAudioBuffer] AudioContext 状态:', this.audioContext.state);
        console.log('[AudioProcessor.playAudioBuffer] AudioBuffer 详情:', {
            duration: audioBuffer.duration,
            sampleRate: audioBuffer.sampleRate,
            numberOfChannels: audioBuffer.numberOfChannels,
            length: audioBuffer.length
        });

        if (this.isPlaying) {
            console.log('[AudioProcessor.playAudioBuffer] 当前有音频正在播放，先停止旧的。');
            this.stopAudio();
        }

        try {
            this.sourceNode = this.audioContext.createBufferSource();
            this.sourceNode.buffer = audioBuffer;
            this.sourceNode.connect(this.audioContext.destination);
            console.log('[AudioProcessor.playAudioBuffer] sourceNode 已创建并连接。');
            
            this.sourceNode.onended = () => {
                console.log('[AudioProcessor.playAudioBuffer] sourceNode onended 事件触发。');
                this.isPlaying = false;
                if (typeof onEnded === 'function') {
                    onEnded();
                }
            };
            
            this.sourceNode.start();
            this.isPlaying = true;
            console.log('[AudioProcessor.playAudioBuffer] sourceNode.start() 已调用，播放开始。');
            return true;
        } catch (e) {
            console.error('[AudioProcessor.playAudioBuffer] sourceNode.start() 失败:', e);
            this.isPlaying = false; // 确保状态正确
            return false;
        }
    }

    /**
     * 播放当前音频文件
     * @param {Function} onEnded - 播放结束回调
     */
    playCurrentAudio(onEnded = null) {
        console.log('[AudioProcessor.playCurrentAudio] 尝试播放当前音频。');
        if (this.audioBuffer) {
            console.log('[AudioProcessor.playCurrentAudio] audioBuffer 存在。');
            this.playAudioBuffer(this.audioBuffer, onEnded);
        } else {
            console.warn('[AudioProcessor.playCurrentAudio] audioBuffer 为 null，无法播放。');
        }
    }

    /**
     * 播放生成的声音
     * @param {Function} onEnded - 播放结束回调
     */
    playGeneratedSound(onEnded = null) {
        if (this.generatedAudioBuffer) {
            this.playAudioBuffer(this.generatedAudioBuffer, onEnded);
        }
    }

    /**
     * 生成单音调（generateSineWave的便捷方法）
     * @param {number} frequency - 频率 (Hz)
     * @param {number} duration - 持续时间 (秒)
     * @param {number} amplitude - 幅度 (0-1，默认0.5)
     * @returns {AudioBuffer} 生成的音频缓冲区
     */
    generateTone(frequency, duration, amplitude = 0.5) {
        console.log(`[AudioProcessor.generateTone] 生成音调: ${frequency}Hz, ${duration}s, 幅度: ${amplitude}`);
        return this.generateSineWave(frequency, duration, amplitude);
    }

    /**
     * 停止音频播放
     */
    stopAudio() {
        if (this.sourceNode && this.isPlaying) {
            this.sourceNode.stop();
            this.isPlaying = false;
        }
    }

    /**
     * 获取音频的时域数据（用于波形显示）
     * @param {AudioBuffer} audioBuffer - 音频缓冲区
     * @param {number} maxPoints - 最大数据点数
     * @returns {Array} 时域数据
     */
    getWaveformData(audioBuffer, maxPoints = 1000) {
        if (!audioBuffer) return [];
        
        const channelData = audioBuffer.getChannelData(0);
        const sampleRate = audioBuffer.sampleRate;
        const step = Math.ceil(channelData.length / maxPoints);
        const waveformData = [];
        
        for (let i = 0; i < channelData.length; i += step) {
            const time = i / sampleRate;
            waveformData.push({
                time: time,
                amplitude: channelData[i]
            });
        }
        
        return waveformData;
    }

    /**
     * 从音频中提取主要频率成分
     * @returns {Array} 主要频率列表
     */
    extractDominantFrequencies() {
        const frequencyData = this.analyzeAudioFrequency();
        if (frequencyData.length === 0) return [];
        
        // 找出幅度较大的频率成分
        const sortedByAmplitude = frequencyData
            .filter(item => item.frequency >= 20 && item.frequency <= 2000)
            .sort((a, b) => b.amplitude - a.amplitude);
        
        // 返回前10个主要频率
        return sortedByAmplitude.slice(0, 10).map(item => ({
            frequency: Math.round(item.frequency),
            amplitude: item.amplitude
        }));
    }
}

// 确保类导出到全局作用域
window.AudioProcessor = AudioProcessor; 