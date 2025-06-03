/**
 * 多杆件振动模拟系统 - 主控制模块
 * 集成所有功能模块，处理用户界面交互
 */

class MainController {
    constructor() {
        // 模块引用
        this.materials = null;
        this.vibrationCalc = null;
        this.audioProcessor = null;
        this.rodManager = null;
        this.visualization = null;
        
        // 状态变量
        this.currentConfig = {
            rodCount: 10,
            startLength: 20,
            lengthStep: 10,
            diameter: 5,
            material: 'steel',
            frequency: 100,
            amplitude: 1,
            dampingRatio: 0.01
        };
        
        // 动画状态
        this.isRunning = false;
        this.animationId = null;
        this.currentTime = 0;
        
        // UI元素引用
        this.ui = {};
    }

    /**
     * 初始化主控制器
     */
    async init() {
        try {
            console.log('开始初始化主控制器...');
            
            // 首先检查外部库是否已加载
            if (typeof THREE === 'undefined') {
                throw new Error('THREE.js 尚未加载');
            }
            if (typeof Plotly === 'undefined') {
                throw new Error('Plotly.js 尚未加载');
            }
            
            // 初始化各个模块 - 按依赖顺序
            console.log('初始化材料特性模块...');
            this.materials = new MaterialProperties();
            
            console.log('初始化振动计算模块...');
            this.vibrationCalc = new VibrationCalculator();
            
            console.log('初始化音频处理模块...');
            this.audioProcessor = new AudioProcessor();
            
            console.log('初始化可视化模块...');
            this.visualization = new Visualization('waveform-plot', 'frequency-plot');
            try {
                console.log('[MainController.init] 调用 this.visualization.init()之前');
                await this.visualization.init();
                console.log('[MainController.init] 调用 this.visualization.init()之后');
                console.log('[MainController.init] this.visualization 对象:', this.visualization);
            } catch (visError) {
                console.error('[MainController.init] Visualization.init() 执行失败:', visError);
                throw visError; // 重新抛出错误，以便上层能捕获
            }
            
            console.log('初始化杆件管理模块...');
            this.rodManager = new RodManager();
            
            // 初始化3D场景
            const threejsContainer = document.getElementById('threejs-container');
            if (threejsContainer) {
                const initResult = this.rodManager.init(threejsContainer);
                if (!initResult) {
                    throw new Error('3D场景初始化失败');
                }
                console.log('✓ 3D场景初始化成功');
            } else {
                console.error('3D容器元素未找到: threejs-container');
                throw new Error('3D容器元素未找到');
            }
            
            // 获取UI元素引用
            console.log('初始化UI引用...');
            this.initUIReferences();
            
            // 设置事件监听器
            console.log('设置事件监听器...');
            this.setupEventListeners();
            
            // 应用初始配置
            console.log('应用初始配置...');
            this.applyInitialConfig();
            
            console.log('✓ 主控制器初始化完成');
            return true;
        } catch (error) {
            console.error('主控制器初始化失败:', error);
            throw error;
        }
    }

    /**
     * 初始化UI元素引用
     */
    initUIReferences() {
        this.ui = {
            // 杆件配置
            rodCountSlider: document.getElementById('rodCount'),
            rodCountValue: document.getElementById('rodCountValue'),
            startLengthSlider: document.getElementById('startLength'),
            startLengthValue: document.getElementById('startLengthValue'),
            lengthStepSlider: document.getElementById('lengthStep'),
            lengthStepValue: document.getElementById('lengthStepValue'),
            rodDiameterSlider: document.getElementById('rodDiameter'),
            rodDiameterValue: document.getElementById('rodDiameterValue'),
            
            // 材料配置
            materialSelect: document.getElementById('materialType'),
            youngModulusSlider: document.getElementById('youngModulus'),
            youngModulusValue: document.getElementById('youngModulusValue'),
            densitySlider: document.getElementById('density'),
            densityValue: document.getElementById('densityValue'),
            
            // 激励配置
            excitationTypeSelect: document.getElementById('excitationType'),
            frequencySlider: document.getElementById('frequency'),
            frequencyValue: document.getElementById('frequencyValue'),
            amplitudeSlider: document.getElementById('amplitude'),
            amplitudeValue: document.getElementById('amplitudeValue'),
            dampingSlider: document.getElementById('damping'),
            dampingValue: document.getElementById('dampingValue'),
            timeScaleSlider: document.getElementById('timeScale'),
            timeScaleValue: document.getElementById('timeScaleValue'),
            
            // 控制按钮
            playPauseBtn: document.getElementById('playPauseBtn'),
            resetBtn: document.getElementById('resetBtn'),
            calculateResonanceBtn: document.getElementById('calculateResonanceBtn'),
            
            // 音频处理
            audioUpload: document.getElementById('audioUpload'),
            audioFile: document.getElementById('audioFile'),
            processAudioBtn: document.getElementById('processAudioBtn'),
            playAudioBtn: document.getElementById('playAudioBtn'),
            
            // 声音生成器
            genFreqSlider: document.getElementById('genFreq'),
            genFreqValue: document.getElementById('genFreqValue'),
            durationSlider: document.getElementById('duration'),
            durationValue: document.getElementById('durationValue'),
            generateSoundBtn: document.getElementById('generateSoundBtn'),
            playSoundBtn: document.getElementById('playSoundBtn'),
            
            // 状态显示
            rodStatusList: document.getElementById('rod-status-list')
        };
    }

    /**
     * 绑定UI事件监听器
     */
    setupEventListeners() {
        // 杆件配置滑块
        if (this.ui.rodCountSlider) {
            this.ui.rodCountSlider.addEventListener('input', (e) => {
                this.currentConfig.rodCount = parseInt(e.target.value);
                if (this.ui.rodCountValue) {
                    this.ui.rodCountValue.textContent = e.target.value + '根';
                }
            });
        }

        if (this.ui.startLengthSlider) {
            this.ui.startLengthSlider.addEventListener('input', (e) => {
                this.currentConfig.startLength = parseInt(e.target.value);
                if (this.ui.startLengthValue) {
                    this.ui.startLengthValue.textContent = e.target.value + 'mm';
                }
            });
        }

        if (this.ui.lengthStepSlider) {
            this.ui.lengthStepSlider.addEventListener('input', (e) => {
                this.currentConfig.lengthStep = parseInt(e.target.value);
                if (this.ui.lengthStepValue) {
                    this.ui.lengthStepValue.textContent = e.target.value + 'mm';
                }
            });
        }

        if (this.ui.rodDiameterSlider) {
            this.ui.rodDiameterSlider.addEventListener('input', (e) => {
                this.currentConfig.diameter = parseFloat(e.target.value);
                if (this.ui.rodDiameterValue) {
                    this.ui.rodDiameterValue.textContent = e.target.value + 'mm';
                }
            });
        }

        // 材料选择
        if (this.ui.materialSelect) {
            this.ui.materialSelect.addEventListener('change', (e) => {
                this.currentConfig.material = e.target.value;
                this.updateMaterialInputs();
            });
        }

        // 自定义材料输入
        if (this.ui.youngModulusSlider) {
            this.ui.youngModulusSlider.addEventListener('input', (e) => {
                if (this.currentConfig.material === 'custom') {
                    const youngModulus = parseFloat(e.target.value);
                    const density = parseFloat(this.ui.densitySlider?.value || 7850);
                    this.materials.setCustomMaterial(youngModulus, density);
                }
            });
        }

        if (this.ui.densitySlider) {
            this.ui.densitySlider.addEventListener('input', (e) => {
                if (this.currentConfig.material === 'custom') {
                    const density = parseFloat(e.target.value);
                    const youngModulus = parseFloat(this.ui.youngModulusSlider?.value || 200);
                    this.materials.setCustomMaterial(youngModulus, density);
                }
            });
        }

        // 激励参数滑块
        if (this.ui.frequencySlider) {
            this.ui.frequencySlider.addEventListener('input', (e) => {
                this.currentConfig.frequency = parseFloat(e.target.value);
                if (this.ui.frequencyValue) {
                    this.ui.frequencyValue.textContent = e.target.value + 'Hz';
                }
            });
        }

        if (this.ui.amplitudeSlider) {
            this.ui.amplitudeSlider.addEventListener('input', (e) => {
                this.currentConfig.amplitude = parseFloat(e.target.value);
                if (this.ui.amplitudeValue) {
                    this.ui.amplitudeValue.textContent = e.target.value;
                }
            });
        }

        if (this.ui.dampingSlider) {
            this.ui.dampingSlider.addEventListener('input', (e) => {
                this.currentConfig.dampingRatio = parseFloat(e.target.value);
                if (this.ui.dampingValue) {
                    this.ui.dampingValue.textContent = e.target.value;
                }
            });
        }

        // 控制按钮
        if (this.ui.playPauseBtn) {
            this.ui.playPauseBtn.addEventListener('click', () => {
                this.togglePlayPause();
            });
        }

        if (this.ui.resetBtn) {
            this.ui.resetBtn.addEventListener('click', () => {
                this.resetSimulation();
            });
        }

        if (this.ui.calculateResonanceBtn) {
            this.ui.calculateResonanceBtn.addEventListener('click', () => {
                this.calculateResonance();
            });
        }

        // 音频处理
        if (this.ui.audioUpload) {
            this.ui.audioUpload.addEventListener('change', (e) => {
                this.handleAudioUpload(e);
            });
        }

        if (this.ui.processAudioBtn) {
            this.ui.processAudioBtn.addEventListener('click', () => {
                this.processAudio();
            });
        }

        if (this.ui.playAudioBtn) {
            this.ui.playAudioBtn.addEventListener('click', () => {
                this.playProcessedAudio();
            });
        }

        // 声音生成
        if (this.ui.generateSoundBtn) {
            this.ui.generateSoundBtn.addEventListener('click', () => {
                this.generateSound();
            });
        }

        if (this.ui.playSoundBtn) {
            this.ui.playSoundBtn.addEventListener('click', () => {
                this.playSound();
            });
        }

        // 声音生成器滑块事件
        if (this.ui.genFreqSlider) {
            this.ui.genFreqSlider.addEventListener('input', (e) => {
                if (this.ui.genFreqValue) {
                    this.ui.genFreqValue.textContent = e.target.value + 'Hz';
                }
            });
        }

        if (this.ui.durationSlider) {
            this.ui.durationSlider.addEventListener('input', (e) => {
                if (this.ui.durationValue) {
                    this.ui.durationValue.textContent = e.target.value + 's';
                }
            });
        }
    }

    /**
     * 应用初始配置
     */
    applyInitialConfig() {
        // 设置滑块初始值
        if (this.ui.rodCountSlider) {
            this.ui.rodCountSlider.value = this.currentConfig.rodCount;
            if (this.ui.rodCountValue) {
                this.ui.rodCountValue.textContent = this.currentConfig.rodCount + '根';
            }
        }

        if (this.ui.startLengthSlider) {
            this.ui.startLengthSlider.value = this.currentConfig.startLength;
            if (this.ui.startLengthValue) {
                this.ui.startLengthValue.textContent = this.currentConfig.startLength + 'mm';
            }
        }

        if (this.ui.lengthStepSlider) {
            this.ui.lengthStepSlider.value = this.currentConfig.lengthStep;
            if (this.ui.lengthStepValue) {
                this.ui.lengthStepValue.textContent = this.currentConfig.lengthStep + 'mm';
            }
        }

        if (this.ui.rodDiameterSlider) {
            this.ui.rodDiameterSlider.value = this.currentConfig.diameter;
            if (this.ui.rodDiameterValue) {
                this.ui.rodDiameterValue.textContent = this.currentConfig.diameter + 'mm';
            }
        }

        if (this.ui.frequencySlider) {
            this.ui.frequencySlider.value = this.currentConfig.frequency;
            if (this.ui.frequencyValue) {
                this.ui.frequencyValue.textContent = this.currentConfig.frequency + 'Hz';
            }
        }

        if (this.ui.amplitudeSlider) {
            this.ui.amplitudeSlider.value = this.currentConfig.amplitude;
            if (this.ui.amplitudeValue) {
                this.ui.amplitudeValue.textContent = this.currentConfig.amplitude;
            }
        }

        if (this.ui.dampingSlider) {
            this.ui.dampingSlider.value = this.currentConfig.dampingRatio;
            if (this.ui.dampingValue) {
                this.ui.dampingValue.textContent = this.currentConfig.dampingRatio;
            }
        }

        // 设置声音生成器的初始值
        if (this.ui.genFreqSlider) {
            this.ui.genFreqSlider.value = 440; // 默认440Hz
            if (this.ui.genFreqValue) {
                this.ui.genFreqValue.textContent = '440Hz';
            }
        }

        if (this.ui.durationSlider) {
            this.ui.durationSlider.value = 1; // 默认1秒
            if (this.ui.durationValue) {
                this.ui.durationValue.textContent = '1s';
            }
        }

        // 创建初始杆件
        this.updateRods();
    }

    /**
     * 切换自定义材料输入框显示
     */
    toggleCustomMaterialInputs(show) {
        const customInputs = document.getElementById('custom-material-inputs');
        if (customInputs) {
            customInputs.style.display = show ? 'block' : 'none';
        }
    }

    /**
     * 更新杆件配置
     */
    updateRods() {
        console.log('更新杆件配置');
        if (this.rodManager) {
            const rodConfig = {
                count: this.currentConfig.rodCount,
                startLength: this.currentConfig.startLength,
                lengthStep: this.currentConfig.lengthStep,
                diameter: this.currentConfig.diameter
            };
            this.rodManager.setRodParams(rodConfig);
            this.rodManager.setMaterial(this.currentConfig.material);

            const excitationConfig = {
                frequency: this.currentConfig.frequency,
                amplitude: this.currentConfig.amplitude,
                damping: this.currentConfig.dampingRatio, // 确保名称与 RodManager 的期望匹配
                timeScale: this.currentConfig.timeScale // 添加时间缩放
            };
            this.rodManager.setExcitationParams(excitationConfig);
        }
        this.updateVisualization();
    }

    /**
     * 切换播放/暂停状态
     */
    togglePlayPause() {
        this.isRunning = !this.isRunning;
        
        if (this.ui.playPauseBtn) {
            this.ui.playPauseBtn.textContent = this.isRunning ? '⏸️ 暂停' : '▶️ 开始';
        }
        
        if (this.rodManager) {
            this.rodManager.togglePlayPause();
        }

        if (this.isRunning) {
            this.startAnimation();
        } else {
            this.stopAnimation();
        }
        
        console.log(this.isRunning ? '开始模拟' : '暂停模拟');
    }

    /**
     * 切换模拟状态
     */
    toggleSimulation() {
        this.togglePlayPause();
    }

    /**
     * 开始动画
     */
    startAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        this.animate();
    }

    /**
     * 停止动画
     */
    stopAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    /**
     * 动画循环
     */
    animate() {
        if (!this.isRunning) return;
        
        // 更新时间
        this.currentTime += 0.016; // 假设60fps, MainController time, RodManager has its own clock
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    /**
     * 重置模拟
     */
    resetSimulation() {
        this.isRunning = false;
        this.currentTime = 0;
        
        if (this.ui.playPauseBtn) {
            this.ui.playPauseBtn.textContent = '▶️ 开始';
        }
        
        this.stopAnimation();
        
        // 重置杆件状态
        if (this.rodManager) {
            this.rodManager.reset(); // RodManager's reset should handle its own isPlaying state
        }
        
        // Optionally, reset visualization if needed
        if (this.visualization && typeof this.visualization.reset === 'function') {
            this.visualization.reset();
        }

        console.log('模拟已重置');
    }

    /**
     * 处理音频文件上传
     */
    handleAudioUpload(event) {
        const file = event.target.files[0];
        if (file) {
            console.log('音频文件已选择:', file.name);
            // 音频文件处理逻辑
        }
    }

    /**
     * 分析音频
     */
    processAudio() {
        const fileInput = this.ui.audioFile;
        if (!fileInput?.files[0]) {
            console.warn('没有选择音频文件');
            return;
        }
        
        console.log('处理音频文件');
        this.audioProcessor.processAudioFile(fileInput.files[0])
            .then(data => {
                console.log('音频分析完成:', data);
                this.applyAudioToVibration(data);
                if (data.success && this.ui.playAudioBtn) {
                    this.ui.playAudioBtn.disabled = false;
                }
            })
            .catch(error => {
                console.error('音频处理失败:', error);
                if (this.ui.playAudioBtn) {
                    this.ui.playAudioBtn.disabled = true;
                }
            });
    }

    /**
     * 将音频数据应用到振动
     */
    applyAudioToVibration(audioData) {
        if (!audioData || !audioData.success) {
            console.warn('[MainController.applyAudioToVibration] 音频数据无效或处理失败。');
            return;
        }
        
        console.log('[MainController.applyAudioToVibration] 开始更新图表。');

        // 更新可视化图表
        if (this.audioProcessor && this.visualization && this.audioProcessor.audioBuffer) {
            console.log('[MainController.applyAudioToVibration] 准备更新波形图。');
            const waveformData = this.audioProcessor.getWaveformData(this.audioProcessor.audioBuffer, 1000);
            if (typeof this.visualization.updateWaveformPlot === 'function') {
                this.visualization.updateWaveformPlot(waveformData);
                console.log('[MainController.applyAudioToVibration] 波形图已更新 (或尝试更新)。');
            } else {
                console.warn('[MainController.applyAudioToVibration] this.visualization.updateWaveformPlot 方法未定义。');
            }

            // --- 暂时注释掉频谱分析以排查卡死问题 ---
            console.log('[MainController.applyAudioToVibration] 跳过频谱分析进行测试。');
            /*
            const frequencyData = this.audioProcessor.analyzeAudioFrequency(); 
            if (typeof this.visualization.updateFrequencyPlot === 'function') {
                this.visualization.updateFrequencyPlot(frequencyData);
                console.log('[MainController.applyAudioToVibration] 频谱图已更新 (或尝试更新)。');
            } else {
                console.warn('[MainController.applyAudioToVibration] this.visualization.updateFrequencyPlot 方法未定义。');
            }
            */
        } else {
            console.warn('[MainController.applyAudioToVibration] audioProcessor, audioBuffer 或 visualization 未准备好，无法更新图表。');
        }
        console.log('[MainController.applyAudioToVibration] 图表更新结束。');
    }

    /**
     * 生成声音
     */
    generateSound() {
        const frequency = parseFloat(this.ui.genFreqSlider?.value || 440);
        const duration = parseFloat(this.ui.durationSlider?.value || 1);
        
        console.log(`生成声音: ${frequency}Hz, ${duration}s`);
        
        try {
            this.audioProcessor.generateTone(frequency, duration);
            console.log('声音生成成功');
            
            // 启用播放按钮
            if (this.ui.playSoundBtn) {
                this.ui.playSoundBtn.disabled = false;
            }
        } catch (error) {
            console.error('声音生成失败:', error);
            alert('声音生成失败: ' + error.message);
        }
    }

    /**
     * 播放生成的声音
     */
    playSound() {
        console.log('播放生成的声音');
        
        try {
            if (!this.audioProcessor.generatedAudioBuffer) {
                console.warn('没有生成的音频可播放，请先生成声音');
                alert('请先生成声音');
                return;
            }
            
            this.audioProcessor.playGeneratedSound();
            console.log('开始播放生成的声音');
        } catch (error) {
            console.error('播放生成声音失败:', error);
            alert('播放失败: ' + error.message);
        }
    }

    /**
     * 播放处理后的音频文件
     */
    playProcessedAudio() {
        console.log('播放处理后的音频');
        
        try {
            if (!this.audioProcessor) {
                console.error('audioProcessor未初始化');
                alert('音频处理器未初始化');
                return;
            }

            if (!this.audioProcessor.audioBuffer) {
                console.warn('没有处理过的音频可播放，请先选择并处理音频文件');
                alert('请先选择并处理音频文件');
                return;
            }
            
            console.log('AudioContext状态:', this.audioProcessor.audioContext.state);
            console.log('AudioBuffer信息:', {
                duration: this.audioProcessor.audioBuffer.duration,
                sampleRate: this.audioProcessor.audioBuffer.sampleRate,
                numberOfChannels: this.audioProcessor.audioBuffer.numberOfChannels
            });
            
            // 检查AudioContext状态
            if (this.audioProcessor.audioContext.state === 'suspended') {
                console.log('AudioContext处于暂停状态，正在恢复...');
                this.audioProcessor.audioContext.resume().then(() => {
                    console.log('AudioContext已恢复，开始播放音频');
                    this.audioProcessor.playCurrentAudio((success) => {
                        console.log('音频播放结束');
                    });
                }).catch(error => {
                    console.error('AudioContext恢复失败:', error);
                    alert('音频系统启动失败: ' + error.message);
                });
            } else {
                this.audioProcessor.playCurrentAudio((success) => {
                    console.log('音频播放结束');
                });
            }
            
            console.log('开始播放处理后的音频');
        } catch (error) {
            console.error('播放处理后音频失败:', error);
            alert('播放失败: ' + error.message);
        }
    }

    /**
     * 计算共振频率
     */
    calculateResonance() {
        console.log('计算共振频率');
        if (!this.vibrationCalc || !this.rodManager || !this.rodManager.rods) {
            console.error('依赖模块未正确初始化 (vibrationCalc or rodManager)');
            return;
        }

        const excitationFreq = this.currentConfig.frequency;
        const material = this.materials.getMaterial(this.currentConfig.material);
        const resonanceResults = [];

        this.rodManager.rods.forEach((rod, index) => {
            const rodData = rod.userData; // 从rod的userData中获取长度、半径等信息
            if (!rodData || rodData.length === undefined || rodData.radius === undefined) {
                console.warn(`杆件 ${index} 的userData不完整，跳过共振计算。`);
                return;
            }

            const naturalFrequenciesForRod = [];
            // 通常需要计算前几个模态
            for (let mode = 1; mode <= 4; mode++) { // 假设我们关心前4个模态
                const naturalFreq = this.vibrationCalc.calculateNaturalFrequency(
                    rodData.length,    // m
                    rodData.radius,    // m
                    material.youngModulus, // Pa
                    material.density,      // kg/m³
                    mode
                );
                naturalFrequenciesForRod.push({ 
                    mode: mode, 
                    frequency: naturalFreq,
                    isResonant: this.vibrationCalc.isResonant(excitationFreq, naturalFreq)
                });
            }
            resonanceResults.push({
                rodIndex: index,
                length: rodData.length,
                diameter: rodData.radius * 2,
                naturalFrequencies: naturalFrequenciesForRod
            });
        });

        this.displayResonanceResults(resonanceResults);
        this.updateResonanceDisplay(resonanceResults);
    }

    /**
     * 显示共振计算结果
     */
    displayResonanceResults(resonanceResults) {
        if (!resonanceResults || resonanceResults.length === 0) {
            console.log('没有共振数据可显示。');
            return;
        }
        
        console.log('计算得到的共振结果:', resonanceResults);
        
        if (this.visualization && typeof this.visualization.plotResonanceComparison === 'function') {
            //  plotResonanceComparison(rodStatusList, excitationFreq)
            //  我们需要将 resonanceResults 调整为 plotResonanceComparison 期望的 rodStatusList 格式
            //  假设 plotResonanceComparison 期望一个类似 [{ rodIndex, length, naturalFrequencies: [{mode, frequency, isResonant}] }] 的结构，这与我们的 resonanceResults 相似
            this.visualization.plotResonanceComparison(resonanceResults, this.currentConfig.frequency);
        } else {
            console.warn('[MainController.displayResonanceResults] this.visualization.plotResonanceComparison 方法未定义或不可用。');
        }
    }

    /**
     * 显示音频信息
     */
    displayAudioInfo(audioData) {
        const info = `
            文件: ${audioData.filename || '未知'}
            时长: ${audioData.duration?.toFixed(2) || '未知'}秒
            采样率: ${audioData.sampleRate || '未知'}Hz
            声道数: ${audioData.numberOfChannels || '未知'}
        `;
        
        // 可以在UI中显示这些信息
        console.log('音频信息:', info);
    }

    /**
     * 更新共振状态显示
     */
    updateResonanceDisplay(resonanceResults) {
        if (!this.ui.rodStatusList || !this.rodManager || !this.vibrationCalc || !this.materials) {
            console.warn('UI元素 rodStatusList 或必要模块未初始化，无法更新共振显示。');
            return;
        }
        
        const excitationFreq = this.currentConfig.frequency;
        const material = this.materials.getMaterial(this.currentConfig.material);
        const rods = this.rodManager.rods;

        let html = '<h4 class="text-sm font-semibold mb-2">共振状态 (基于当前激励频率: ' + excitationFreq.toFixed(1) + 'Hz)</h4>';
        
        if (!rods || rods.length === 0) {
            html += '<p class="text-gray-500">没有杆件可供分析。</p>';
            this.ui.rodStatusList.innerHTML = html;
            return;
        }

        rods.forEach((rod, index) => {
            const rodData = rod.userData;
            if (!rodData || rodData.length === undefined || rodData.radius === undefined) {
                html += `<div class="text-xs py-1 text-yellow-500">杆件${index + 1}: 数据不完整</div>`;
                return; // continue to next rod
            }

            let overallRodIsResonant = false;
            let modesSummary = [];

            for (let mode = 1; mode <= 4; mode++) {
                const naturalFreq = this.vibrationCalc.calculateNaturalFrequency(
                    rodData.length, rodData.radius, material.youngModulus, material.density, mode
                );
                const isModeResonant = this.vibrationCalc.isResonant(excitationFreq, naturalFreq);
                if (isModeResonant) {
                    overallRodIsResonant = true;
                }
                modesSummary.push(`模态${mode}: ${naturalFreq.toFixed(1)}Hz ${isModeResonant ? '(共振)' : ''}`);
            }
            
            const statusClass = overallRodIsResonant ? 'text-red-500' : 'text-green-500';
            const statusText = overallRodIsResonant ? '共振' : '正常';
            
            html += `
                <div class="flex justify-between items-start text-xs py-1 border-b border-gray-700 last:border-b-0">
                    <span class="font-medium">杆件${index + 1} (${(rodData.length * 1000).toFixed(0)}mm)</span>
                    <div class="text-right">
                        <span class="${statusClass}">${statusText}</span>
                        <span class="block text-gray-400 text-xxs">(${modesSummary.join(', ')})</span>
                    </div>
                </div>
            `;
        });
        
        this.ui.rodStatusList.innerHTML = html;
    }

    /**
     * 获取当前配置
     */
    getCurrentConfig() {
        return { ...this.currentConfig };
    }

    /**
     * 设置配置
     */
    setConfig(config) {
        this.currentConfig = { ...this.currentConfig, ...config };
        this.applyInitialConfig();
    }

    /**
     * 更新材料输入界面
     */
    updateMaterialInputs() {
        const material = this.materials.getMaterial(this.currentConfig.material);
        
        if (this.ui.youngModulusSlider && material) {
            this.ui.youngModulusSlider.value = material.youngModulus || 200;
            if (this.ui.youngModulusValue) {
                this.ui.youngModulusValue.textContent = (material.youngModulus || 200) + 'GPa';
            }
        }
        
        if (this.ui.densitySlider && material) {
            this.ui.densitySlider.value = material.density || 7850;
            if (this.ui.densityValue) {
                this.ui.densityValue.textContent = (material.density || 7850) + 'kg/m³';
            }
        }
    }

    /**
     * 更新可视化
     */
    updateVisualization() {
        console.log('[MainController.updateVisualization] 当前 this.visualization:', this.visualization);
        console.log('[MainController.updateVisualization] typeof this.visualization.updateDisplay:', typeof this.visualization.updateDisplay);

        if (this.visualization && typeof this.visualization.updateDisplay === 'function') {
            this.visualization.updateDisplay();
        } else {
            console.warn('[MainController.updateVisualization] this.visualization.updateDisplay 不是一个函数或this.visualization未定义. Visualization模块可能没有此方法。');
        }
        
        this.updateResonanceDisplay();
    }
}

// 确保类导出到全局作用域
window.MainController = MainController; 