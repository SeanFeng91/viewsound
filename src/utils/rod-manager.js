/**
 * 杆件管理模块
 * 管理多个杆件的创建、更新和可视化
 */

import { MaterialProperties } from './materials.js';
import { VibrationCalculator } from './vibration-calc.js';
import { getArrayHeightFunction } from './math-functions.js'; // 导入高度函数获取器
import { SculptureManager, DEFAULT_SCULPTURE_CONFIG } from './sculpture-manager.js'; // 导入雕塑管理器和默认配置
import { ArrayManager, DEFAULT_ARRAY_CONFIG } from './array-manager.js'; // 导入阵列管理器和默认配置

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
        this.startTime = 0; // 添加开始时间记录
        this.isPlaying = false;
        this.clock = null; // 延迟初始化
        this.container = null;
        this.selectedRodIndex = 4; // 默认选择第5根杆件
        
        // 杆件配置
        this.baseRodConfig = {
            count: 10,
            startLength: 20, // mm
            lengthStep: 10,  // mm
            diameter: 2,     // mm
            spacing: 15      // 杆件间距 (mm)
        };
        
        // 显示模式配置
        this.displayModeConfig = {
            mode: 'linear',
            // 阵列参数 - 从默认配置中获取
            gridX: DEFAULT_ARRAY_CONFIG.gridX,
            gridY: DEFAULT_ARRAY_CONFIG.gridY,
            heightFunction: DEFAULT_ARRAY_CONFIG.heightFunction,
            baseHeight: DEFAULT_ARRAY_CONFIG.baseHeight,
            amplitude: DEFAULT_ARRAY_CONFIG.amplitude,
            scaleFactor: DEFAULT_ARRAY_CONFIG.scaleFactor,
            spacing: DEFAULT_ARRAY_CONFIG.spacing,
            // 雕塑参数 - 从默认配置中获取
            sculptureType: DEFAULT_SCULPTURE_CONFIG.type,           
            sculptureRodCount: DEFAULT_SCULPTURE_CONFIG.rodCount,             
            sculptureBaseLength: DEFAULT_SCULPTURE_CONFIG.baseLength,           
            sculptureLengthVariation: DEFAULT_SCULPTURE_CONFIG.lengthVariation,      
            sculptureScale: 1.0,               
            spiralTurns: DEFAULT_SCULPTURE_CONFIG.spiralTurns
        };
        
        // 激励参数
        this.excitationType = 'sine';
        this.excitationFreq = 100;
        this.excitationAmp = 1;
        this.damping = 0.01;
        this.timeScale = 1.0;
        
        // 材料
        this.currentMaterial = 'steel';
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
        this.createEnvironment(); // 添加环境创建
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
        // 设置天空色背景
        this.scene.background = new THREE.Color(0xe6f3ff); 

        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(25, aspect, 0.01, 1000); // 稍微增大FOV
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
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4); // 降低环境光强度
        this.scene.add(ambientLight);

        // 平行光，模拟太阳光，产生阴影
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8); // 降低平行光强度
        directionalLight.position.set(8, 12, 6);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -2;
        directionalLight.shadow.camera.right = 2;
        directionalLight.shadow.camera.top = 2;
        directionalLight.shadow.camera.bottom = -2;
        directionalLight.shadow.bias = -0.0005;
        this.scene.add(directionalLight);
        
        // 半球光，模拟天空和地面的反射光
        const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x362d1d, 0.3); // 天空蓝和地面褐色
        hemisphereLight.position.set(0, 20, 0);
        this.scene.add(hemisphereLight);

        // 添加一个辅助点光源，增强杆件区域的照明
        const pointLight = new THREE.PointLight(0xffffff, 0.3, 10);
        pointLight.position.set(0, 2, 2);
        this.scene.add(pointLight);
    }

    /**
     * 创建环境（地面和墙面）
     */
    createEnvironment() {
        // 创建地面
        const groundSize = 1; // 地面大小 (米)
        const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize);
        const groundMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x666666, // 浅灰色地面
            transparent: true,
            opacity: 0.8
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2; // 旋转到水平面
        ground.position.y = -0.001; // 稍微低于Y=0，避免Z-fighting
        ground.receiveShadow = true;
        this.scene.add(ground);

        // 创建网格线地面
        const gridHelper = new THREE.GridHelper(groundSize, 20, 0x999999, 0xcccccc);
        gridHelper.position.y = 0;
        gridHelper.material.opacity = 0.3;
        gridHelper.material.transparent = true;
        this.scene.add(gridHelper);

        // 创建后墙面
        const wallHeight = 0.5;
        const wallGeometry = new THREE.PlaneGeometry(groundSize, wallHeight);
        const wallMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x888888, // 几乎白色的墙面
            transparent: true,
            opacity: 0.3
        });
        const backWall = new THREE.Mesh(wallGeometry, wallMaterial);
        backWall.position.set(0, wallHeight / 2, -groundSize / 2);
        backWall.receiveShadow = true;
        this.scene.add(backWall);

        // 创建左侧墙面
        const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
        leftWall.rotation.y = Math.PI / 2;
        leftWall.position.set(-groundSize / 2, wallHeight / 2, 0);
        leftWall.receiveShadow = true;
        this.scene.add(leftWall);

        // // 添加墙角线（装饰性）
        const edgeGeometry = new THREE.CylinderGeometry(0.001, 0.001, wallHeight);
        const edgeMaterial = new THREE.MeshLambertMaterial({ color: 0x777777 });
        
        // // 后墙和左墙的交界线
        const cornerEdge = new THREE.Mesh(edgeGeometry, edgeMaterial);
        cornerEdge.position.set(-groundSize / 2, wallHeight / 2, -groundSize / 2);
        this.scene.add(cornerEdge);

        // // 地面边界线
        // const groundEdgeGeometry = new THREE.CylinderGeometry(0.005, 0.005, groundSize);
        // groundEdgeGeometry.rotateZ(Math.PI / 2);
        
        // const backGroundEdge = new THREE.Mesh(groundEdgeGeometry, edgeMaterial);
        // backGroundEdge.position.set(0, 0.005, -groundSize / 2);
        // this.scene.add(backGroundEdge);
        
        // const leftGroundEdge = new THREE.Mesh(groundEdgeGeometry, edgeMaterial);
        // leftGroundEdge.rotation.y = Math.PI / 2;
        // leftGroundEdge.position.set(-groundSize / 2, 0.005, 0);
        // this.scene.add(leftGroundEdge);

        console.log('[RodManager] 环境创建完成：地面、墙面和装饰元素');
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
                this.createSculptureRods(material, rodRadius);
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
            // 默认相机位置，能看到地面和墙面
            this.camera.position.set(1.5, 1.2, 1.8);
            this.camera.lookAt(0, 0.3, 0);
            return;
        }

        // 计算杆件的边界框
        let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity, maxY = -Infinity;
        this.rods.forEach(rod => {
            minX = Math.min(minX, rod.position.x);
            maxX = Math.max(maxX, rod.position.x);
            minZ = Math.min(minZ, rod.position.z);
            maxZ = Math.max(maxZ, rod.position.z);
            maxY = Math.max(maxY, rod.userData.length);
        });

        const centerX = (minX + maxX) / 2;
        const centerZ = (minZ + maxZ) / 2;
        const extentX = maxX - minX;
        const extentZ = maxZ - minZ;
        
        const maxExtent = Math.max(extentX, extentZ, maxY);

        // 根据杆件布局调整相机位置，确保能看到环境
        let camX, camY, camZ;

        if (this.displayModeConfig.mode === 'array') {
            // 阵列模式：相机位置稍远，能看到整个阵列和周围环境
            camX = centerX + maxExtent * 0.8;
            camY = Math.max(maxY * 1.2, 0.8) + maxExtent * 0.3;
            camZ = centerZ + maxExtent * 1.2;
        } else if (this.displayModeConfig.mode === 'sculpture') {
            // 雕塑模式：根据雕塑类型调整相机视角
            const sculptureType = this.displayModeConfig.type || this.displayModeConfig.sculptureType;
            
            if (sculptureType === 'radial' || sculptureType === 'butterfly') {
                // 球形或蝴蝶状雕塑需要更高的视角
                camX = centerX + maxExtent * 0.8;
                camY = Math.max(maxY * 1.8, 1.2) + maxExtent * 0.5;
                camZ = centerZ + maxExtent * 1.2;
            } else if (sculptureType === 'spiral') {
                // 螺旋雕塑需要倾斜视角
                camX = centerX + maxExtent * 0.9;
                camY = Math.max(maxY * 1.5, 1.0) + maxExtent * 0.4;
                camZ = centerZ + maxExtent * 1.0;
            } else if (sculptureType === 'wing') {
                // 翼状雕塑需要侧面视角
                camX = centerX + maxExtent * 0.4;
                camY = Math.max(maxY * 1.3, 0.9) + maxExtent * 0.3;
                camZ = centerZ + maxExtent * 1.5;
            } else if (sculptureType === 'ring') {
                // 环形雕塑需要更俯视的角度
                camX = centerX + maxExtent * 0.3;
                camY = Math.max(maxY * 2.0, 1.5) + maxExtent * 0.6;
                camZ = centerZ + maxExtent * 0.3;
            } else {
                // 默认雕塑视角
                camX = centerX + maxExtent * 0.7;
                camY = Math.max(maxY * 1.5, 1.0) + maxExtent * 0.4;
                camZ = centerZ + maxExtent * 1.3;
            }
        } else {
            // 线性模式：相机位置适中
            camX = centerX + maxExtent * 0.6;
            camY = Math.max(maxY * 1.0, 0.6) + maxExtent * 0.2;
            camZ = centerZ + maxExtent * 1.0;
        }

        // 确保相机不会太靠近或太远
        const minDistance = 0.5;
        const maxDistance = 8.0;
        const distance = Math.sqrt(camX * camX + camY * camY + camZ * camZ);
        
        if (distance < minDistance) {
            const scale = minDistance / distance;
            camX *= scale;
            camY *= scale;
            camZ *= scale;
        } else if (distance > maxDistance) {
            const scale = maxDistance / distance;
            camX *= scale;
            camY *= scale;
            camZ *= scale;
        }

        this.camera.position.set(camX, camY, camZ);
        
        // 观察点设置：注视杆件区域的中心偏上位置
        const lookAtY = Math.max(maxY / 3, 0.2);
        this.camera.lookAt(centerX, lookAtY, centerZ); // 修正：看向杆件中心

        console.log(`[RodManager.updateCameraView] 相机位置: (${camX.toFixed(2)}, ${camY.toFixed(2)}, ${camZ.toFixed(2)})`);
        console.log(`[RodManager.updateCameraView] 观察点: (${centerX.toFixed(2)}, ${lookAtY.toFixed(2)}, ${centerZ.toFixed(2)})`);
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
     * 设置基础杆件参数
     * @param {Object} params - 杆件参数
     */
    setBaseRodParams(params) {
        if (params.count !== undefined) this.baseRodConfig.count = params.count;
        if (params.startLength !== undefined) this.baseRodConfig.startLength = params.startLength;
        if (params.lengthStep !== undefined) this.baseRodConfig.lengthStep = params.lengthStep;
        if (params.diameter !== undefined) this.baseRodConfig.diameter = params.diameter;
        if (params.spacing !== undefined) this.baseRodConfig.spacing = params.spacing;
        
        console.log('[RodManager] 基础杆件参数已更新:', this.baseRodConfig);
    }

    /**
     * 设置显示模式
     * @param {Object} config - 显示模式配置
     */
    setDisplayMode(config) {
        console.log('[RodManager.setDisplayMode] 收到配置:', JSON.stringify(config));
        
        // 添加详细日志跟踪type参数
        if (config.mode === 'sculpture') {
            console.log('[RodManager.setDisplayMode] 雕塑类型参数检查:',
                        'type =', config.type,
                        'sculptureType =', this.displayModeConfig.sculptureType);
        }
        
        this.displayModeConfig = { ...this.displayModeConfig, ...config };
        console.log('[RodManager] 显示模式配置已更新:', this.displayModeConfig);
    }

    /**
     * 创建线性排列的杆件 (现有逻辑)
     */
    createLinearRods(material, rodRadius) {
        const spacing = this.baseRodConfig.spacing / 1000; // 杆件间距 (m)
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

        const spacing = this.displayModeConfig.spacing / 1000; // 杆件在X-Z平面上的间距 (m)
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
     * 创建空间雕塑模式的杆件
     */
    createSculptureRods(material, rodRadius) {
        console.log('[RodManager.createSculptureRods] 开始创建空间雕塑杆件');
        
        // 创建雕塑管理器实例
        const sculptureManager = new SculptureManager();
        
        // 增加调试信息查看原始displayModeConfig
        console.log('[RodManager.createSculptureRods] 原始displayModeConfig:', 
                    JSON.stringify({
                        type: this.displayModeConfig.type,
                        sculptureType: this.displayModeConfig.sculptureType
                    }));
        
        // 设置雕塑配置 - 使用displayModeConfig的参数
        const sculptureConfig = {
            // 修复：优先使用type参数，其次使用sculptureType参数，最后使用默认配置
            type: this.displayModeConfig.type || this.displayModeConfig.sculptureType || DEFAULT_SCULPTURE_CONFIG.type,
            rodCount: this.displayModeConfig.rodCount || this.displayModeConfig.sculptureRodCount || DEFAULT_SCULPTURE_CONFIG.rodCount,
            baseLength: this.displayModeConfig.baseLength || this.displayModeConfig.sculptureBaseLength || DEFAULT_SCULPTURE_CONFIG.baseLength, 
            lengthVariation: this.displayModeConfig.lengthVariation || this.displayModeConfig.sculptureLengthVariation || DEFAULT_SCULPTURE_CONFIG.lengthVariation, 
            radius: (this.displayModeConfig.scale || this.displayModeConfig.sculptureScale || 1.0) * 0.15, 
            height: (this.displayModeConfig.scale || this.displayModeConfig.sculptureScale || 1.0) * 0.1,  
            spiralTurns: this.displayModeConfig.spiralTurns || DEFAULT_SCULPTURE_CONFIG.spiralTurns
        };
        
        console.log('[RodManager.createSculptureRods] 雕塑配置:', sculptureConfig);
        
        // 生成雕塑杆件数据
        const sculptureRods = sculptureManager.generateSculptureRods(sculptureConfig);
        console.log(`[RodManager.createSculptureRods] 生成了 ${sculptureRods.length} 个雕塑杆件`);
        
        // 创建3D杆件对象
        sculptureRods.forEach((rodData, index) => {
            const { position, direction, length } = rodData;
            
            // 创建杆件几何体
            const rod = this.createSingleRod(length, rodRadius, material.color);
            
            // 设置杆件位置
            rod.position.set(position.x, position.y, position.z);
            
            // 计算杆件旋转，使其沿着指定方向
            const rodDirection = new THREE.Vector3(direction.x, direction.y, direction.z);
            const defaultUp = new THREE.Vector3(0, 1, 0); // 杆件默认朝上
            
            // 计算旋转四元数
            const quaternion = new THREE.Quaternion();
            quaternion.setFromUnitVectors(defaultUp, rodDirection);
            rod.setRotationFromQuaternion(quaternion);
            
            // 设置杆件数据
            rod.userData = {
                index: index,
                length: length,
                radius: rodRadius,
                material: material,
                sculptureData: rodData, // 保存原始雕塑数据
                naturalFrequencies: materialProperties.calculateAllModalFrequencies(
                    length * 1000, // m to mm
                    this.baseRodConfig.diameter, 
                    material
                )
            };
            
            this.scene.add(rod);
            this.rods.push(rod);
            this.originalPositions.push(this.storeOriginalPositions(rod));
        });
        
        console.log(`[RodManager.createSculptureRods] 雕塑杆件创建完成，类型: ${sculptureConfig.type}`);
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
        
        // 如果开始播放，记录当前时间作为开始时间
        if (this.isPlaying) {
            this.startTime = this.clock.getElapsedTime();
        }
    }

    /**
     * 重置动画
     */
    reset() {
        this.currentTime = 0;
        this.startTime = 0; // 重置开始时间
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
                
                // 计算观察点 - 考虑当前显示模式
                let lookAtX = 0, lookAtY = 0, lookAtZ = 0;
                
                if (this.rods.length > 0) {
                    // 计算杆件中心
                    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity, maxY = -Infinity;
                    this.rods.forEach(rod => {
                        minX = Math.min(minX, rod.position.x);
                        maxX = Math.max(maxX, rod.position.x);
                        minZ = Math.min(minZ, rod.position.z);
                        maxZ = Math.max(maxZ, rod.position.z);
                        maxY = Math.max(maxY, rod.userData.length);
                    });
                    
                    lookAtX = (minX + maxX) / 2;
                    lookAtY = this.displayModeConfig.mode === 'sculpture' ? maxY / 2 : 0; // 雕塑模式看中心点
                    lookAtZ = (minZ + maxZ) / 2;
                }
                
                this.camera.lookAt(lookAtX, lookAtY, lookAtZ);
                
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
                // 计算相对于开始时间的偏移量
                const elapsedTime = this.clock.getElapsedTime();
                this.currentTime = (elapsedTime - this.startTime) * this.timeScale;
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
     * 设置选中的杆件索引
     * @param {number} index - 杆件索引
     */
    setSelectedRodIndex(index) {
        this.selectedRodIndex = index
        console.log(`[RodManager] 选中杆件: ${index}`)
    }

    /**
     * 设置预设视角
     * @param {string} viewType - 视角类型: 'front', 'top', 'angle45', 'side'
     */
    setPresetView(viewType) {
        if (!this.camera) return
        
        // 获取杆件边界信息
        let centerX = 0, centerZ = 0, maxY = 0.5
        if (this.rods.length > 0) {
            let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity
            this.rods.forEach(rod => {
                minX = Math.min(minX, rod.position.x)
                maxX = Math.max(maxX, rod.position.x)
                minZ = Math.min(minZ, rod.position.z)
                maxZ = Math.max(maxZ, rod.position.z)
                maxY = Math.max(maxY, rod.userData.length)
            })
            centerX = (minX + maxX) / 2
            centerZ = (minZ + maxZ) / 2
        }
        
        const distance = 2.0 // 观察距离
        const lookAtPoint = { x: centerX, y: maxY / 3, z: centerZ }
        
        switch (viewType) {
            case 'front': // 正视图 - 从前方Z轴正方向观察
                this.camera.position.set(centerX, maxY / 2, centerZ + distance)
                this.camera.lookAt(lookAtPoint.x, lookAtPoint.y, lookAtPoint.z)
                break
                
            case 'top': // 俯视图 - 从上方Y轴正方向观察
                this.camera.position.set(centerX, distance * 1.5, centerZ)
                this.camera.lookAt(lookAtPoint.x, lookAtPoint.y, lookAtPoint.z)
                break
                
            case 'side': // 侧视图 - 从右侧X轴正方向观察
                this.camera.position.set(centerX + distance, maxY / 2, centerZ)
                this.camera.lookAt(lookAtPoint.x, lookAtPoint.y, lookAtPoint.z)
                break
                
            case 'angle45': // 45度斜视图 - 经典等轴测视角
                this.camera.position.set(centerX + distance * 0.7, maxY * 0.8 + distance * 0.5, centerZ + distance * 0.7)
                this.camera.lookAt(lookAtPoint.x, lookAtPoint.y, lookAtPoint.z)
                break
                
            case 'auto': // 自动视角 - 恢复到自动计算的最佳视角
            default:
                this.updateCameraView()
                break
        }
        
        console.log(`[RodManager] 设置预设视角: ${viewType}`)
    }

    /**
     * 重置雕塑配置为默认值
     */
    resetSculptureConfig() {
        // 从SculptureManager获取默认配置
        const defaultConfig = SculptureManager.getDefaultConfig();
        
        // 更新displayModeConfig中的雕塑相关参数
        this.displayModeConfig.type = defaultConfig.type;
        this.displayModeConfig.sculptureType = defaultConfig.type;
        this.displayModeConfig.rodCount = defaultConfig.rodCount;
        this.displayModeConfig.sculptureRodCount = defaultConfig.rodCount;
        this.displayModeConfig.baseLength = defaultConfig.baseLength;
        this.displayModeConfig.sculptureBaseLength = defaultConfig.baseLength;
        this.displayModeConfig.lengthVariation = defaultConfig.lengthVariation;
        this.displayModeConfig.sculptureLengthVariation = defaultConfig.lengthVariation;
        this.displayModeConfig.spiralTurns = defaultConfig.spiralTurns;
        
        console.log('[RodManager] 雕塑配置已重置为默认值:', this.displayModeConfig);
        
        if (this.displayModeConfig.mode === 'sculpture') {
            // 如果当前是雕塑模式，重新创建杆件
            this.createAllRods();
        }
        
        return this.displayModeConfig;
    }
    
    /**
     * 获取可用的雕塑类型列表
     * @returns {Array} 雕塑类型列表
     */
    getAvailableSculptureTypes() {
        return SculptureManager.getAvailableTypes();
    }

    /**
     * 重置阵列配置为默认值
     */
    resetArrayConfig() {
        // 从ArrayManager获取默认配置
        const defaultConfig = ArrayManager.getDefaultConfig();
        
        // 更新displayModeConfig中的阵列相关参数
        this.displayModeConfig.gridX = defaultConfig.gridX;
        this.displayModeConfig.gridY = defaultConfig.gridY;
        this.displayModeConfig.heightFunction = defaultConfig.heightFunction;
        this.displayModeConfig.baseHeight = defaultConfig.baseHeight;
        this.displayModeConfig.amplitude = defaultConfig.amplitude;
        this.displayModeConfig.scaleFactor = defaultConfig.scaleFactor;
        this.displayModeConfig.spacing = defaultConfig.spacing;
        
        console.log('[RodManager] 阵列配置已重置为默认值:', this.displayModeConfig);
        
        if (this.displayModeConfig.mode === 'array') {
            // 如果当前是阵列模式，重新创建杆件
            this.createAllRods();
        }
        
        return this.displayModeConfig;
    }

    /**
     * 获取可用的高度函数列表
     * @returns {Array} 高度函数列表
     */
    getAvailableHeightFunctions() {
        return ArrayManager.getAvailableHeightFunctions();
    }
}

// ES6 模块导出
export { RodManager }; 