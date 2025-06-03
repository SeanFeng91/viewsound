/**
 * 可视化模块
 * 负责绘制波形图、频谱图等数据可视化
 */

class Visualization {
    constructor() {
        this.waveformPlot = null;
        this.frequencyPlot = null;
        this.resonancePlot = null; // 添加对共振图的引用
        this.waveformContainer = 'waveform-plot';
        this.frequencyContainer = 'frequency-plot';
        this.resonanceContainer = 'resonance-plot'; // 添加共振图容器ID
        this.timeWindow = 10; // 10秒时间窗口
        this.waveformData = new Map(); // 存储每个杆件的波形数据
        this.currentSelectedRod = 0; // 当前选中的杆件
        this.maxDataPoints = 1000; // 最大数据点数量，避免性能问题

        // 图表节流控制
        this.lastPlotUpdateTime = { 
            waveform: 0, 
            frequency: 0, 
            resonance: 0 
        };
        this.plotUpdateInterval = 200; // ms, 图表更新最小间隔 (5 FPS for charts)
    }

    /**
     * 初始化图表
     */
    init() {
        // 等待DOM元素准备就绪
        setTimeout(() => {
            this.initWaveformPlot();
            this.initFrequencyPlot();
            this.initResonancePlot();
            
            // 添加窗口resize事件监听器
            window.addEventListener('resize', () => {
                setTimeout(() => this.resize(), 100);
            });
        }, 100);
    }

    /**
     * 初始化波形图
     */
    initWaveformPlot() {
        const layout = {
            title: {
                text: '波形图',
                font: { color: '#f3f4f6', size: 14 }
            },
            xaxis: {
                title: '时间 (秒)',
                color: '#d1d5db',
                gridcolor: '#374151',
                showgrid: true,
                range: [0, this.timeWindow], // 固定10秒时间窗口
                autorange: false // 禁用自动范围调整
            },
            yaxis: {
                title: '幅度',
                color: '#d1d5db',
                gridcolor: '#374151',
                showgrid: true,
                autorange: true
            },
            plot_bgcolor: '#1f2937',
            paper_bgcolor: '#1f2937',
            font: { color: '#f3f4f6' },
            margin: { l: 50, r: 30, t: 40, b: 40 },
            showlegend: false
        };

        const config = {
            displayModeBar: false,
            responsive: true
        };

        const data = [{
            x: [],
            y: [],
            type: 'scatter',
            mode: 'lines',
            line: { color: '#60a5fa', width: 2 },
            name: '波形'
        }];

        Plotly.newPlot(this.waveformContainer, data, layout, config);
        const waveformPlotDiv = document.getElementById(this.waveformContainer);
        if (waveformPlotDiv) {
            // 强制设置容器样式，防止被压缩
            waveformPlotDiv.style.height = '320px';
            waveformPlotDiv.style.minHeight = '320px';
            waveformPlotDiv.style.width = '100%';
            waveformPlotDiv.style.display = 'block';
            
            // 延迟调用resize确保尺寸正确
            setTimeout(() => {
                Plotly.Plots.resize(waveformPlotDiv);
            }, 50);
        }
    }

    /**
     * 初始化频谱图
     */
    initFrequencyPlot() {
        const layout = {
            title: {
                text: '各杆件响应强度',
                font: { color: '#f3f4f6', size: 14 }
            },
            xaxis: {
                title: '杆件长度 (mm)',
                color: '#d1d5db',
                gridcolor: '#374151',
                showgrid: true,
                autorange: true
            },
            yaxis: {
                title: '放大因子',
                color: '#d1d5db',
                gridcolor: '#374151',
                showgrid: true,
                autorange: true
            },
            plot_bgcolor: '#1f2937',
            paper_bgcolor: '#1f2937',
            font: { color: '#f3f4f6' },
            margin: { l: 50, r: 30, t: 40, b: 40 },
            showlegend: false
        };

        const config = {
            displayModeBar: false,
            responsive: true
        };

        const data = [{
            x: [],
            y: [],
            type: 'scatter',
            mode: 'lines+markers',
            line: { color: '#10b981', width: 2 },
            marker: { color: '#10b981', size: 6 },
            name: '放大因子'
        }];

        Plotly.newPlot(this.frequencyContainer, data, layout, config);
        const frequencyPlotDiv = document.getElementById(this.frequencyContainer);
        if (frequencyPlotDiv) {
            Plotly.Plots.resize(frequencyPlotDiv); // Force resize
        }
    }

    /**
     * 初始化共振分析图表
     */
    initResonancePlot() {
        const layout = {
            title: {
                text: '共振分析 - 杆长vs固有频率',
                font: { color: '#f3f4f6', size: 14 }
            },
            xaxis: {
                title: '杆长 (mm)',
                color: '#d1d5db',
                gridcolor: '#374151',
                showgrid: true,
                autorange: true // Added for consistency
            },
            yaxis: {
                title: '固有频率 (Hz)',
                color: '#d1d5db',
                gridcolor: '#374151',
                showgrid: true,
                autorange: true // Added for consistency
            },
            plot_bgcolor: '#1f2937',
            paper_bgcolor: '#1f2937',
            font: { color: '#f3f4f6' },
            margin: { l: 50, r: 30, t: 40, b: 40 },
            showlegend: true,
            legend: { 
                bgcolor: 'rgba(17, 24, 39, 0.8)',
                bordercolor: '#4b5563',
                borderwidth: 1,
                x: 1,
                xanchor: 'right'
            }
        };

        const config = {
            displayModeBar: false,
            responsive: true
        };

        // 初始化空数据
        const data = [
            {
                x: [],
                y: [],
                type: 'scatter',
                mode: 'markers',
                name: '第1阶模态',
                marker: { color: '#60a5fa', size: 8 }
            },
            {
                x: [],
                y: [],
                type: 'scatter',
                mode: 'lines',
                name: '激励频率',
                line: { color: '#fbbf24', width: 3, dash: 'dash' }
            }
        ];

        Plotly.newPlot(this.resonanceContainer, data, layout, config);
        const resonancePlotDiv = document.getElementById(this.resonanceContainer);
        if (resonancePlotDiv) {
            Plotly.Plots.resize(resonancePlotDiv); // Force resize
        }
    }

    /**
     * 更新波形图 - 支持10秒滚动时间窗口
     * @param {number} rodIndex - 杆件索引
     * @param {Array} waveformData - 波形数据 [{time, amplitude}]
     */
    updateWaveformPlot(waveformData, rodIndex = null) {
        if (rodIndex !== null) {
            // 如果指定了杆件索引，存储该杆件的数据
            if (!this.waveformData.has(rodIndex)) {
                this.waveformData.set(rodIndex, []);
            }
            
            const rodData = this.waveformData.get(rodIndex);
            
            // 添加新数据点
            if (Array.isArray(waveformData)) {
                rodData.push(...waveformData);
            } else if (waveformData && typeof waveformData === 'object') {
                rodData.push(waveformData);
            }
            
            // 获取当前时间
            const currentTime = rodData.length > 0 ? Math.max(...rodData.map(d => d.time)) : 0;
            
            // 移除超出时间窗口的旧数据
            const cutoffTime = currentTime - this.timeWindow;
            const filteredData = rodData.filter(d => d.time >= cutoffTime);
            this.waveformData.set(rodIndex, filteredData);
            
            // 限制数据点数量以避免性能问题
            if (filteredData.length > this.maxDataPoints) {
                const step = Math.ceil(filteredData.length / this.maxDataPoints);
                const sampledData = filteredData.filter((_, i) => i % step === 0);
                this.waveformData.set(rodIndex, sampledData);
            }
        }
        
        // 显示当前选中杆件的数据
        this.displayCurrentRodWaveform();
    }
    
    /**
     * 显示当前选中杆件的波形数据 (节流)
     */
    displayCurrentRodWaveform() {
        const now = Date.now();
        if (now - this.lastPlotUpdateTime.waveform < this.plotUpdateInterval) {
            return; // 节流，不到更新时间
        }
        this.lastPlotUpdateTime.waveform = now;

        const currentData = this.waveformData.get(this.currentSelectedRod) || [];
        
        if (currentData.length === 0) {
            // 如果没有数据，也需要调用Plotly来清空，但可以减少调用频率
            Plotly.react(this.waveformContainer, [{
                x: [], y: [], type: 'scatter', mode: 'lines',
                line: { color: '#60a5fa', width: 2 }, name: '波形'
            }]).catch(err => console.error('Plotly react error (waveform clear):', err));
            return;
        }
        
        const times = currentData.map(d => d.time);
        const amplitudes = currentData.map(d => d.amplitude);
        
        const currentTime = times.length > 0 ? Math.max(...times) : 0;
        const windowStart = Math.max(0, currentTime - this.timeWindow);
        const windowEnd = windowStart + this.timeWindow;
        
        const traceData = [{
            x: times,
            y: amplitudes,
            type: 'scatter',
            mode: 'lines',
            line: { color: '#60a5fa', width: 2 },
            name: '波形'
        }];

        const layoutUpdate = {
            'xaxis.range': [windowStart, windowEnd],
            'yaxis.autorange': true // 保持Y轴自动范围
        };

        Plotly.react(this.waveformContainer, traceData, layoutUpdate).catch(err => console.error('Plotly react error (waveform):', err));
    }
    
    /**
     * 更新当前选中的杆件并切换波形显示
     * @param {number} rodIndex - 杆件索引
     */
    updateWaveformForRod(rodIndex) {
        this.currentSelectedRod = rodIndex;
        this.displayCurrentRodWaveform();
        console.log(`波形图切换到杆件 ${rodIndex + 1}`);
    }
    
    /**
     * 清空指定杆件的波形数据
     * @param {number} rodIndex - 杆件索引，如果不指定则清空所有
     */
    clearWaveformData(rodIndex = null) {
        if (rodIndex !== null) {
            this.waveformData.delete(rodIndex);
        } else {
            this.waveformData.clear();
        }
        this.displayCurrentRodWaveform();
    }

    /**
     * 更新频率响应图 (节流)
     * @param {Array} frequencyData - 频率数据 [{length, amplitude, isResonant}]
     */
    updateFrequencyPlot(frequencyData) {
        const now = Date.now();
        if (now - this.lastPlotUpdateTime.frequency < this.plotUpdateInterval) {
            return; // 节流
        }
        this.lastPlotUpdateTime.frequency = now;

        if (!frequencyData || frequencyData.length === 0) {
            this.clearFrequencyPlot();
            return;
        }

        const rodLengths = frequencyData.map(d => d.length);
        const amplitudes = frequencyData.map(d => d.amplitude);
        const colors = frequencyData.map(d => d.isResonant ? '#ef4444' : '#10b981');

        const updatedTrace = {
            x: rodLengths, 
            y: amplitudes, 
            type: 'scatter',
            mode: 'lines+markers',
            marker: { 
                color: colors,
                size: 8,
                line: { color: 'rgba(255,255,255,0.3)', width: 1 }
            },
            name: '放大因子'
        };
        
        const layoutUpdate = {
            'yaxis.autorange': true,
            'xaxis.autorange': true
        };

        Plotly.react(this.frequencyContainer, [updatedTrace], layoutUpdate)
            .catch(err => console.error('Plotly react error (frequency):', err));
    }

    /**
     * 清空波形图
     */
    clearWaveformPlot() {
        const update = {
            x: [[]],
            y: [[]]
        };
        Plotly.restyle(this.waveformContainer, update, [0]);
    }

    /**
     * 清空频谱图
     */
    clearFrequencyPlot() {
        const update = {
            x: [[]],
            y: [[]]
        };
        Plotly.restyle(this.frequencyContainer, update, [0]);
    }

    /**
     * 绘制生成的正弦波
     * @param {number} frequency - 频率
     * @param {number} duration - 持续时间
     * @param {number} amplitude - 幅度
     */
    plotGeneratedSineWave(frequency, duration, amplitude = 1.0) {
        const sampleRate = 1000; // 采样率
        const numSamples = sampleRate * duration;
        const waveformData = [];

        for (let i = 0; i < numSamples; i++) {
            const time = i / sampleRate;
            const value = amplitude * Math.sin(2 * Math.PI * frequency * time);
            waveformData.push({ time, amplitude: value });
        }

        this.updateWaveformPlot(waveformData);

        // 绘制频谱（单一频率）
        const frequencyData = [
            { frequency: frequency, amplitude: amplitude }
        ];
        this.updateFrequencyPlot(frequencyData);
    }

    /**
     * 绘制扫频信号
     * @param {number} startFreq - 起始频率
     * @param {number} endFreq - 结束频率
     * @param {number} duration - 持续时间
     * @param {number} amplitude - 幅度
     */
    plotSweepSignal(startFreq, endFreq, duration, amplitude = 1.0) {
        const sampleRate = 1000;
        const numSamples = sampleRate * duration;
        const waveformData = [];

        for (let i = 0; i < numSamples; i++) {
            const time = i / sampleRate;
            const freq = startFreq + (endFreq - startFreq) * (time / duration);
            const value = amplitude * Math.sin(2 * Math.PI * freq * time);
            waveformData.push({ time, amplitude: value });
        }

        this.updateWaveformPlot(waveformData);

        // 扫频信号的频谱是连续的
        const frequencyData = [];
        const freqStep = (endFreq - startFreq) / 100;
        for (let f = startFreq; f <= endFreq; f += freqStep) {
            frequencyData.push({ 
                frequency: f, 
                amplitude: amplitude * 0.5 // 扫频信号每个频率的能量较小
            });
        }
        this.updateFrequencyPlot(frequencyData);
    }

    /**
     * 显示音频文件的波形和频谱
     * @param {AudioBuffer} audioBuffer - 音频缓冲区
     */
    plotAudioFile(audioBuffer) {
        if (!audioBuffer) return;

        // 获取并显示波形
        const waveformData = audioProcessor.getWaveformData(audioBuffer, 1000);
        this.updateWaveformPlot(waveformData);

        // 分析并显示频谱
        const frequencyData = audioProcessor.analyzeAudioFrequency();
        this.updateFrequencyPlot(frequencyData);
    }

    /**
     * 绘制杆件共振频率对比图
     * @param {Array} rodStatusList - 杆件状态列表
     * @param {number} excitationFreq - 激励频率
     */
    plotResonanceComparison(rodStatusList, excitationFreq) {
        // 创建一个新的图表显示杆件共振频率
        const resonanceData = [];
        const colors = [];
        
        rodStatusList.forEach(rod => {
            rod.naturalFrequencies.forEach((freq, modeIndex) => {
                resonanceData.push({
                    x: rod.length,
                    y: freq,
                    mode: modeIndex + 1,
                    isResonant: Math.abs(freq - excitationFreq) <= freq * 0.05
                });
            });
        });

        // 按模态分组数据
        const modeGroups = {};
        resonanceData.forEach(point => {
            if (!modeGroups[point.mode]) {
                modeGroups[point.mode] = { x: [], y: [], colors: [] };
            }
            modeGroups[point.mode].x.push(point.x);
            modeGroups[point.mode].y.push(point.y);
            modeGroups[point.mode].colors.push(point.isResonant ? '#ff4444' : '#60a5fa');
        });

        // 创建图表数据
        const traces = [];
        Object.keys(modeGroups).forEach(mode => {
            const group = modeGroups[mode];
            traces.push({
                x: group.x,
                y: group.y,
                mode: 'markers',
                type: 'scatter',
                name: `${mode}阶模态`,
                marker: {
                    color: group.colors,
                    size: 8,
                    line: { width: 1, color: '#ffffff' }
                }
            });
        });

        // 添加激励频率线
        traces.push({
            x: [Math.min(...rodStatusList.map(r => r.length)), Math.max(...rodStatusList.map(r => r.length))],
            y: [excitationFreq, excitationFreq],
            mode: 'lines',
            type: 'scatter',
            name: '激励频率',
            line: { color: '#fbbf24', width: 3, dash: 'dash' }
        });

        const layout = {
            title: {
                text: '杆件共振频率对比',
                font: { color: '#f3f4f6', size: 16 }
            },
            xaxis: {
                title: '杆长 (mm)',
                color: '#d1d5db',
                gridcolor: '#374151'
            },
            yaxis: {
                title: '频率 (Hz)',
                color: '#d1d5db',
                gridcolor: '#374151'
            },
            plot_bgcolor: '#1f2937',
            paper_bgcolor: '#1f2937',
            font: { color: '#f3f4f6' },
            showlegend: true,
            legend: { 
                bgcolor: 'rgba(17, 24, 39, 0.8)',
                bordercolor: '#4b5563',
                borderwidth: 1
            }
        };

        // 如果容器不存在，创建一个新的
        const containerId = 'resonance-comparison-plot';
        if (!document.getElementById(containerId)) {
            const container = document.createElement('div');
            container.id = containerId;
            container.style.width = '100%';
            container.style.height = '300px';
            container.style.margin = '10px 0';
            document.getElementById('frequency-plot').parentNode.appendChild(container);
        }

        Plotly.newPlot(containerId, traces, layout, { displayModeBar: false, responsive: true });
    }

    /**
     * 实时更新杆件状态显示
     * @param {Array} rodStatusList - 杆件状态列表
     */
    updateRodStatusDisplay(rodStatusList) {
        const container = document.getElementById('rodStatusList');
        if (!container) return;

        container.innerHTML = '';

        rodStatusList.forEach(rod => {
            const statusDiv = document.createElement('div');
            statusDiv.className = `rod-status ${rod.isResonant ? 'rod-resonant' : ''}`;
            
            const resonantText = rod.isResonant ? ' (共振!)' : '';
            statusDiv.innerHTML = `
                <div style="font-weight: bold;">杆 ${rod.index}: ${rod.length}mm${resonantText}</div>
                <div style="font-size: 11px; margin-top: 2px;">
                    固有频率: ${rod.naturalFrequencies.slice(0, 2).join(', ')} Hz
                </div>
                <div style="font-size: 10px; color: #9ca3af;">
                    材料: ${rod.material}
                </div>
            `;
            
            container.appendChild(statusDiv);
        });
    }

    /**
     * 调整图表大小
     */
    resize() {
        if (document.getElementById(this.waveformContainer)) {
            Plotly.Plots.resize(this.waveformContainer);
        }
        if (document.getElementById(this.frequencyContainer)) {
            Plotly.Plots.resize(this.frequencyContainer);
        }
        if (document.getElementById(this.resonanceContainer)) {
            Plotly.Plots.resize(this.resonanceContainer);
        }
    }

    /**
     * 更新共振分析图表 (节流)
     * @param {Array} rodData - 杆件数据 [{length, naturalFreq, isResonant}]
     * @param {number} excitationFreq - 当前激励频率
     */
    updateResonancePlot(rodData, excitationFreq) {
        const now = Date.now();
        if (now - this.lastPlotUpdateTime.resonance < this.plotUpdateInterval) {
            return; // 节流
        }
        this.lastPlotUpdateTime.resonance = now;

        if (!rodData || !Array.isArray(rodData) || rodData.length === 0) { // Added empty check for safety
            console.warn('updateResonancePlot: rodData is invalid or empty', rodData);
            // Optionally clear the plot if data is empty
            // Plotly.react(this.resonanceContainer, [], this.resonancePlotLayout || {}); 
            return;
        }

        const lengths = rodData.map(r => r.length);
        const naturalFreqs = rodData.map(r => r.naturalFreq);
        const colors = rodData.map(r => r.isResonant ? '#ef4444' : '#60a5fa');
        const sizes = rodData.map(r => r.isResonant ? 10 : 8);
        const symbols = rodData.map(r => r.isResonant ? 'diamond' : 'circle');

        const minLength = Math.min(...lengths, 0);
        const maxLength = Math.max(...lengths, 100);

        const update = {
            data: [
                { // 第1阶模态
                    x: lengths,
                    y: naturalFreqs,
                    type: 'scatter',
                    mode: 'markers',
                    name: '第1阶模态', // Added name
                    marker: { color: colors, size: sizes, symbol: symbols }
                },
                { // 激励频率线
                    x: [minLength, maxLength],
                    y: [excitationFreq, excitationFreq],
                    type: 'scatter',
                    mode: 'lines',
                    name: '激励频率', // Added name
                    line: { color: '#fbbf24', width: 3, dash: