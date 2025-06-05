/**
 * 可视化模块 - 基于D3.js
 * 负责绘制波形图、频谱图等数据可视化
 */

class Visualization {
    constructor() {
        this.waveformContainer = 'waveform-plot';
        this.frequencyContainer = 'frequency-plot';
        this.resonanceContainer = 'resonance-plot';
        this.timeWindow = 10; // 10秒时间窗口
        this.waveformData = new Map(); // 存储每个杆件的波形数据
        this.currentSelectedRod = 0; // 当前选中的杆件
        this.maxDataPoints = 1000; // 最大数据点数量，避免性能问题

        // 图表边距配置 - 减少边距让图表更大
        this.chartMargin = { top: 20, right: 30, bottom: 40, left: 50 };

        // 图表节流控制
        this.lastPlotUpdateTime = { 
            waveform: 0, 
            frequency: 0, 
            resonance: 0 
        };
        this.plotUpdateInterval = 100; // ms, 图表更新间隔

        // D3图表实例
        this.waveformChart = null;
        this.frequencyChart = null;
        this.resonanceChart = null;
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
     * 获取容器的实际尺寸
     */
    getContainerSize(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            return { width: 400, height: 200 }; // 默认尺寸
        }
        const rect = container.getBoundingClientRect();
        return {
            width: Math.max(rect.width, 200),
            height: Math.max(rect.height, 150)
        };
    }

    /**
     * 初始化波形图 - D3.js实现
     */
    initWaveformPlot() {
        const container = d3.select(`#${this.waveformContainer}`);
        container.selectAll('*').remove(); // 清空现有内容
        
        const containerSize = this.getContainerSize(this.waveformContainer);
        const margin = this.chartMargin;
        const innerWidth = containerSize.width - margin.left - margin.right;
        const innerHeight = containerSize.height - margin.top - margin.bottom;

        // 创建SVG - 完全填充容器
        const svg = container
            .append('svg')
            .style('width', '100%')
            .style('height', '100%')
            .attr('viewBox', `0 0 ${containerSize.width} ${containerSize.height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');

        // 创建渐变定义
        const defs = svg.append('defs');
        const gradient = defs.append('linearGradient')
            .attr('id', 'waveform-gradient')
            .attr('gradientUnits', 'userSpaceOnUse')
            .attr('x1', 0).attr('y1', innerHeight)
            .attr('x2', 0).attr('y2', 0);
        
        gradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', '#3b82f6')
            .attr('stop-opacity', 0.1);
        
        gradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', '#3b82f6')
            .attr('stop-opacity', 0.8);

        // 主绘图区域
        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // 创建比例尺
        const xScale = d3.scaleLinear()
            .domain([0, this.timeWindow])
            .range([0, innerWidth]);

        const yScale = d3.scaleLinear()
            .domain([-0.01, 0.01])
            .range([innerHeight, 0]);

        // 创建坐标轴
        const xAxis = d3.axisBottom(xScale)
            .tickSize(-innerHeight)
            .tickFormat(d => `${d}s`);

        const yAxis = d3.axisLeft(yScale)
            .tickSize(-innerWidth)
            .tickFormat(d => `${(d * 1000).toFixed(1)}mm`);

        // 添加网格和坐标轴
        g.append('g')
            .attr('class', 'grid')
            .attr('transform', `translate(0,${innerHeight})`)
            .call(xAxis)
            .selectAll('line')
            .style('stroke', '#374151')
            .style('stroke-dasharray', '2,2');

        g.append('g')
            .attr('class', 'grid')
            .call(yAxis)
            .selectAll('line')
            .style('stroke', '#374151')
            .style('stroke-dasharray', '2,2');

        // 简化标签样式
        g.append('text')
            .attr('class', 'axis-label')
            .attr('text-anchor', 'middle')
            .attr('x', innerWidth / 2)
            .attr('y', innerHeight + 35)
            .style('fill', '#d1d5db')
            .style('font-size', '11px')
            .text('时间 (秒)');

        g.append('text')
            .attr('class', 'axis-label')
            .attr('text-anchor', 'middle')
            .attr('transform', 'rotate(-90)')
            .attr('y', -35)
            .attr('x', -innerHeight / 2)
            .style('fill', '#d1d5db')
            .style('font-size', '11px')
            .text('振幅 (mm)');

        // 创建线条生成器
        const line = d3.line()
            .x(d => xScale(d.time))
            .y(d => yScale(d.amplitude))
            .curve(d3.curveMonotoneX);

        // 添加路径容器
        g.append('path')
            .attr('class', 'waveform-line')
            .style('fill', 'none')
            .style('stroke', '#60a5fa')
            .style('stroke-width', 2);

        // 添加面积图
        const area = d3.area()
            .x(d => xScale(d.time))
            .y0(innerHeight)
            .y1(d => yScale(d.amplitude))
            .curve(d3.curveMonotoneX);

        g.append('path')
            .attr('class', 'waveform-area')
            .style('fill', 'url(#waveform-gradient)');
            
        // 保存图表引用
        this.waveformChart = {
            svg, g, xScale, yScale, line, area, innerWidth, innerHeight, 
            containerSize, margin
        };
    }

    /**
     * 初始化频率响应图 - D3.js实现
     */
    initFrequencyPlot() {
        const container = d3.select(`#${this.frequencyContainer}`);
        container.selectAll('*').remove();
        
        const containerSize = this.getContainerSize(this.frequencyContainer);
        const margin = this.chartMargin;
        const innerWidth = containerSize.width - margin.left - margin.right;
        const innerHeight = containerSize.height - margin.top - margin.bottom;

        // 创建SVG - 完全填充容器
        const svg = container
            .append('svg')
            .style('width', '100%')
            .style('height', '100%')
            .attr('viewBox', `0 0 ${containerSize.width} ${containerSize.height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');

        // 主绘图区域
        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // 创建比例尺
        const xScale = d3.scaleLinear()
            .domain([0, 100])
            .range([0, innerWidth]);

        const yScale = d3.scaleLinear()
            .domain([0, 10])
            .range([innerHeight, 0]);

        // 创建坐标轴
        const xAxis = d3.axisBottom(xScale)
            .tickSize(-innerHeight)
            .tickFormat(d => `${d}mm`);

        const yAxis = d3.axisLeft(yScale)
            .tickSize(-innerWidth);

        // 添加网格和坐标轴
        g.append('g')
            .attr('class', 'grid')
            .attr('transform', `translate(0,${innerHeight})`)
            .call(xAxis)
            .selectAll('line')
            .style('stroke', '#374151')
            .style('stroke-dasharray', '2,2');

        g.append('g')
            .attr('class', 'grid')
            .call(yAxis)
            .selectAll('line')
            .style('stroke', '#374151')
            .style('stroke-dasharray', '2,2');

        // 简化标签样式
        g.append('text')
            .attr('class', 'axis-label')
            .attr('text-anchor', 'middle')
            .attr('x', innerWidth / 2)
            .attr('y', innerHeight + 35)
            .style('fill', '#d1d5db')
            .style('font-size', '11px')
            .text('杆件长度 (mm)');

        g.append('text')
            .attr('class', 'axis-label')
            .attr('text-anchor', 'middle')
            .attr('transform', 'rotate(-90)')
            .attr('y', -35)
            .attr('x', -innerHeight / 2)
            .style('fill', '#d1d5db')
            .style('font-size', '11px')
            .text('响应强度');
            
        // 保存图表引用
        this.frequencyChart = {
            svg, g, xScale, yScale, innerWidth, innerHeight,
            containerSize, margin
        };
    }

    /**
     * 初始化共振分析图 - D3.js实现
     */
    initResonancePlot() {
        const container = d3.select(`#${this.resonanceContainer}`);
        container.selectAll('*').remove();
        
        const containerSize = this.getContainerSize(this.resonanceContainer);
        const margin = this.chartMargin;
        const innerWidth = containerSize.width - margin.left - margin.right;
        const innerHeight = containerSize.height - margin.top - margin.bottom;

        // 创建SVG - 完全填充容器
        const svg = container
            .append('svg')
            .style('width', '100%')
            .style('height', '100%')
            .attr('viewBox', `0 0 ${containerSize.width} ${containerSize.height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');

        // 主绘图区域
        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // 创建比例尺
        const xScale = d3.scaleLinear()
            .domain([0, 100])
            .range([0, innerWidth]);

        const yScale = d3.scaleLinear()
            .domain([0, 1000])
            .range([innerHeight, 0]);

        // 创建坐标轴
        const xAxis = d3.axisBottom(xScale)
            .tickSize(-innerHeight)
            .tickFormat(d => `${d}mm`);

        const yAxis = d3.axisLeft(yScale)
            .tickSize(-innerWidth)
            .tickFormat(d => `${d}Hz`);

        // 添加网格和坐标轴
        g.append('g')
            .attr('class', 'grid')
            .attr('transform', `translate(0,${innerHeight})`)
            .call(xAxis)
            .selectAll('line')
            .style('stroke', '#374151')
            .style('stroke-dasharray', '2,2');

        g.append('g')
            .attr('class', 'grid')
            .call(yAxis)
            .selectAll('line')
            .style('stroke', '#374151')
            .style('stroke-dasharray', '2,2');

        // 简化标签样式
        g.append('text')
            .attr('class', 'axis-label')
            .attr('text-anchor', 'middle')
            .attr('x', innerWidth / 2)
            .attr('y', innerHeight + 35)
            .style('fill', '#d1d5db')
            .style('font-size', '11px')
            .text('杆件长度 (mm)');

        g.append('text')
            .attr('class', 'axis-label')
            .attr('text-anchor', 'middle')
            .attr('transform', 'rotate(-90)')
            .attr('y', -35)
            .attr('x', -innerHeight / 2)
            .style('fill', '#d1d5db')
            .style('font-size', '11px')
            .text('频率 (Hz)');

        // 保存图表引用
        this.resonanceChart = {
            svg, g, xScale, yScale, innerWidth, innerHeight,
            containerSize, margin
        };
    }

    /**
     * 更新波形图数据
     */
    updateWaveformPlot(waveformData, rodIndex = null) {
        const now = Date.now();
        if (now - this.lastPlotUpdateTime.waveform < this.plotUpdateInterval) {
            return;
        }
        this.lastPlotUpdateTime.waveform = now;

        if (!this.waveformChart || !waveformData) {
            return;
        }

        const actualRodIndex = rodIndex !== null ? rodIndex : this.currentSelectedRod;
        
        // 存储数据 - 累积添加到现有数据中
        if (!this.waveformData.has(actualRodIndex)) {
            this.waveformData.set(actualRodIndex, []);
            }
            
        const rodData = this.waveformData.get(actualRodIndex);
        waveformData.forEach(point => {
            rodData.push({
                time: point.time,
                amplitude: point.amplitude
            });
        });

        // 限制数据点数量
        if (rodData.length > this.maxDataPoints) {
            rodData.splice(0, rodData.length - this.maxDataPoints);
            }
            
        // 过滤时间窗口内的数据（最近10秒）
        const currentTime = rodData.length > 0 ? rodData[rodData.length - 1].time : 0;
        const windowStart = Math.max(0, currentTime - this.timeWindow);
        const visibleData = rodData.filter(d => d.time >= windowStart);

        if (visibleData.length === 0) return;

        // 只更新当前选中杆件的显示
        if (actualRodIndex === this.currentSelectedRod) {
            this.renderWaveformData(visibleData, windowStart);
        }
    }

    /**
     * 渲染波形数据
     */
    renderWaveformData(data, windowStart = null) {
        if (!this.waveformChart || !data || data.length === 0) {
            return;
        }

        const { g, xScale, yScale, line, area } = this.waveformChart;

        // 更新比例尺域
        let timeExtent, amplitudeExtent;
        
        if (windowStart !== null) {
            // 使用固定的时间窗口（滚动显示）
            timeExtent = [windowStart, windowStart + this.timeWindow];
        } else {
            // 使用数据的实际时间范围
            timeExtent = d3.extent(data, d => d.time);
        }
        
        amplitudeExtent = d3.extent(data, d => d.amplitude);
        
        if (timeExtent[0] !== undefined && timeExtent[1] !== undefined) {
            xScale.domain(timeExtent);
        }
        
        if (amplitudeExtent[0] !== undefined && amplitudeExtent[1] !== undefined) {
            const padding = Math.abs(amplitudeExtent[1] - amplitudeExtent[0]) * 0.1 || 0.001;
            yScale.domain([amplitudeExtent[0] - padding, amplitudeExtent[1] + padding]);
        }

        // 更新坐标轴
        g.select('.grid').transition().duration(100)
            .call(d3.axisBottom(xScale).tickSize(-this.waveformChart.innerHeight));
        g.selectAll('.grid').selectAll('line')
            .style('stroke', '#374151')
            .style('stroke-dasharray', '2,2');

        // 更新波形线
        g.select('.waveform-line')
            .datum(data)
            .transition()
            .duration(100)
            .attr('d', line);

        // 更新面积图
        g.select('.waveform-area')
            .datum(data)
            .transition()
            .duration(100)
            .attr('d', area);
    }
    
    /**
     * 更新频率响应图
     */
    updateFrequencyPlot(frequencyData) {
        const now = Date.now();
        if (now - this.lastPlotUpdateTime.frequency < this.plotUpdateInterval) {
            return;
        }
        this.lastPlotUpdateTime.frequency = now;

        if (!this.frequencyChart || !frequencyData || frequencyData.length === 0) {
            return;
        }
        
        const { g, xScale, yScale } = this.frequencyChart;

        // 更新比例尺域
        const xExtent = d3.extent(frequencyData, d => d.length);
        const yExtent = d3.extent(frequencyData, d => d.amplitude);
        
        xScale.domain([xExtent[0] - 5, xExtent[1] + 5]);
        yScale.domain([0, Math.max(yExtent[1] * 1.1, 5)]);

        // 更新坐标轴
        g.select('.grid').transition().duration(200)
            .call(d3.axisBottom(xScale).tickSize(-this.frequencyChart.innerHeight));
        g.selectAll('.grid').selectAll('line')
            .style('stroke', '#374151')
            .style('stroke-dasharray', '2,2');

        // 绑定数据并更新点
        const circles = g.selectAll('.data-point')
            .data(frequencyData, d => d.length);

        circles.enter()
            .append('circle')
            .attr('class', 'data-point')
            .attr('r', 0)
            .merge(circles)
            .transition()
            .duration(200)
            .attr('cx', d => xScale(d.length))
            .attr('cy', d => yScale(d.amplitude))
            .attr('r', d => d.isResonant ? 6 : 4)
            .style('fill', d => d.isResonant ? '#ef4444' : '#10b981')
            .style('stroke', d => d.isResonant ? '#fca5a5' : '#6ee7b7')
            .style('stroke-width', 1);

        circles.exit()
            .transition()
            .duration(200)
            .attr('r', 0)
            .remove();

        // 添加连接线
        const line = d3.line()
            .x(d => xScale(d.length))
            .y(d => yScale(d.amplitude))
            .curve(d3.curveMonotoneX);

        let connectionLine = g.select('.connection-line');
        if (connectionLine.empty()) {
            connectionLine = g.append('path').attr('class', 'connection-line');
        }

        connectionLine
            .datum(frequencyData)
            .transition()
            .duration(200)
            .attr('d', line)
            .style('fill', 'none')
            .style('stroke', '#10b981')
            .style('stroke-width', 1.5)
            .style('opacity', 0.7);
    }

    /**
     * 更新共振分析图
     */
    updateResonancePlot(rodData, excitationFreq) {
        const now = Date.now();
        if (now - this.lastPlotUpdateTime.resonance < this.plotUpdateInterval) {
            return;
        }
        this.lastPlotUpdateTime.resonance = now;

        if (!this.resonanceChart || !rodData || rodData.length === 0) {
            return;
        }

        const { g, xScale, yScale, innerWidth } = this.resonanceChart;

        // 更新比例尺域
        const xExtent = d3.extent(rodData, d => d.length);
        const yExtent = d3.extent(rodData, d => d.naturalFreq);
        
        xScale.domain([xExtent[0] - 5, xExtent[1] + 5]);
        yScale.domain([0, Math.max(yExtent[1] * 1.1, excitationFreq * 1.5)]);

        // 更新坐标轴
        g.select('.grid').transition().duration(200)
            .call(d3.axisBottom(xScale).tickSize(-this.resonanceChart.innerHeight));
        g.selectAll('.grid').selectAll('line')
            .style('stroke', '#374151')
            .style('stroke-dasharray', '2,2');

        // 更新激励频率线
        let excitationLine = g.select('.excitation-line');
        if (excitationLine.empty()) {
            excitationLine = g.append('line').attr('class', 'excitation-line');
        }

        excitationLine
            .transition()
            .duration(200)
            .attr('x1', 0)
            .attr('x2', innerWidth)
            .attr('y1', yScale(excitationFreq))
            .attr('y2', yScale(excitationFreq))
            .style('stroke', '#fbbf24')
            .style('stroke-width', 2)
            .style('stroke-dasharray', '5,5');

        // 绑定数据并更新点
        const circles = g.selectAll('.resonance-point')
            .data(rodData, d => d.length);

        circles.enter()
            .append('circle')
            .attr('class', 'resonance-point')
            .attr('r', 0)
            .merge(circles)
            .transition()
            .duration(200)
            .attr('cx', d => xScale(d.length))
            .attr('cy', d => yScale(d.naturalFreq))
            .attr('r', d => d.isResonant ? 6 : 4)
            .style('fill', d => d.isResonant ? '#ef4444' : '#60a5fa')
            .style('stroke', d => d.isResonant ? '#fca5a5' : '#93c5fd')
            .style('stroke-width', 1);

        circles.exit()
            .transition()
            .duration(200)
            .attr('r', 0)
            .remove();
    }
    
    /**
     * 清空波形数据
     */
    clearWaveformData(rodIndex = null) {
        if (rodIndex !== null) {
            this.waveformData.delete(rodIndex);
        } else {
            this.waveformData.clear();
        }
    }

    /**
     * 清空波形图
     */
    clearWaveformPlot() {
        if (this.waveformChart) {
            this.waveformChart.g.select('.waveform-line').attr('d', null);
            this.waveformChart.g.select('.waveform-area').attr('d', null);
        }
    }

    /**
     * 更新选中杆件的波形显示
     */
    updateWaveformForRod(rodIndex) {
        this.currentSelectedRod = rodIndex;
        this.displayCurrentRodWaveform();
    }

    /**
     * 显示当前选中杆件的波形
     */
    displayCurrentRodWaveform() {
        const rodData = this.waveformData.get(this.currentSelectedRod);
        if (rodData && rodData.length > 0) {
            // 过滤时间窗口内的数据（最近10秒）
            const currentTime = rodData[rodData.length - 1].time;
            const windowStart = Math.max(0, currentTime - this.timeWindow);
            const visibleData = rodData.filter(d => d.time >= windowStart);
            
            if (visibleData.length > 0) {
                this.renderWaveformData(visibleData, windowStart);
            }
        }
    }

    /**
     * 窗口大小调整 - 重新初始化图表以适应新尺寸
     */
    resize() {
        console.log('重新调整图表尺寸...');
        
        // 重新初始化所有图表
        setTimeout(() => {
            this.initWaveformPlot();
            this.initFrequencyPlot();
            this.initResonancePlot();
            
            // 重新显示当前选中杆件的波形数据
            this.displayCurrentRodWaveform();
        }, 100);
    }

    // 占位方法，保持兼容性
    plotGeneratedSineWave(frequency, duration, amplitude = 1.0) {
        console.log('plotGeneratedSineWave (D3版本暂未实现)');
    }

    plotSweepSignal(startFreq, endFreq, duration, amplitude = 1.0) {
        console.log('plotSweepSignal (D3版本暂未实现)');
    }

    plotAudioFile(audioBuffer) {
        console.log('plotAudioFile (D3版本暂未实现)');
    }

    plotResonanceComparison(rodStatusList, excitationFreq) {
        console.log('plotResonanceComparison (D3版本暂未实现)');
        }

    updateRodStatusDisplay(rodStatusList) {
        console.log('updateRodStatusDisplay (D3版本暂未实现)');
    }
}

// ES6 模块导出
export { Visualization }; 