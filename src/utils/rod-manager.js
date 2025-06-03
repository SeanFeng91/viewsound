/**
 * 杆件管理模块
 * 管理多个杆件的创建、更新和可视化
 */

import { MaterialProperties } from './materials.js';
import { VibrationCalculator } from './vibration-calc.js';
import { getArrayHeightFunction } from './math-functions.js'; // 导入高度函数获取器

// 创建模块实例
const materialProperties = new MaterialProperties();
const vibrationCalculator = new VibrationCalculator();

class RodManager {
    constructor() {
        // 场景对象（延迟初始化）
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.rods = [];
        this.originalPositions = [];
        this.currentTime = 0;
        this.isPlaying = false;
        this.clock = null; // 延迟初始化
        this.container = null;
        this.selectedRodIndex = 4; // 默认选择第5根杆件
        
        // 振动参数
        this.excitationFreq = 100;
        this.excitationAmp = 0.1;
        this.damping = 0.02;
        this.timeScale = 1.0;
        this.currentMaterial = 'steel';
        this.excitationType = 'sine'; // 添加激励类型
        
        // 杆件配置 (这些现在作为基础/线性模式的默认值)
        this.baseRodConfig = {
            count: 10,
            startLength: 20,  // mm
            lengthStep: 10,   // mm
            diameter: 2.0     // mm
        };
        
        // 新增：显示模式配置
        this.displayModeConfig = {
            mode: 'linear',
            // 阵列参数
            gridX: 10,
            gridY: 10,
            heightFunction: 'sine',
            baseHeight: 20,
            amplitude: 50,
            scaleFactor: 1.0,
            // 雕塑参数 (待定)
            sculptureType: 'spiral' 
        };
    }

    /**
     * 初始化3D场景
     * @param {HTMLElement} container - 容器元素
     */
    init(container) {
        console.log('[RodManager.init] 开始初始化3D场景，容器:', container);
        // 检查THREE是否已加载
        if (typeof THREE === 'undefined') {
            console.error('[RodManager.init] THREE.js 尚未加载，无法初始化3D场景');
            return false;
        }
        
        this.container = container;
        this.clock = new THREE.Clock(); // 在这里创建clock
        this.setupScene();
        this.setupLighting();
        this.createAllRods();
        this.setupControls();
        this.startAnimation();
        console.log('[RodManager.init] 3D场景初始化完毕。');
        return true;
    }

    /**
     * 设置3D场景
     */
    setupScene() {
        this.scene = new THREE.Scene();
        // 将背景颜色改为明亮的白色
        this.scene.background = new THREE.Color(0xf0f0f0); 

        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(60, aspect, 0.01, 1000); // 调整FOV和near plane
        this.camera.position.set(0, 0.1, 0.3); // 初始相机位置，会被updateCameraView覆盖

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        // 添加色调映射以获得更真实的 HDR 效果
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace; // 正确的颜色空间

        this.container.appendChild(this.renderer.domElement);
    }

    /**
     * 设置光照
     */
    setupLighting() {
        // 环境光，提供基础亮度
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // 增强环境光
        this.scene.add(ambientLight);

        // 平行光，模拟太阳光，产生阴影
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2); // 增强平行光
        directionalLight.position.set(5, 10, 7.5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048; // 提高阴影质量
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.bias = -0.001; // 减少阴影痤疮
        this.scene.add(directionalLight);
        
        // 添加一个半球光，模拟天空和地面的反射光，使场景更柔和自然
        const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.7);
        hemisphereLight.position.set(0, 20, 0);
        this.scene.add(hemisphereLight);

        // 可以考虑添加一些点光源或聚光灯来突出特定区域，但初期保持简单
        // const pointLight = new THREE.PointLight(0xffffff, 0.5);
        // pointLight.position.set(0, 5, 5);
        // this.scene.add(pointLight);
    }

    /**
     * 创建所有杆件
     */
    createAllRods() {
        this.clearRods();
        console.log(`[RodManager.createAllRods] Mode: ${this.displayModeConfig.mode}`);

        const material = materialProperties.getMaterial(this.currentMaterial);
        const rodRadius = this.baseRodConfig.diameter / 2000; // mm to m, 通用直径

        switch (this.displayModeConfig.mode) {
            case 'linear':
                this.createLinearRods(material, rodRadius);
                break;
            case 'array':
                this.createArrayRods(material, rodRadius);
                break;
            case 'sculpture':
                this.createSculptureRods(material, rodRadius); // 占位
                break;
            default:
                console.warn(`未知显示模式: ${this.displayModeConfig.mode}`);
                this.createLinearRods(material, rodRadius); // 默认为线性
        }

        console.log(`[RodManager.createAllRods] 创建了 ${this.rods.length} 个杆件。`);
        this.updateCameraView(); // 确保相机视角适应新的杆件布局
    }

    /**
     * 创建单个杆件
     * @param {number} length - 长度 (m)
     * @param {number} radius - 半径 (m)
     * @param {number} color - 基础颜色 (会被金属材质覆盖部分效果)
     * @returns {THREE.Mesh} 杆件网格
     */
    createSingleRod(length, radius, color) {
        const heightSegments = 16; // 适当减少段数以提高性能，但保持足够平滑
        const radialSegments = 8; // 减少径向段数
        const geometry = new THREE.CylinderGeometry(radius, radius, length, radialSegments, heightSegments);
        geometry.translate(0, length / 2, 0); // 底部固定

        // 使用MeshStandardMaterial实现金属效果
        const material = new THREE.MeshStandardMaterial({
            color: 0xB0B0B0,    // 银灰色 (0xC0C0C0)
            metalness: 0.9,     // 金属度，接近1表示完全金属
            roughness: 0.4,     // 粗糙度，0表示完全光滑镜面，1表示完全粗糙
            transparent: true,
            opacity: 0.95
        });

        const rod = new THREE.Mesh(geometry, material);
        rod.castShadow = true;
        rod.receiveShadow = true;

        // 底座材质也调整一下
        const baseGeometry = new THREE.CylinderGeometry(radius * 1.5, radius * 1.5, radius * 0.5, radialSegments);
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: 0x666666, 
            metalness: 0.5,
            roughness: 0.6 
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = radius * 0.25;
        base.castShadow = true;
        base.receiveShadow = true;
        rod.add(base);

        return rod;
    }

    /**
     * 存储原始顶点位置
     * @param {THREE.Mesh} rod - 杆件
     * @returns {Float32Array} 原始位置
     */
    storeOriginalPositions(rod) {
        return rod.geometry.attributes.position.clone();
    }

    /**
     * 清除所有杆件
     */
    clearRods() {
        this.rods.forEach(rod => {
            this.scene.remove(rod);
            rod.geometry.dispose();
            rod.material.dispose();
        });
        this.rods = [];
        this.originalPositions = [];
    }

    /**
     * 更新相机视角以适应当前杆件布局
     */
    updateCameraView() {
        if (this.rods.length === 0) {
            this.camera.position.set(0, 0.1, 0.3); // 默认位置
            this.camera.lookAt(0, 0, 0);
            return;
        }

        let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity, maxY = -Infinity;
        this.rods.forEach(rod => {
            minX = Math.min(minX, rod.position.x);
            maxX = Math.max(maxX, rod.position.x);
            minZ = Math.min(minZ, rod.position.z);
            maxZ = Math.max(maxZ, rod.position.z);
            maxY = Math.max(maxY, rod.userData.length); // 杆件的最大长度作为Y轴的参考
        });

        const centerX = (minX + maxX) / 2;
        const centerZ = (minZ + maxZ) / 2;
        const extentX = maxX - minX;
        const extentZ = maxZ - minZ;
        
        const maxExtent = Math.max(extentX, extentZ, maxY); // 考虑杆件长度

        // 基于最大范围调整相机位置
        // 简单的启发式方法：相机距离与场景范围成正比
        const camX = centerX;
        const camY = maxY * 1.5 + maxExtent * 0.5; // 抬高相机，基于杆件高度和整体范围
        const camZ = centerZ + maxExtent * 1.5;    // 拉远相机

        this.camera.position.set(camX, camY, camZ);
        this.camera.lookAt(centerX, maxY / 3, centerZ); // 观察点调整为阵列中心偏上

        console.log('[RodManager.updateCameraView] Updated camera for new layout.');
        console.log('[RodManager.updateCameraView] Camera position:', this.camera.position);
        console.log('[RodManager.updateCameraView] Camera lookAt:', centerX, maxY / 3, centerZ);
    }

    /**
     * 更新杆件变形
     */
    updateRodDeformation() {
        if (this.excitationType === 'audio') {
            if (typeof window !== 'undefined' && window.audioPlayer && 
                (!window.audioPlayer.hasAudioFile || !window.audioPlayer.hasAudioFile())) {
                this.rods.forEach((rod, index) => {
                    const originalPos = this.originalPositions[index];
                    const positions = rod.geometry.attributes.position;
                    for (let i = 0; i < positions.count; i++) {
                        positions.setX(i, originalPos.getX(i));
                        positions.setY(i, originalPos.getY(i));
                        positions.setZ(i, originalPos.getZ(i));
                    }
                    positions.needsUpdate = true;
                    rod.geometry.computeVertexNormals();
                    const userData = rod.userData;
                    rod.material.color.setHex(userData.material.color);
                    rod.material.emissive.setHex(0x000000);
                });
                if (typeof window !== 'undefined' && window.visualization) {
                    window.visualization.clearWaveformPlot();
                    // No frequency plot data to clear if we return here, 
                    // or clear it with empty data if it was previously populated.
                    window.visualization.updateFrequencyPlot([]); 
                    window.visualization.updateResonancePlot([], 0);
                }
                return;
            }
        }
        
        const allRodsWaveformDataForThisTick = [];
        const rodSpecificMetrics = [];

        this.rods.forEach((rod, index) => {
            const userData = rod.userData;
            const originalPos = this.originalPositions[index];
            const positions = rod.geometry.attributes.position;
            const firstModeFreq = userData.naturalFrequencies[0]?.frequency || 100;
            const frequencyRatio = this.excitationFreq / firstModeFreq;
            const dampingRatio = this.damping;
            const denominator = Math.sqrt(
                Math.pow(1 - frequencyRatio * frequencyRatio, 2) + 
                Math.pow(2 * dampingRatio * frequencyRatio, 2)
            );
            const magnificationFactor = 1 / Math.max(denominator, 0.01);
            const phaseDelay = Math.atan2(
                2 * dampingRatio * frequencyRatio, 
                1 - frequencyRatio * frequencyRatio
            );
            const effectiveAmplitude = this.excitationAmp * magnificationFactor * 0.001;
            const maxAmplitude = userData.length * 0.1;
            const limitedAmplitude = Math.min(effectiveAmplitude, maxAmplitude);
            const currentDeformationAmplitude = limitedAmplitude * Math.sin(2 * Math.PI * this.excitationFreq * this.currentTime - phaseDelay);

            allRodsWaveformDataForThisTick.push({
                rodIndex: index,
                time: this.currentTime,
                amplitude: currentDeformationAmplitude
            });
            
            const isRodResonant = vibrationCalculator.isResonant(this.excitationFreq, firstModeFreq, 0.08);
            const rodLengthMm = Math.round(userData.length * 1000);

            rodSpecificMetrics.push({
                lengthMm: rodLengthMm,
                magnification: magnificationFactor,
                isResonant: isRodResonant,
                naturalFreq: firstModeFreq
            });

            for (let i = 0; i < positions.count; i++) {
                const origX = originalPos.getX(i);
                const origY = originalPos.getY(i);
                const origZ = originalPos.getZ(i);
                const positionAlongRod = (origY + userData.length / 2);
                const normalizedPosition = positionAlongRod / userData.length;
                const modeShape = normalizedPosition * normalizedPosition;
                const displacement = currentDeformationAmplitude * modeShape;
                positions.setX(i, origX + displacement);
                positions.setY(i, origY);
                positions.setZ(i, origZ);
            }
            positions.needsUpdate = true;
            rod.geometry.computeVertexNormals();
            this.updateRodResonanceStatus(rod, index); // Visually update rod color
        });

        const groupedData = new Map();
        rodSpecificMetrics.forEach(metric => {
            if (!groupedData.has(metric.lengthMm)) {
                groupedData.set(metric.lengthMm, {
                    length: metric.lengthMm,
                    magnifications: [],
                    isResonantFlags: [],
                    naturalFrequency: metric.naturalFreq
                });
            }
            groupedData.get(metric.lengthMm).magnifications.push(metric.magnification);
            groupedData.get(metric.lengthMm).isResonantFlags.push(metric.isResonant);
        });

        const finalFrequencyData = [];
        groupedData.forEach(group => {
            const maxMagnification = group.magnifications.length > 0 ? Math.max(...group.magnifications) : 0;
            const isGroupResonant = group.isResonantFlags.some(flag => flag === true);
            finalFrequencyData.push({
                length: group.length,
                amplitude: maxMagnification,
                isResonant: isGroupResonant,
                naturalFrequency: group.naturalFrequency
            });
        });
        finalFrequencyData.sort((a, b) => a.length - b.length);
        
        this.updateVisualization({
            waveformData: allRodsWaveformDataForThisTick, // Pass all individual rod waveform points
            frequencyData: finalFrequencyData // Pass grouped data for frequency and resonance plots
        });
    }
    
    /**
     * 更新可视化图表
     * @param {Object} data - 可视化数据
     */
    updateVisualization(data) {
        if (typeof window !== 'undefined' && window.visualization) {
            // Waveform data update (per rod, as before)
            if (data.waveformData && data.waveformData.length > 0) {
                const rodWaveformMap = new Map();
                data.waveformData.forEach(point => {
                    if (!rodWaveformMap.has(point.rodIndex)) {
                        rodWaveformMap.set(point.rodIndex, []);
                    }
                    rodWaveformMap.get(point.rodIndex).push({
                        time: point.time,
                        amplitude: point.amplitude
                    });
                });
                
                rodWaveformMap.forEach((waveformPoints, rodIndex) => {
                    window.visualization.updateWaveformPlot(waveformPoints, rodIndex);
                });
            }
            
            // Frequency plot update (uses grouped data)
            if (data.frequencyData) { // Can be empty array
                window.visualization.updateFrequencyPlot(data.frequencyData);
            }
            
            // Resonance plot update (uses grouped data, transformed)
            if (data.frequencyData) { // Can be empty array
                const resonanceDataForPlot = data.frequencyData.map(item => ({
                    length: item.length,
                    naturalFreq: item.naturalFrequency,
                    isResonant: item.isResonant 
                }));
                window.visualization.updateResonancePlot(resonanceDataForPlot, this.excitationFreq);
            }
        }
    }

    /**
     * 更新杆件共振状态
     * @param {THREE.Mesh} rod - 杆件
     * @param {number} index - 索引
     */
    updateRodResonanceStatus(rod, index) {
        const userData = rod.userData;
        
        // 只考虑第一阶模态的共振
        const firstModeFreq = userData.naturalFrequencies[0]?.frequency || 100;
        const frequencyRatio = this.excitationFreq / firstModeFreq;
        const magnification = 1 / Math.sqrt(
            Math.pow(1 - frequencyRatio * frequencyRatio, 2) + 
            Math.pow(2 * this.damping * frequencyRatio, 2)
        );
        
        // 检查是否接近第一阶共振
        const isResonant = vibrationCalculator.isResonant(this.excitationFreq, firstModeFreq, 0.08);

        // 根据放大因子和振动状态调整颜色
        if (isResonant && magnification > 3.0) {
            // 强共振：亮红色
            rod.material.color.setHex(0xff4444);
            rod.material.emissive.setHex(0x440000);
        } else if (magnification > 2.0) {
            // 中等共振：橙色
            rod.material.color.setHex(0xff8800);
            rod.material.emissive.setHex(0x220000);
        } else if (magnification > 1.5) {
            // 轻微共振：黄色
            rod.material.color.setHex(0xffdd00);
            rod.material.emissive.setHex(0x110000);
        } else {
            // 非共振状态：恢复原始颜色
            rod.material.color.setHex(userData.material.color);
            rod.material.emissive.setHex(0x000000);
        }
    }

    /**
     * 设置激励参数
     * @param {Object} params - 参数对象
     */
    setExcitationParams(params) {
        if (params.frequency !== undefined) this.excitationFreq = params.frequency;
        if (params.amplitude !== undefined) this.excitationAmp = params.amplitude;
        if (params.damping !== undefined) this.damping = params.damping;
        if (params.timeScale !== undefined) this.timeScale = params.timeScale;
        if (params.type !== undefined) this.excitationType = params.type;
    }

    /**
     * 设置基础杆件参数 (通常用于线性模式或作为其他模式的默认直径等)
     * @param {Object} params - 参数对象 { count, startLength, lengthStep, diameter }
     */
    setBaseRodParams(params) {
        if (params.count !== undefined) this.baseRodConfig.count = params.count;
        if (params.startLength !== undefined) this.baseRodConfig.startLength = params.startLength;
        if (params.lengthStep !== undefined) this.baseRodConfig.lengthStep = params.lengthStep;
        if (params.diameter !== undefined) this.baseRodConfig.diameter = params.diameter;
        // 当基础参数改变时，如果当前是线性模式，则需要重新创建杆件
        if (this.displayModeConfig.mode === 'linear') {
            this.createAllRods();
        }
    }

    /**
     * 设置显示模式和相关参数
     * @param {Object} config - 显示模式配置
     */
    setDisplayMode(config) {
        console.log('[RodManager.setDisplayMode]', config);
        this.displayModeConfig = { ...this.displayModeConfig, ...config };
        // 模式或其参数更改后，需要重新创建所有杆件
        // this.createAllRods(); // createAllRods 会在 App.vue 中被显式调用
    }

    /**
     * 创建线性排列的杆件 (现有逻辑)
     */
    createLinearRods(material, rodRadius) {
        const spacing = 0.015; // 杆件间距 (m)
        const startX = -(this.baseRodConfig.count - 1) * spacing / 2;

        for (let i = 0; i < this.baseRodConfig.count; i++) {
            const length = (this.baseRodConfig.startLength + i * this.baseRodConfig.lengthStep) / 1000; // mm to m
            const x = startX + i * spacing;

            const rod = this.createSingleRod(length, rodRadius, material.color);
            rod.position.set(x, 0, 0);
            rod.userData = {
                index: i,
                length: length,
                radius: rodRadius,
                material: material,
                naturalFrequencies: materialProperties.calculateAllModalFrequencies(
                    length * 1000, this.baseRodConfig.diameter, material
                )
            };
            this.scene.add(rod);
            this.rods.push(rod);
            this.originalPositions.push(this.storeOriginalPositions(rod));
        }
    }

    /**
     * 创建函数阵列排列的杆件
     */
    createArrayRods(material, rodRadius) {
        const { 
            gridX, gridY, 
            heightFunction: funcName, 
            baseHeight: baseHeightMm, 
            amplitude: amplitudeMm, 
            scaleFactor 
        } = this.displayModeConfig;

        const heightFunc = getArrayHeightFunction(funcName);
        if (!heightFunc) {
            console.error(`[RodManager.createArrayRods] 未找到高度函数: ${funcName}`);
            this.createLinearRods(material, rodRadius); // 回退到线性模式
            alert(`错误：未找到指定的高度函数 (${funcName})，已回退到线性排列。`);
            return;
        }

        console.log(`[RodManager.createArrayRods] Creating ${gridX}x${gridY} array with function: ${funcName}`);

        const spacing = 0.02; // 杆件在X-Z平面上的间距 (m)
        const startX = -(gridX - 1) * spacing / 2;
        const startZ = -(gridY - 1) * spacing / 2;
        let rodGlobalIndex = 0;

        for (let iy = 0; iy < gridY; iy++) { // iy 对应 Z 轴
            for (let ix = 0; ix < gridX; ix++) { // ix 对应 X 轴
                const posX = startX + ix * spacing;
                const posZ = startZ + iy * spacing;

                // func expects x, y as grid indices, scaleFactor, gridX, gridY
                const normalizedHeight = heightFunc(ix, iy, scaleFactor, gridX, gridY);
                
                // 将归一化高度 (-1 to 1 or 0 to 1) 映射到实际杆件长度 (mm)
                // 对于返回 -1 to 1 的函数 (sine, peak, ripple)
                // 对于返回 0 to 1 的函数 (gaussian, linear_slope)
                let rodLengthMm;
                if (funcName === 'gaussian' || funcName === 'linear_slope') {
                    rodLengthMm = baseHeightMm + normalizedHeight * amplitudeMm;
                } else {
                    rodLengthMm = baseHeightMm + (normalizedHeight * 0.5 + 0.5) * amplitudeMm; // 转换到0-1范围再应用振幅
                }

                // 确保杆件长度在合理范围内 (例如，最小1mm)
                rodLengthMm = Math.max(1, rodLengthMm);
                const rodLengthM = rodLengthMm / 1000; // mm to m

                const rod = this.createSingleRod(rodLengthM, rodRadius, material.color);
                rod.position.set(posX, 0, posZ); // Y轴是杆件的向上方向，所以杆件底部在Y=0
                
                rod.userData = {
                    index: rodGlobalIndex++,
                    gridX: ix,
                    gridY: iy,
                    length: rodLengthM,
                    radius: rodRadius,
                    material: material,
                    naturalFrequencies: materialProperties.calculateAllModalFrequencies(
                        rodLengthMm, // 使用mm为单位的长度进行计算
                        this.baseRodConfig.diameter, 
                        material
                    )
                };

                this.scene.add(rod);
                this.rods.push(rod);
                this.originalPositions.push(this.storeOriginalPositions(rod));
            }
        }
    }

    /**
     * 创建空间雕塑模式的杆件 (占位)
     */
    createSculptureRods(material, rodRadius) {
        console.warn("[RodManager.createSculptureRods] 雕塑模式创建逻辑待实现。");
        // 临时创建一个线性排列作为占位符
        this.createLinearRods(material, rodRadius);
        alert("空间雕塑模式正在开发中，将临时显示线性排列。");
    }

    /**
     * 设置材料类型
     * @param {string} materialType - 材料类型
     */
    setMaterial(materialType) {
        if (this.currentMaterial !== materialType) {
            this.currentMaterial = materialType;
            this.createAllRods();
        }
    }

    /**
     * 设置自定义材料参数
     * @param {number} youngModulus - 杨氏模量 (GPa)
     * @param {number} density - 密度 (kg/m³)
     */
    setCustomMaterial(youngModulus, density) {
        materialProperties.setCustomMaterial(youngModulus, density);
        if (this.currentMaterial === 'custom') {
            this.createAllRods();
        }
    }

    /**
     * 播放/暂停动画
     */
    togglePlayPause() {
        this.isPlaying = !this.isPlaying;
    }

    /**
     * 重置动画
     */
    reset() {
        this.currentTime = 0;
        this.isPlaying = false;
        this.createAllRods();
        
        // 清空波形数据
        if (typeof window !== 'undefined' && window.visualization) {
            window.visualization.clearWaveformData();
        }
    }

    /**
     * 设置控制器
     */
    setupControls() {
        // 添加鼠标控制
        this.renderer.domElement.addEventListener('wheel', (event) => {
            event.preventDefault();
            const zoomFactor = event.deltaY > 0 ? 1.1 : 0.9;
            this.camera.position.multiplyScalar(zoomFactor);
        });

        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };

        this.renderer.domElement.addEventListener('mousedown', (event) => {
            isDragging = true;
            previousMousePosition = { x: event.clientX, y: event.clientY };
        });

        this.renderer.domElement.addEventListener('mousemove', (event) => {
            if (isDragging) {
                const deltaX = event.clientX - previousMousePosition.x;
                const deltaY = event.clientY - previousMousePosition.y;

                // 围绕Y轴旋转
                const spherical = new THREE.Spherical();
                spherical.setFromVector3(this.camera.position);
                spherical.theta -= deltaX * 0.01;
                spherical.phi += deltaY * 0.01;
                spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));

                this.camera.position.setFromSpherical(spherical);
                this.camera.lookAt(0, 0, 0);

                previousMousePosition = { x: event.clientX, y: event.clientY };
            }
        });

        this.renderer.domElement.addEventListener('mouseup', () => {
            isDragging = false;
        });
    }

    /**
     * 开始动画循环
     */
    startAnimation() {
        const animate = () => {
            requestAnimationFrame(animate);

            if (this.isPlaying) {
                const deltaTime = this.clock.getDelta() * this.timeScale;
                this.currentTime += deltaTime;
                this.updateRodDeformation();
            }

            if (this.controls) {
                this.controls.update();
            }
            this.renderer.render(this.scene, this.camera);
        };
        
        if (!this.clock.running) {
             this.clock.start();
        }
        animate();
    }

    /**
     * 窗口大小调整
     */
    onWindowResize() {
        if (this.container && this.camera && this.renderer) {
            this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        }
    }

    /**
     * 获取所有杆件的状态信息
     * @returns {Array} 杆件状态数组
     */
    getRodStatusList() {
        return this.rods.map((rod, index) => {
            const userData = rod.userData;
            const naturalFreqs = userData.naturalFrequencies;
            const isResonant = naturalFreqs.some(freq => 
                vibrationCalculator.isResonant(this.excitationFreq, freq.frequency, 0.05)
            );

            return {
                index: index + 1,
                length: Math.round(userData.length * 1000), // m to mm
                naturalFrequencies: naturalFreqs.map(f => Math.round(f.frequency)),
                isResonant: isResonant,
                material: userData.material.name
            };
        });
    }

    /**
     * 设置选定的杆件索引
     * @param {number} index - 杆件索引（0开始）
     */
    setSelectedRodIndex(index) {
        this.selectedRodIndex = index;
    }
}

// ES6 模块导出
export { RodManager }; 