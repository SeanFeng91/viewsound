/**
 * 初始化脚本 - 创建全局对象实例并进行系统初始化
 */

// 全局模块实例
let materialProperties;
let vibrationCalculator;
let audioProcessor;
let rodManager;
let visualization;
let mainController;

/**
 * 模块加载检查
 */
function checkModulesLoaded() {
    console.log('开始检查模块加载状态...');
    
    const requiredClasses = [
        'MaterialProperties',
        'VibrationCalculator', 
        'AudioProcessor',
        'RodManager',
        'Visualization',
        'MainController'
    ];

    const loadedClasses = [];
    const missingClasses = [];

    requiredClasses.forEach(className => {
        if (typeof window[className] !== 'undefined') {
            loadedClasses.push(className);
            console.log(`✓ ${className} 已加载`);
        } else {
            missingClasses.push(className);
            console.error(`✗ ${className} 未找到`);
        }
    });

    if (missingClasses.length > 0) {
        console.error('缺少以下模块:', missingClasses);
        console.log('已加载的模块:', loadedClasses);
        console.log('请检查JavaScript文件是否正确加载和模块是否正确导出');
        return false;
    }

    console.log('✓ 所有模块检查通过');
    return true;
}

/**
 * 初始化全局对象实例
 */
function initializeModuleInstances() {
    try {
        // 按依赖顺序初始化模块
        materialProperties = new MaterialProperties();
        console.log('✓ 材料特性模块已初始化');

        vibrationCalculator = new VibrationCalculator();
        console.log('✓ 振动计算模块已初始化');

        audioProcessor = new AudioProcessor();
        console.log('✓ 音频处理模块已初始化');

        visualization = new Visualization('waveform-plot', 'frequency-plot');
        console.log('✓ 可视化模块已初始化');

        rodManager = new RodManager(vibrationCalculator, materialProperties);
        console.log('✓ 杆件管理模块已初始化');

        mainController = new MainController();
        console.log('✓ 主控制模块已初始化');

        return true;
    } catch (error) {
        console.error('模块初始化失败:', error);
        return false;
    }
}

/**
 * 检查Three.js依赖
 */
function checkThreeJSLoaded() {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 30; // 最多等待3秒
        
        const checkInterval = setInterval(() => {
            attempts++;
            
            if (typeof THREE !== 'undefined') {
                console.log('✓ Three.js库已加载');
                clearInterval(checkInterval);
                resolve(true);
            } else if (attempts >= maxAttempts) {
                console.error('Three.js库未加载，请检查CDN链接');
                clearInterval(checkInterval);
                reject(false);
            }
        }, 100);
    });
}

/**
 * 检查Plotly依赖
 */
function checkPlotlyLoaded() {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 30; // 最多等待3秒
        
        const checkInterval = setInterval(() => {
            attempts++;
            
            if (typeof Plotly !== 'undefined') {
                console.log('✓ Plotly库已加载');
                clearInterval(checkInterval);
                resolve(true);
            } else if (attempts >= maxAttempts) {
                console.error('Plotly库未加载，请检查CDN链接');
                clearInterval(checkInterval);
                reject(false);
            }
        }, 100);
    });
}

/**
 * 检查浏览器兼容性
 */
function checkBrowserCompatibility() {
    const features = {
        'Web Audio API': typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined',
        'File API': typeof FileReader !== 'undefined',
        'Canvas API': typeof HTMLCanvasElement !== 'undefined',
        'WebGL': (() => {
            try {
                const canvas = document.createElement('canvas');
                return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
            } catch (e) {
                return false;
            }
        })(),
        'ES6 Classes': (() => {
            try {
                eval('class Test {}');
                return true;
            } catch (e) {
                return false;
            }
        })()
    };

    const unsupportedFeatures = Object.entries(features)
        .filter(([name, supported]) => !supported)
        .map(([name]) => name);

    if (unsupportedFeatures.length > 0) {
        console.warn('浏览器不支持以下特性:', unsupportedFeatures);
        const message = `您的浏览器不支持以下特性：${unsupportedFeatures.join(', ')}。\n建议使用最新版本的Chrome、Firefox或Edge浏览器。`;
        alert(message);
        return false;
    }

    console.log('✓ 浏览器兼容性检查通过');
    return true;
}

/**
 * 显示加载状态
 */
function showLoadingStatus(message) {
    const statusElement = document.getElementById('loading-status');
    if (statusElement) {
        statusElement.textContent = message;
    }
    console.log(message);
}

/**
 * 隐藏加载界面
 */
function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 300);
    }
}

/**
 * 显示错误信息
 */
function showError(message) {
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
    console.error(message);
}

/**
 * 等待所有脚本加载完成
 */
function waitForScriptsLoaded() {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 50; // 最多等待5秒
        
        const checkScripts = () => {
            attempts++;
            console.log(`检查脚本加载状态... 尝试 ${attempts}/${maxAttempts}`);
            
            // 检查所有必需的类是否已加载
            const allLoaded = [
                'MaterialProperties',
                'VibrationCalculator', 
                'AudioProcessor',
                'RodManager',
                'Visualization',
                'MainController'
            ].every(className => typeof window[className] !== 'undefined');
            
            if (allLoaded) {
                console.log('✓ 所有脚本已加载完成');
                resolve();
            } else if (attempts >= maxAttempts) {
                reject(new Error('脚本加载超时'));
            } else {
                setTimeout(checkScripts, 100);
            }
        };
        
        checkScripts();
    });
}

/**
 * 主要初始化函数
 */
async function initializeApplication() {
    console.log('开始初始化多杆件振动模拟系统...');
    
    try {
        // 显示加载状态
        showLoadingStatus('检查浏览器兼容性...');
        
        // 1. 检查浏览器兼容性
        if (!checkBrowserCompatibility()) {
            showError('浏览器兼容性检查失败，请使用支持的浏览器');
            return;
        }

        // 2. 检查外部库
        showLoadingStatus('检查外部库...');
        try {
            await checkThreeJSLoaded();
            await checkPlotlyLoaded();
        } catch (error) {
            showError('外部库加载失败，请检查网络连接');
            return;
        }

        // 3. 等待所有脚本加载
        showLoadingStatus('等待模块加载...');
        await waitForScriptsLoaded();

        // 4. 检查模块加载
        showLoadingStatus('验证模块完整性...');
        if (!checkModulesLoaded()) {
            showError('模块加载失败，请检查文件路径和网络连接');
            return;
        }

        // 5. 初始化模块实例
        showLoadingStatus('初始化模块...');
        if (!initializeModuleInstances()) {
            showError('模块初始化失败');
            return;
        }

        // 6. 初始化主应用程序
        showLoadingStatus('启动应用程序...');
        await mainController.init();
        console.log('✓ 应用程序启动成功');
        
        // 隐藏加载界面
        hideLoadingScreen();
        
        // 显示成功消息
        setTimeout(() => {
            console.log('🎉 多杆件振动模拟系统已准备就绪！');
        }, 500);
        
    } catch (error) {
        showError('应用程序启动失败: ' + error.message);
        console.error('启动错误详情:', error);
    }
}

/**
 * 错误处理
 */
window.addEventListener('error', (event) => {
    console.error('全局错误:', event.error);
    showError('发生意外错误: ' + event.error.message);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('未处理的Promise拒绝:', event.reason);
    showError('异步操作失败: ' + event.reason);
});

/**
 * DOM内容加载完成后开始初始化
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApplication);
} else {
    // 如果DOM已经加载完成，直接初始化
    initializeApplication();
}

// 导出初始化函数供其他脚本使用
window.initializeApplication = initializeApplication; 