<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import AudioPlayer from './components/AudioPlayer.vue'
import VibrationControls from './components/VibrationControls.vue'

// 组件引用
const audioPlayer = ref(null)
const vibrationControls = ref(null)
const threejsContainer = ref(null)
const waveformPlot = ref(null)
const frequencyPlot = ref(null)
const resonancePlot = ref(null)

// 状态数据
const isSimulationRunning = ref(false)
const is3DInitialized = ref(false)
const selectedRodIndex = ref(4)
const audioEnabled = ref(true)
const currentConfig = ref({
  // 基础杆件参数 (主要用于线性模式或作为阵列/雕塑模式的默认值)
  rodCount: 10,
  startLength: 20, // mm
  lengthStep: 10,  // mm
  diameter: 5,     // mm
  // 材料
  material: 'steel',
  // 激励
  excitationType: 'sine',
  frequency: 100,
  amplitude: 1,
  damping: 0.01,
  timeScale: 1.0,
  // 新增：显示模式特定配置
  displayMode: 'linear',
  displayParams: {} // 用于存储特定模式的参数，如 gridX, gridY, heightFunction等
})

// 模拟引擎实例（稍后从utils中导入）
let vibrationEngine = null
let rodManager = null
let visualization = null
let audioGenerator = null

// 生命周期
onMounted(async () => {
  await initializeVibrationEngine()
})

onUnmounted(() => {
  if (vibrationEngine) {
    vibrationEngine.cleanup()
  }
})

// 初始化振动引擎
async function initializeVibrationEngine() {
  try {
    console.log('开始初始化振动引擎...')
    
    // 外部库已在main.js中确保加载完成
    console.log('THREE.js版本:', THREE.REVISION)
    console.log('D3.js版本:', d3.version)
    
    // 动态导入我们的JavaScript模块
    const { MaterialProperties } = await import('./utils/materials.js')
    const { VibrationCalculator } = await import('./utils/vibration-calc.js')
    const { RodManager } = await import('./utils/rod-manager.js')
    const { Visualization } = await import('./utils/visualization.js')
    const { AudioGenerator } = await import('./utils/audio-generator.js')
    
    // 初始化3D管理器
    if (threejsContainer.value) {
      rodManager = new RodManager()
      const initResult = rodManager.init(threejsContainer.value)
      if (!initResult) {
        throw new Error('3D场景初始化失败')
      }
      console.log('✓ 3D场景初始化成功')
      is3DInitialized.value = true
    }
    
    // 初始化可视化
    visualization = new Visualization()
    visualization.init()
    window.visualization = visualization // 让RodManager可以访问
    console.log('✓ 可视化模块初始化成功')
    
    // 初始化音频生成器
    audioGenerator = new AudioGenerator()
    await audioGenerator.init()
    window.audioGenerator = audioGenerator // 让其他模块可以访问
    
    // 设置音频频率变化回调
    audioGenerator.setFrequencyChangeCallback(handleAudioFrequencyChange)
    
    // 为AudioPlayer组件设置回调（在组件挂载后）
    if (audioPlayer.value) {
      audioPlayer.value.setFrequencyChangeCallback(handleAudioFrequencyChange)
      // audioPlayer.value.setAudioProcessedCallback(handleAudioProcessed) // Replaced by event emitter
      // 设置window.audioPlayer引用供RodManager访问
      window.audioPlayer = audioPlayer.value
    }
    
    console.log('✓ 音频生成器初始化成功')
    
    console.log('✓ 振动引擎初始化完成')
  } catch (error) {
    console.error('振动引擎初始化失败:', error)
    throw error
  }
}

// 处理音频频率变化的回调函数
function handleAudioFrequencyChange(frequency) {
  // 更新当前配置中的频率
  currentConfig.value.frequency = frequency
  
  // 实时更新振动系统的激励频率
  if (rodManager && isSimulationRunning.value) {
    rodManager.setExcitationParams({
      // ...currentConfig.value, // Spread all of currentConfig might be too much here
      // Let's be specific about what RodManager needs from currentConfig for excitation
      type: currentConfig.value.type, // Ensure type is passed
      frequency: frequency,
      amplitude: currentConfig.value.amplitude,
      damping: currentConfig.value.damping,
      timeScale: currentConfig.value.timeScale
    })
  }
  
  // 更新控制面板中的实时频率显示
  if (vibrationControls.value) {
    vibrationControls.value.updateCurrentAudioFrequency(frequency)
  }
  
  console.log(`🎵 实时频率: ${frequency.toFixed(1)}Hz`)
}

// Handler for when an audio file has been successfully processed by AudioPlayer
function handleAudioProcessed() {
  console.log('App.vue: Audio file processed, changing excitation type to audio.');
  
  // Update App.vue's currentConfig for excitation type
  // The key for excitation type in currentConfig seems to be 'type' based on handleExcitationConfigUpdate
  currentConfig.value.type = 'audio';

  // Also, update the UI in VibrationControls so the dropdown changes
  if (vibrationControls.value) {
    vibrationControls.value.updateExcitationTypeExternally('audio');
  }

  // It is important that after App.vue's currentConfig.type is changed,
  // this change is also propagated to RodManager via handleExcitationConfigUpdate.
  // Calling updateExcitationTypeExternally on VibrationControls will trigger its own updateExcitationConfig,
  // which emits 'update-excitation-config', which in turn calls App.vue's handleExcitationConfigUpdate.
  // This ensures the full loop and updates RodManager.
}

// 事件处理方法
function handleRodConfigUpdate(config) {
  currentConfig.value = { ...currentConfig.value, ...config }
  if (rodManager) {
    // 传递基础杆件参数，RodManager内部会根据显示模式决定如何使用它们
    rodManager.setBaseRodParams(config)
    // 当基础杆件参数（如直径）更新后，需要重新生成所有杆件以反映变化
    rodManager.createAllRods(); 
  }
}

function handleMaterialConfigUpdate(config) {
  currentConfig.value.material = config.type
  if (rodManager) {
    rodManager.setMaterial(config.type)
  }
}

function handleExcitationConfigUpdate(config) {
  currentConfig.value = { ...currentConfig.value, ...config }
  if (rodManager) {
    rodManager.setExcitationParams(config)
  }
  
  // 音频频率更新逻辑
  if (audioEnabled.value && audioGenerator && audioGenerator.isPlaying) {
    if (config.type === 'sine') {
      // 正弦波激励：直接更新频率
      audioGenerator.setFrequency(config.frequency)
    } else if (config.type === 'sweep') {
      // 扫频激励：重新开始扫频
      audioGenerator.stop()
      audioGenerator.startFrequencySweep(20, 2000, 10, 0.1)
    } else if (config.type === 'audio') {
      // 音频文件激励：不需要手动设置频率，由音频文件本身决定
      // 如果没有音频文件，停止当前播放
      if (!audioPlayer.value || !audioPlayer.value.hasAudioFile()) {
        audioGenerator.stop()
      }
    }
  }
}

function handleToggleSimulation(running) {
  // 如果要启动模拟，且激励类型是音频文件，需要检查是否已上传音频文件
  if (running && currentConfig.value.type === 'audio') {
    // 检查AudioPlayer组件是否有音频文件
    if (!audioPlayer.value || !audioPlayer.value.hasAudioFile()) {
      alert('请先上传音频文件后再开始模拟！');
      // 重置控制面板状态
      if (vibrationControls.value) {
        vibrationControls.value.setRunningState(false);
      }
      return;
    }
  }
  
  isSimulationRunning.value = running
  if (rodManager) {
    rodManager.togglePlayPause()
  }
  
  // 音频播放控制 - 考虑音频开关状态和激励类型
  if (audioGenerator && audioEnabled.value) {
    audioGenerator.resumeContext() // 确保音频上下文已激活
    
    if (running) {
      // 根据激励类型决定播放方式
      if (currentConfig.value.type === 'sine') {
        audioGenerator.startSineWave(currentConfig.value.frequency, 0.1)
      } else if (currentConfig.value.type === 'audio') {
        // 播放音频文件（通过AudioPlayer组件）
        if (audioPlayer.value) {
          audioPlayer.value.startAudioExcitation()
        }
      } else if (currentConfig.value.type === 'sweep') {
        // 实现扫频功能
        audioGenerator.startFrequencySweep(20, 2000, 10, 0.1)
      }
    } else {
      audioGenerator.stop()
      if (audioPlayer.value) {
        audioPlayer.value.stopAudioExcitation()
      }
    }
  }
}

function handleResetSimulation() {
  isSimulationRunning.value = false
  if (rodManager) {
    rodManager.reset()
  }
  if (vibrationControls.value) {
    vibrationControls.value.setRunningState(false)
  }
  
  // 停止所有音频播放
  if (audioGenerator) {
    audioGenerator.stop()
  }
  
  // 停止AudioPlayer组件的音频播放
  if (audioPlayer.value) {
    audioPlayer.value.stopAudioExcitation()
  }
}

function handleExportResonanceData() {
  console.log('导出共振数据')
  try {
    // 获取共振分析数据
    const resonanceData = generateResonanceData()
    
    // 创建CSV格式的数据
    const csvContent = convertToCSV(resonanceData)
    
    // 创建下载链接
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `resonance_analysis_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    console.log('✓ 共振数据导出成功')
  } catch (error) {
    console.error('共振数据导出失败:', error)
    alert('导出失败：' + error.message)
  }
}

function handleRodSelection(index) {
  selectedRodIndex.value = index
  if (rodManager) {
    rodManager.setSelectedRodIndex(index)
  }
}

function handleRodSelectionChange() {
  // 处理波形图中的杆件选择变化
  if (rodManager) {
    rodManager.setSelectedRodIndex(selectedRodIndex.value)
  }
  
  // 更新波形图显示
  if (visualization) {
    visualization.updateWaveformForRod(selectedRodIndex.value)
  }
  
  console.log(`切换到杆件 ${selectedRodIndex.value + 1}`)
}

function handleAudioSettings(enabled) {
  audioEnabled.value = enabled
  console.log('音频设置:', enabled ? '启用' : '禁用')
  
  // 控制AudioPlayer组件的音频输出
  if (audioPlayer.value) {
    audioPlayer.value.setAudioEnabled(enabled)
    // 确保AudioPlayer有频率变化回调
    audioPlayer.value.setFrequencyChangeCallback(handleAudioFrequencyChange)
  }
  
  // 控制audioGenerator的音频输出（如果存在）
  if (audioGenerator && audioGenerator.gainNode) {
    if (enabled) {
      audioGenerator.gainNode.gain.setValueAtTime(1.0, audioGenerator.audioContext.currentTime)
    } else {
      audioGenerator.gainNode.gain.setValueAtTime(0.0, audioGenerator.audioContext.currentTime)
    }
  }
}

// 新增：处理显示模式更新
function handleDisplayModeUpdate(config) {
  console.log('App.vue: Display mode config updated', config);
  currentConfig.value.displayMode = config.mode;
  currentConfig.value.displayParams = { ...config }; // 存储完整模式参数
  
  if (rodManager) {
    rodManager.setDisplayMode(config); // 将完整模式配置传递给RodManager
  }
  
  // 如果模式从非线性切换到线性，或从线性切换到非线性，可能需要重置或特殊处理
  // 例如，如果切换到线性模式，确保rodConfig中的count, startLength等参数被应用
  if (config.mode === 'linear') {
    if (rodManager) {
      // 确保线性模式使用rodConfig中的参数
      rodManager.setBaseRodParams({
        count: currentConfig.value.rodCount,
        startLength: currentConfig.value.startLength,
        lengthStep: currentConfig.value.lengthStep,
        diameter: currentConfig.value.diameter
      });
      rodManager.createAllRods(); // 重新创建杆件
    }
  } else {
    // 对于阵列或雕塑模式，杆件数量和长度由模式参数决定
    // RodManager的setDisplayMode应该处理这些
    if (rodManager) {
        rodManager.createAllRods(); // 重新创建杆件
    }
  }
}

// 工具方法
function getMaterialName(materialType) {
  const materialNames = {
    steel: '钢材',
    aluminum: '铝材',
    brass: '黄铜',
    copper: '铜材',
    custom: '自定义'
  }
  return materialNames[materialType] || '未知'
}

function getRodLength(index) {
  // 计算指定杆件的长度
  return currentConfig.value.startLength + (index * currentConfig.value.lengthStep)
}

function generateResonanceData() {
  // 生成共振分析数据
  const data = []
  const { MaterialProperties } = window.MaterialProperties || {}
  
  if (!MaterialProperties) {
    throw new Error('材料属性模块未加载')
  }
  
  const material = MaterialProperties.get(currentConfig.value.material)
  const excitationFreq = currentConfig.value.frequency
  const tolerance = 0.01 // ±3%容差
  
  for (let i = 0; i < currentConfig.value.rodCount; i++) {
    const length = getRodLength(i) / 1000 // 转换为米
    const diameter = currentConfig.value.diameter / 1000 // 转换为米
    
    // 计算第一阶固有频率 (杆件一端固定，一端自由)
    const naturalFreq = (1.875 * 1.875 / (2 * Math.PI)) * 
      Math.sqrt((material.youngModulus * 1e9 * Math.PI * Math.pow(diameter/2, 4)) / 
      (material.density * Math.PI * Math.pow(diameter/2, 2) * Math.pow(length, 4)))
    
    // 判断是否接近共振
    const freqDiff = Math.abs(naturalFreq - excitationFreq) / excitationFreq
    const isResonant = freqDiff <= tolerance
    
    data.push({
      rodIndex: i + 1,
      length: getRodLength(i),
      naturalFrequency: naturalFreq.toFixed(2),
      excitationFrequency: excitationFreq,
      frequencyDifference: (freqDiff * 100).toFixed(2),
      isResonant: isResonant,
      material: currentConfig.value.material,
      diameter: currentConfig.value.diameter
    })
  }
  
  return data
}

function convertToCSV(data) {
  // 转换为CSV格式
  const headers = [
    '杆件编号',
    '长度(mm)', 
    '固有频率(Hz)',
    '激励频率(Hz)',
    '频率差异(%)',
    '是否共振',
    '材料',
    '直径(mm)'
  ]
  
  const csvHeaders = headers.join(',')
  const csvRows = data.map(row => [
    row.rodIndex,
    row.length,
    row.naturalFrequency,
    row.excitationFrequency,
    row.frequencyDifference,
    row.isResonant ? '是' : '否',
    row.material,
    row.diameter
  ].join(','))
  
  return [csvHeaders, ...csvRows].join('\n')
}

function handleAudioPlaybackEnded() {
  console.log('App.vue: Audio playback has ended.');
  if (currentConfig.value.type === 'audio' && isSimulationRunning.value) {
    console.log('App.vue: Stopping audio-driven simulation.');
    isSimulationRunning.value = false;
    if (rodManager) {
      rodManager.togglePlayPause(false); // Or a more specific stop method if available
    }
    if (vibrationControls.value) {
      vibrationControls.value.setRunningState(false);
    }
    if (visualization) {
      // visualization.clearWaveformPlot(); // This clears the D3 plot
      visualization.clearWaveformData(selectedRodIndex.value); // Clears data for the current rod
      visualization.updateWaveformPlot([], selectedRodIndex.value); // Pass empty data to effectively clear the plot line
      // If a general clear for all waveform data is needed or preferred:
      // visualization.clearWaveformData(); 
      // visualization.clearWaveformPlot(); 
    }
    // Optionally, reset the excitation type or frequency if desired
    // currentConfig.value.type = 'sine'; // Example: revert to sine
    // currentConfig.value.frequency = 100; // Example: revert to default frequency
    // handleExcitationConfigUpdate(currentConfig.value); // Propagate this change
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-900 text-gray-200 flex flex-col">
    <!-- 顶部标题 -->
    <header class="p-4 text-center border-b border-gray-700">
      <h1 class="text-3xl font-bold text-white">多杆件振动模拟系统</h1>
      <p class="text-gray-400 text-sm">支持音频驱动的实时振动分析与可视化</p>
    </header>

    <!-- 主体内容 -->
    <main class="flex-grow container mx-auto px-2 py-2 lg:px-2 lg:py-2">
      <div class="grid grid-cols-1 lg:grid-cols-12 lg:gap-4 h-full">
        
        <!-- 左侧控制面板 -->
        <div class="lg:col-span-4 space-y-3 overflow-y-auto pr-0">
          <VibrationControls
            ref="vibrationControls"
            @update-rod-config="handleRodConfigUpdate"
            @update-material-config="handleMaterialConfigUpdate"
            @update-excitation-config="handleExcitationConfigUpdate"
            @toggle-simulation="handleToggleSimulation"
            @reset-simulation="handleResetSimulation"
            @export-resonance-data="handleExportResonanceData"
            @select-rod="handleRodSelection"
            @update-audio-settings="handleAudioSettings"
            @update-display-mode="handleDisplayModeUpdate"
            class="bg-gray-800 p-3 border border-gray-700"
          />
          
          <AudioPlayer 
            ref="audioPlayer" 
            class="bg-gray-800 p-1  border border-gray-700"
            @frequency-change="handleAudioFrequencyChange" 
            @audio-processed-successfully="handleAudioProcessed"
            @audio-playback-ended="handleAudioPlaybackEnded" />
        </div>

        <!-- 右侧可视化区域 -->
        <div class="lg:col-span-8 space-y-3 overflow-y-auto pl-1">
          <!-- 3D可视化 -->
          <div class="bg-gray-800 p-3  border border-gray-700">
            <h3 class="text-lg font-semibold text-white mb-2">3D振动可视化</h3>
            <div 
              ref="threejsContainer"
              id="threejs-container"
              class="h-64 md:h-80 bg-black relative overflow-hidden border border-gray-700"
            >
              <div 
                v-if="!is3DInitialized"
                class="absolute inset-0 flex items-center justify-center text-gray-400"
              >
                <div class="text-center">
                  <div class="animate-pulse text-2xl">🔧</div>
                  <p class="mt-1 text-sm">正在初始化3D场景...</p>
                </div>
              </div>
            </div>
          </div>

          <!-- 图表可视化 -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <!-- 波形图 -->
            <div class="bg-gray-800 border border-gray-700">
              <div class="flex justify-between items-center p-2 border-b border-gray-700 h-12">
                <h4 class="text-sm font-medium text-white">振动波形</h4>
                <div class="flex items-center space-x-1">
                  <label class="text-xs text-gray-400">杆件:</label>
                  <select 
                    v-model="selectedRodIndex"
                    @change="handleRodSelectionChange"
                    class="dark-select-options  px-2 py-0.5 text-xs bg-gray-700 border border-gray-600 text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option v-for="i in currentConfig.rodCount" :key="i-1" :value="i-1">
                      杆件{{ i }} ({{ getRodLength(i-1) }}mm)
                    </option>
                  </select>
                </div>
              </div>
              <div id="waveform-plot" class="w-full h-48"></div>
              <div class="px-2 py-1 text-xs text-gray-400 border-t border-gray-700">
                显示所选杆件的实时振动位移随时间变化
              </div>
            </div>

            <!-- 频率图 -->
            <div class="bg-gray-800 border border-gray-700">
              <div class="p-2 border-b border-gray-700 h-12 flex items-center">
                <h4 class="text-sm font-medium text-white">各杆件响应强度</h4>
              </div>
              <div id="frequency-plot" class="w-full h-48"></div>
              <div class="px-2 py-1 text-xs text-gray-400 border-t border-gray-700">
                显示不同长度杆件对当前激励频率的响应强度
              </div>
            </div>
          </div>

          <!-- 共振分析图 -->
          <div class="bg-gray-800 border border-gray-700">
            <div class="p-2 border-b border-gray-700">
              <h3 class="text-sm font-medium text-white">共振分析</h3>
            </div>
            <div id="resonance-plot" class="w-full h-48"></div>
            <div class="px-2 py-1 text-xs text-gray-400 border-t border-gray-700">
              显示各杆件固有频率与激励频率的关系，红点表示共振杆件
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 状态栏 -->
    <footer class="p-2 text-center border-t border-gray-700 mt-auto">
      <div class="container mx-auto">
        <div class="flex justify-between items-center text-xs text-gray-400">
          <div>
            状态: <span :class="isSimulationRunning ? 'text-green-400' : 'text-gray-400'">
              {{ isSimulationRunning ? '运行中' : '停止' }}
            </span>
          </div>
          <div class="flex gap-2">
            <span>杆数:{{ currentConfig.rodCount }}</span>
            <span>频率:{{ currentConfig.frequency }}Hz</span>
            <span>材料:{{ getMaterialName(currentConfig.material) }}</span>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* Minimal scoped styles, relying mostly on Tailwind */
.container {
  max-width: 100%; /* Allow full width usage within viewport constraints */
}

/* 图表容器样式 - 移除所有内边距确保图表充分利用空间 */
#waveform-plot,
#frequency-plot,
#resonance-plot {
  padding: 0;
  margin: 0;
  display: block;
}

#waveform-plot svg,
#frequency-plot svg,
#resonance-plot svg {
  display: block;
  width: 100%;
  height: 100%;
}

/* Adjustments for dark-select-options to fit new solid theme */
.dark-select-options {
  background-color: #374151 !important; /* Tailwind gray-700 */
  color: #e5e7eb !important;           /* Tailwind gray-200 */
  border: 1px solid #4b5563 !important; /* Tailwind gray-600 */
}

.dark-select-options option {
  background-color: #374151 !important; 
  color: #e5e7eb !important;          
  padding: 2px 4px; /* Reduced padding */
}

.dark-select-options:focus option { /* This might not be very visible with solid BGs */
  background-color: #4b5563 !important; 
  color: #f9fafb !important;          
}

.dark-select-options option:checked {
  background-color: #3b82f6 !important; /* Tailwind blue-500 */
  color: #ffffff !important;          
}

.dark-select-options option:hover {
  background-color: #4b5563 !important; 
  color: #f9fafb !important;           
}

/* Custom scrollbar for panels if content overflows */
.lg\:col-span-4.overflow-y-auto::-webkit-scrollbar,
.lg\:col-span-8.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}
.lg\:col-span-4.overflow-y-auto::-webkit-scrollbar-track,
.lg\:col-span-8.overflow-y-auto::-webkit-scrollbar-track {
  background: #1f2937; /* Tailwind gray-800 */
}
.lg\:col-span-4.overflow-y-auto::-webkit-scrollbar-thumb,
.lg\:col-span-8.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #4b5563; /* Tailwind gray-600 */
  border-radius: 1px;
}
.lg\:col-span-4.overflow-y-auto::-webkit-scrollbar-thumb:hover,
.lg\:col-span-8.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #6b7280; /* Tailwind gray-500 */
}
</style>
