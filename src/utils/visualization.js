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

        // 图表尺寸配置
        this.chartConfig = {
            width: 600,
            height: 280,
            margin: { top: 40, right: 60, bottom: 60, left: 80 }
        };

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
     * 初始化波形图 - D3.js实现
     */
    initWaveformPlot() {
        const container = d3.select(`#${this.waveformContainer}`);
        container.selectAll('*').remove(); // 清空现有内容
        
        const { width, height, margin } = this.chartConfig;
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        // 创建SVG
        const svg = container
            .append('svg')
            .attr('width', '100%')
            .attr('height', height)
            .attr('viewBox', `0 0 ${width} ${height}`)
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

        // 添加坐标轴标签
        g.append('text')
            .attr('class', 'axis-label')
            .attr('text-anchor', 'middle')
            .attr('x', innerWidth / 2)
            .attr('y', innerHeight + 45)
            .style('fill', '#d1d5db')
            .style('font-size', '12px')
            .text('时间 (秒)');

        g.append('text')
            .attr('class', 'axis-label')
            .attr('text-anchor', 'middle')
            .attr('transform', 'rotate(-90)')
            .attr('y', -55)
            .attr('x', -innerHeight / 2)
            .style('fill', '#d1d5db')
            .style('font-size', '12px')
            .text('振动幅度 (mm)');

        // 添加标题
        g.append('text')
            .attr('class', 'chart-title')
            .attr('text-anchor', 'middle')
            .attr('x', innerWidth / 2)
            .attr('y', -15)
            .style('fill', '#f3f4f6')
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .text('振动波形');

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
            svg, g, xScale, yScale, line, area, innerWidth, innerHeight
        };
    }

    /**
     * 初始化频率响应图 - D3.js实现
     */
    initFrequencyPlot() {
        const container = d3.select(`#${this.frequencyContainer}`);
        container.selectAll('*').remove();
        
        const { width, height, margin } = this.chartConfig;
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const svg = container
            .append('svg')
            .attr('width', '100%')
            .attr('height', height)
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // 创建比例尺
        const xScale = d3.scaleLinear()
            .domain([0, 100])
            .range([0, innerWidth]);

        const yScale = d3.scaleLinear()
            .domain([0, 20])
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

        // 坐标轴样式
        g.selectAll('.domain').style('stroke', '#6b7280');
        g.selectAll('.tick text').style('fill', '#d1d5db').style('font-size', '11px');

        // 添加坐标轴标签
        g.append('text')
            .attr('text-anchor', 'middle')
            .attr('x', innerWidth / 2)
            .attr('y', innerHeight + 45)
            .style('fill', '#d1d5db')
            .style('font-size', '12px')
            .text('杆件长度 (mm)');

        g.append('text')
            .attr('text-anchor', 'middle')
            .attr('transform', 'rotate(-90)')
            .attr('y', -55)
            .attr('x', -innerHeight / 2)
            .style('fill', '#d1d5db')
            .style('font-size', '12px')
            .text('放大因子');

        // 添加标题
        g.append('text')
            .attr('text-anchor', 'middle')
            .attr('x', innerWidth / 2)
            .attr('y', -15)
            .style('fill', '#f3f4f6')
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .text('各杆件响应强度');
            
        // 保存图表引用
        this.frequencyChart = {
            svg, g, xScale, yScale, innerWidth, innerHeight
        };
    }

    /**
     * 初始化共振分析图 - D3.js实现
     */
    initResonancePlot() {
        const container = d3.select(`#${this.resonanceContainer}`);
        container.selectAll('*').remove();
        
        const { width, height, margin } = this.chartConfig;
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const svg = container
            .append('svg')
            .attr('width', '100%')
            .attr('height', height)
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // 创建比例尺
        const xScale = d3.scaleLinear()
            .domain([0, 100])
            .range([0, innerWidth]);

        const yScale = d3.scaleLinear()
            .domain([0, 5000])
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

        // 坐标轴样式
        g.selectAll('.domain').style('stroke', '#6b7280');
        g.selectAll('.tick text').style('fill', '#d1d5db').style('font-size', '11px');

        // 添加坐标轴标签
        g.append('text')
            .attr('text-anchor', 'middle')
            .attr('x', innerWidth / 2)
            .attr('y', innerHeight + 45)
            .style('fill', '#d1d5db')
            .style('font-size', '12px')
            .text('杆件长度 (mm)');

        g.append('text')
            .attr('text-anchor', 'middle')
            .attr('transform', 'rotate(-90)')
            .attr('y', -55)
            .attr('x', -innerHeight / 2)
            .style('fill', '#d1d5db')
            .style('font-size', '12px')
            .text('固有频率 (Hz)');

        // 添加标题
        g.append('text')
            .attr('text-anchor', 'middle')
            .attr('x', innerWidth / 2)
            .attr('y', -15)
            .style('fill', '#f3f4f6')
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .text('共振分析');

        // 添加图例
        const legend = g.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${innerWidth - 150}, 20)`);

        // 第1阶模态图例
        legend.append('circle')
            .attr('cx', 0)
            .attr('cy', 0)
            .attr('r', 4)
            .style('fill', '#60a5fa');

        legend.append('text')
            .attr('x', 10)
            .attr('y', 0)
            .attr('dy', '0.35em')
            .style('fill', '#d1d5db')
            .style('font-size', '11px')
            .text('第1阶模态');

        // 共振状态图例
        legend.append('circle')
            .attr('cx', 0)
            .attr('cy', 20)
            .attr('r', 4)
            .style('fill', '#ef4444');

        legend.append('text')
            .attr('x', 10)
            .attr('y', 20)
            .attr('dy', '0.35em')
            .style('fill', '#d1d5db')
            .style('font-size', '11px')
            .text('共振状态');
            
        // 激励频率图例
        legend.append('line')
            .attr('x1', -5)
            .attr('x2', 5)
            .attr('y1', 40)
            .attr('y2', 40)
            .style('stroke', '#fbbf24')
            .style('stroke-width', 2)
            .style('stroke-dasharray', '3,3');

        legend.append('text')
            .attr('x', 10)
            .attr('y', 40)
            .attr('dy', '0.35em')
            .style('fill', '#d1d5db')
            .style('font-size', '11px')
            .text('激励频率');

        // 保存图表引用
        this.resonanceChart = {
            svg, g, xScale, yScale, innerWidth, innerHeight
        };
    }

    /**
     * 更新波形图
     */
    updateWaveformPlot(waveformData, rodIndex = null) {
        const now = Date.now();
        if (now - this.lastPlotUpdateTime.waveform < this.plotUpdateInterval) {
            return;
        }
        this.lastPlotUpdateTime.waveform = now;

        if (!this.waveformChart || !waveformData || waveformData.length === 0) {
            return;
        }

        const actualRodIndex = rodIndex !== null ? rodIndex : this.currentSelectedRod;
        
        // 存储数据
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
            
        // 过滤时间窗口内的数据
        const currentTime = rodData.length > 0 ? rodData[rodData.length - 1].time : 0;
        const windowStart = Math.max(0, currentTime - this.timeWindow);
        const visibleData = rodData.filter(d => d.time >= windowStart);

        if (visibleData.length === 0) return;

        // 更新比例尺域
        const { xScale, yScale } = this.waveformChart;
        const yExtent = d3.extent(visibleData, d => d.amplitude);
        const yPadding = Math.abs(yExtent[1] - yExtent[0]) * 0.1 || 0.001;
        
        xScale.domain([windowStart, windowStart + this.timeWindow]);
        yScale.domain([yExtent[0] - yPadding, yExtent[1] + yPadding]);

        // 更新坐标轴
        const { g } = this.waveformChart;
        g.select('.grid').transition().duration(100).call(d3.axisBottom(xScale).tickSize(-this.waveformChart.innerHeight));
        g.selectAll('.grid').selectAll('line').style('stroke', '#374151').style('stroke-dasharray', '2,2');

        // 更新线条
        g.select('.waveform-line')
            .datum(visibleData)
            .transition()
            .duration(100)
            .attr('d', this.waveformChart.line);

        // 更新面积
        g.select('.waveform-area')
            .datum(visibleData)
            .transition()
            .duration(100)
            .attr('d', this.waveformChart.area);
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
        g.select('.grid').transition().duration(200).call(d3.axisBottom(xScale).tickSize(-this.frequencyChart.innerHeight));
        g.selectAll('.grid').selectAll('line').style('stroke', '#374151').style('stroke-dasharray', '2,2');

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
        g.select('.grid').transition().duration(200).call(d3.axisBottom(xScale).tickSize(-this.resonanceChart.innerHeight));
        g.selectAll('.grid').selectAll('line').style('stroke', '#374151').style('stroke-dasharray', '2,2');

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
            this.updateWaveformPlot(rodData, this.currentSelectedRod);
        }
    }

    /**
     * 窗口大小调整
     */
    resize() {
        // D3.js的SVG使用viewBox，会自动响应式调整
        console.log('D3 charts auto-resize with viewBox');
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