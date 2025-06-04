<template>
  <div class="space-y-3">
    <h3 class="text-lg font-semibold text-white mb-3">振动参数控制</h3>
    
    <!-- 显示模式配置 -->
    <div class="space-y-2">
      <h4 class="text-md font-medium text-white mb-2">显示模式</h4>
      <select 
        v-model="displayModeConfig.mode"
        class="dark-select-options w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 mb-2"
        @change="updateDisplayModeConfig"
      >
        <option value="linear">线性排列</option>
        <option value="array">函数阵列</option>
        <option value="sculpture">空间雕塑 (待实现)</option>
      </select>

      <!-- 线性模式提示 -->
      <div v-if="displayModeConfig.mode === 'linear'" class="p-2 bg-gray-700 rounded-sm text-sm text-gray-300">
        <p>经典线性排列模式，杆件参数在下方"杆件配置"部分设置。</p>
      </div>

      <!-- 函数阵列模式参数 -->
      <div v-if="displayModeConfig.mode === 'array'" class="space-y-3 p-2 bg-gray-700 rounded-sm">
        <p class="text-sm text-gray-300 mb-1">配置X-Y平面上的杆件阵列，杆件长度由函数确定。</p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div class="space-y-1">
            <label class="block text-xs font-medium text-white">
              X方向数量: <span class="text-blue-400">{{ displayModeConfig.arrayGridX }}</span> (10-50)
            </label>
            <input 
              v-model.number="displayModeConfig.arrayGridX"
              type="range" min="10" max="50" 
              class="w-full h-1.5 bg-gray-600 rounded-sm appearance-none cursor-pointer accent-blue-500"
              @input="updateDisplayModeConfig"
            />
          </div>
          <div class="space-y-1">
            <label class="block text-xs font-medium text-white">
              Y方向数量: <span class="text-blue-400">{{ displayModeConfig.arrayGridY }}</span> (10-50)
            </label>
            <input 
              v-model.number="displayModeConfig.arrayGridY"
              type="range" min="10" max="50" 
              class="w-full h-1.5 bg-gray-600 rounded-sm appearance-none cursor-pointer accent-blue-500"
              @input="updateDisplayModeConfig"
            />
          </div>
        </div>
        <div class="space-y-1">
            <label class="block text-xs font-medium text-white">总杆件数: <span class="text-green-400 font-semibold">{{ totalArrayRods }}</span></label>
        </div>
        <div class="space-y-1">
          <label class="block text-xs font-medium text-white">高度函数</label>
          <select 
            v-model="displayModeConfig.arrayHeightFunction"
            class="dark-select-options w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            @change="updateDisplayModeConfig"
          >
            <option value="sine">正弦波: sin(πx/s) * sin(πy/s)</option>
            <option value="gaussian">高斯: exp(-((x-c)²+(y-c)²)/f)</option>
            <option value="ripple">波纹: sin(√(x-c)²+(y-c)²)/s)</option>
            <option value="linear_slope">线性倾斜: (x+y)/2</option>
            <option value="peak">山峰: cos(x/s) * cos(y/s)</option>
          </select>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div class="space-y-1">
            <label class="block text-xs font-medium text-white">
              基础高度: <span class="text-blue-400">{{ displayModeConfig.arrayBaseHeight }}mm</span>
            </label>
            <input 
              v-model.number="displayModeConfig.arrayBaseHeight"
              type="range" min="10" max="50" 
              class="w-full h-1.5 bg-gray-600 rounded-sm appearance-none cursor-pointer accent-blue-500"
              @input="updateDisplayModeConfig"
            />
          </div>
          <div class="space-y-1">
            <label class="block text-xs font-medium text-white">
              变化幅度: <span class="text-blue-400">{{ displayModeConfig.arrayAmplitude }}mm</span>
            </label>
            <input 
              v-model.number="displayModeConfig.arrayAmplitude"
              type="range" min="10" max="100" 
              class="w-full h-1.5 bg-gray-600 rounded-sm appearance-none cursor-pointer accent-blue-500"
              @input="updateDisplayModeConfig"
            />
          </div>
          <div class="space-y-1">
            <label class="block text-xs font-medium text-white">
              缩放因子: <span class="text-blue-400">{{ displayModeConfig.arrayScaleFactor.toFixed(1) }}</span>
            </label>
            <input 
              v-model.number="displayModeConfig.arrayScaleFactor"
              type="range" min="0.1" max="3.0" step="0.1"
              class="w-full h-1.5 bg-gray-600 rounded-sm appearance-none cursor-pointer accent-blue-500"
              @input="updateDisplayModeConfig"
            />
          </div>
        </div>
      </div>
      
      <div v-if="displayModeConfig.mode === 'sculpture'" class="p-2 bg-gray-700 rounded-sm text-sm text-gray-300">
        <p>空间雕塑模式参数区域，待后续实现。</p>
      </div>
    </div>
    
    <div class="space-y-2">
      <h4 class="text-md font-medium text-white mb-2 flex justify-between items-center">
        <span>基础杆件参数</span>
        <span class="text-xs text-gray-400 font-normal">
          (线性模式及通用直径)
        </span>
      </h4>
      <div class="p-2 bg-gray-700 rounded-sm space-y-3">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div class="space-y-1" :class="{ 'opacity-50': displayModeConfig.mode !== 'linear' }">
            <label class="block text-xs font-medium text-white">
              杆件数量 (线性): <span class="text-blue-400">{{ rodConfig.count }}根</span>
            </label>
            <input 
              v-model.number="rodConfig.count"
              type="range" min="1" max="50" 
              class="w-full h-1.5 bg-gray-600 rounded-sm appearance-none cursor-pointer accent-blue-500"
              @input="updateRodConfig"
              :disabled="displayModeConfig.mode !== 'linear'"
            />
          </div>
          
          <div class="space-y-1" :class="{ 'opacity-50': displayModeConfig.mode !== 'linear' }">
            <label class="block text-xs font-medium text-white">
              起始长度 (线性): <span class="text-blue-400">{{ rodConfig.startLength }}mm</span>
            </label>
            <input 
              v-model.number="rodConfig.startLength"
              type="range" min="10" max="200" 
              class="w-full h-1.5 bg-gray-600 rounded-sm appearance-none cursor-pointer accent-blue-500"
              @input="updateRodConfig"
              :disabled="displayModeConfig.mode !== 'linear'"
            />
          </div>
          
          <div class="space-y-1" :class="{ 'opacity-50': displayModeConfig.mode !== 'linear' }">
            <label class="block text-xs font-medium text-white">
              长度递增 (线性): <span class="text-blue-400">{{ rodConfig.lengthStep }}mm</span>
            </label>
            <input 
              v-model.number="rodConfig.lengthStep"
              type="range" min="1" max="50" 
              class="w-full h-1.5 bg-gray-600 rounded-sm appearance-none cursor-pointer accent-blue-500"
              @input="updateRodConfig"
              :disabled="displayModeConfig.mode !== 'linear'"
            />
          </div>
          
          <div class="space-y-1">
            <label class="block text-xs font-medium text-white">
              杆件直径: <span class="text-blue-400">{{ rodConfig.diameter }}mm</span>
            </label>
            <input 
              v-model.number="rodConfig.diameter"
              type="range" min="1" max="20" step="0.1"
              class="w-full h-1.5 bg-gray-600 rounded-sm appearance-none cursor-pointer accent-blue-500"
              @input="updateRodConfig" 
            />
          </div>
        </div>
      </div>
    </div>
    
    <div class="space-y-2">
      <h4 class="text-md font-medium text-white mb-2">材料特性</h4>
      <div class="p-2 bg-gray-700 rounded-sm space-y-3">
        <div>
          <label class="block text-xs font-medium text-white mb-1">材料类型</label>
          <select 
            v-model="materialConfig.type"
            class="dark-select-options w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            @change="updateMaterialConfig"
          >
            <option value="steel">钢材</option>
            <option value="aluminum">铝材</option>
            <option value="brass">黄铜</option>
            <option value="copper">铜材</option>
            <option value="custom">自定义</option>
          </select>
        </div>
        
        <div v-if="materialConfig.type === 'custom'" class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div class="space-y-1">
            <label class="block text-xs font-medium text-white">
              弹性模量: <span class="text-blue-400">{{ materialConfig.youngModulus }}GPa</span>
            </label>
            <input 
              v-model.number="materialConfig.youngModulus"
              type="range" 
              min="50" 
              max="400" 
              class="w-full h-1.5 bg-gray-600 rounded-sm appearance-none cursor-pointer accent-blue-500"
              @input="updateMaterialConfig"
            />
          </div>
          
          <div class="space-y-1">
            <label class="block text-xs font-medium text-white">
              密度: <span class="text-blue-400">{{ materialConfig.density }}kg/m³</span>
            </label>
            <input 
              v-model.number="materialConfig.density"
              type="range" 
              min="1000" 
              max="12000" 
              step="100"
              class="w-full h-1.5 bg-gray-600 rounded-sm appearance-none cursor-pointer accent-blue-500"
              @input="updateMaterialConfig"
            />
          </div>
        </div>
        
        <div v-else class="p-2 bg-gray-600 rounded-sm">
          <div class="text-xs text-gray-300 space-y-0.5">
            <div>弹性模量: {{ getCurrentMaterial.youngModulus }}GPa</div>
            <div>密度: {{ getCurrentMaterial.density }}kg/m³</div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="space-y-2">
      <h4 class="text-md font-medium text-white mb-2">激励参数</h4>
      <div class="p-2 bg-gray-700 rounded-sm space-y-3">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-white mb-1">激励类型</label>
            <select 
              v-model="excitationConfig.type"
              class="dark-select-options w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              @change="updateExcitationConfig"
            >
              <option value="sine">正弦波</option>
              <option value="sweep">扫频</option>
              <option value="audio">音频文件</option>
            </select>
          </div>
          <div class="space-y-1">
            <label class="block text-xs font-medium text-white">
              频率: <span class="text-blue-400">{{ excitationConfig.frequency }}Hz</span>
              <span v-if="excitationConfig.type === 'audio' && currentAudioFrequency !== null" class="text-yellow-400 text-xs">(实时: {{ currentAudioFrequency.toFixed(1) }}Hz)</span>
            </label>
            <input 
              v-model.number="excitationConfig.frequency"
              type="range" min="1" max="2000" 
              class="w-full h-1.5 bg-gray-600 rounded-sm appearance-none cursor-pointer accent-blue-500"
              @input="updateExcitationConfig"
              :disabled="excitationConfig.type === 'audio'"
            />
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div class="space-y-1">
            <label class="block text-xs font-medium text-white">
              幅值: <span class="text-blue-400">{{ excitationConfig.amplitude.toFixed(2) }}</span>
            </label>
            <input 
              v-model.number="excitationConfig.amplitude"
              type="range" min="0.01" max="2" step="0.01"
              class="w-full h-1.5 bg-gray-600 rounded-sm appearance-none cursor-pointer accent-blue-500"
              @input="updateExcitationConfig"
            />
          </div>
          <div class="space-y-1">
            <label class="block text-xs font-medium text-white">
              阻尼比: <span class="text-blue-400">{{ excitationConfig.damping.toFixed(2) }}</span>
            </label>
            <input 
              v-model.number="excitationConfig.damping"
              type="range" min="0.01" max="0.2" step="0.005"
              class="w-full h-1.5 bg-gray-600 rounded-sm appearance-none cursor-pointer accent-blue-500"
              @input="updateExcitationConfig"
            />
          </div>
        </div>
        <div v-if="excitationConfig.type === 'audio'" class="p-2 bg-gray-600 rounded-sm text-xs text-gray-300">
          <p>🎵 使用音频文件作为激励源，实时分析主导频率。</p>
          <p>幅值和阻尼比参数仍然有效。</p>
        </div>
      </div>
    </div>

    <!-- 模拟控制 -->
    <div class="space-y-2">
      <h4 class="text-md font-medium text-white mb-2">模拟控制</h4>
      <div class="p-2 bg-gray-700 rounded-sm space-y-3">
        <div class="flex space-x-2">
          <button 
            @click="toggleSimulation" 
            class="flex-1 px-3 py-1.5 text-sm font-medium rounded-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800"
            :class="isRunning ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'"
          >
            {{ isRunning ? '停止' : '开始' }}
          </button>
          <button 
            @click="resetSimulation" 
            class="flex-1 px-3 py-1.5 text-sm font-medium bg-gray-600 hover:bg-gray-500 text-white rounded-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800"
          >
            重置
          </button>
          <button 
            @click="exportData"
            class="flex-1 px-3 py-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800"
          >
            导出数据
          </button>
        </div>
        <div class="flex items-center justify-between mt-2">
          <label for="audioToggle" class="text-sm text-white flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0L19.414 6.27a1 1 0 010 1.414l-3.343 3.343a1 1 0 01-1.414-1.414l2.636-2.637-2.636-2.636a1 1 0 010-1.414zm0 6a1 1 0 011.414 0l3.343 3.343a1 1 0 010 1.414l-3.343 3.343a1 1 0 01-1.414-1.414L17.293 16l-2.636-2.637a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
            音频播放反馈
          </label>
          <button
            @click="toggleAudioEnabled"
            :class="[
              audioEnabled ? 'bg-blue-600' : 'bg-gray-600',
              'relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800'
            ]"
            role="switch"
            :aria-checked="audioEnabled.toString()"
          >
            <span
              :class="[
                audioEnabled ? 'translate-x-5' : 'translate-x-0.5',
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform'
              ]"
            />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

// Props 和 Emits
const emit = defineEmits([
  'update-rod-config',
  'update-material-config', 
  'update-excitation-config',
  'toggle-simulation',
  'reset-simulation',
  'export-resonance-data',
  'select-rod',
  'update-audio-settings',
  'update-display-mode'
])

// 响应式数据
const rodConfig = ref({
  count: 10,
  startLength: 20,
  lengthStep: 10,
  diameter: 5
})

const materialConfig = ref({
  type: 'steel',
  youngModulus: 200,
  density: 7850
})

const excitationConfig = ref({
  type: 'sine',
  frequency: 100,
  amplitude: 1,
  damping: 0.01,
  timeScale: 1.0
})

// 新增：显示模式配置
const displayModeConfig = ref({
  mode: 'linear',
  arrayGridX: 10,
  arrayGridY: 10,
  arrayHeightFunction: 'sine',
  arrayBaseHeight: 20,
  arrayAmplitude: 50,
  arrayScaleFactor: 1.0,
  sculptureType: 'spiral',
  sculptureDensity: 'medium',
  sculptureScale: 1.0
})

const isRunning = ref(false)
const rodStatus = ref([])
const selectedRodIndex = ref(4)
const audioEnabled = ref(true)
const currentAudioFrequency = ref(null)

// 材料预设
const materialPresets = {
  steel: { youngModulus: 200, density: 7850, name: '钢材' },
  aluminum: { youngModulus: 70, density: 2700, name: '铝材' },
  brass: { youngModulus: 100, density: 8400, name: '黄铜' },
  copper: { youngModulus: 110, density: 8900, name: '铜材' }
}

// 计算属性
const getCurrentMaterial = computed(() => {
  if (materialConfig.value.type === 'custom') {
    return {
      youngModulus: materialConfig.value.youngModulus,
      density: materialConfig.value.density
    }
  }
  return materialPresets[materialConfig.value.type] || materialPresets.steel
})

// 方法
function updateRodConfig() {
  emit('update-rod-config', { ...rodConfig.value })
}

function updateMaterialConfig() {
  const config = {
    type: materialConfig.value.type,
    ...getCurrentMaterial.value
  }
  emit('update-material-config', config)
}

function updateExcitationConfig() {
  emit('update-excitation-config', { ...excitationConfig.value })
}

function toggleSimulation() {
  isRunning.value = !isRunning.value
  emit('toggle-simulation', isRunning.value)
}

function resetSimulation() {
  isRunning.value = false
  emit('reset-simulation')
}

function exportData() {
  emit('export-resonance-data')
}

function updateSelectedRod() {
  emit('select-rod', selectedRodIndex.value)
}

function updateAudioSettings() {
  emit('update-audio-settings', audioEnabled.value)
}

// 监听材料类型变化，自动更新参数
watch(() => materialConfig.value.type, (newType) => {
  if (newType !== 'custom') {
    const preset = materialPresets[newType]
    if (preset) {
      materialConfig.value.youngModulus = preset.youngModulus
      materialConfig.value.density = preset.density
    }
  }
  updateMaterialConfig()
})

// 更新实时音频频率显示
function updateCurrentAudioFrequency(freq) {
  currentAudioFrequency.value = freq
}

// 暴露方法供父组件调用
function updateRodStatus(status) {
  rodStatus.value = status
}

function setRunningState(running) {
  isRunning.value = running
}

// 新增：更新显示模式配置
function updateDisplayModeConfig() {
  const configToSend = { mode: displayModeConfig.value.mode };
  if (displayModeConfig.value.mode === 'linear') {
    // 线性模式目前没有独立于rodConfig的参数，但可以预留
  } else if (displayModeConfig.value.mode === 'array') {
    configToSend.gridX = displayModeConfig.value.arrayGridX;
    configToSend.gridY = displayModeConfig.value.arrayGridY;
    configToSend.heightFunction = displayModeConfig.value.arrayHeightFunction;
    configToSend.baseHeight = displayModeConfig.value.arrayBaseHeight;
    configToSend.amplitude = displayModeConfig.value.arrayAmplitude;
    configToSend.scaleFactor = displayModeConfig.value.arrayScaleFactor;
  } else if (displayModeConfig.value.mode === 'sculpture') {
    configToSend.type = displayModeConfig.value.sculptureType;
    configToSend.density = displayModeConfig.value.sculptureDensity;
    configToSend.scale = displayModeConfig.value.sculptureScale;
  }
  emit('update-display-mode', configToSend)
}

// 监听 displayModeConfig 的变化，以便在模式更改时自动触发更新
watch(() => displayModeConfig.value.mode, () => {
  updateDisplayModeConfig();
});

watch(displayModeConfig, () => {
    updateDisplayModeConfig();
}, { deep: true });

// New method to allow parent to set the excitation type
function updateExcitationTypeExternally(newType) {
  if (excitationConfig.value.type !== newType) {
    excitationConfig.value.type = newType;
    // Trigger the existing update mechanism to ensure consistency and emit changes
    updateExcitationConfig();
  }
}

defineExpose({
  updateRodStatus,
  setRunningState,
  updateCurrentAudioFrequency,
  updateExcitationTypeExternally
})
</script>

<style scoped>
/* Scoped styles for VibrationControls, relying mostly on Tailwind */
/* Custom styles for range inputs to make them thinner and match theme */
input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  background: transparent; /* Transparent track */
  cursor: pointer;
  height: 16px; /* Height of the clickable area */
}

/* Track */
input[type="range"]::-webkit-slider-runnable-track {
  height: 4px; /* Slimmer track */
  background: #4b5563; /* gray-600 */
  border-radius: 2px; /* rounded-sm */
}
input[type="range"]::-moz-range-track {
  height: 4px;
  background: #4b5563;
  border-radius: 2px;
}
input[type="range"]::-ms-track {
  height: 4px;
  background: #4b5563;
  border-radius: 2px;
  border-color: transparent;
  color: transparent;
}

/* Thumb */
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  margin-top: -4px; /* (track height - thumb height) / 2 ... (4px - 12px)/2 = -4px */
  background-color: #3b82f6; /* blue-500 */
  height: 12px;
  width: 12px;
  border-radius: 9999px; /* rounded-full */
  border: 2px solid #ffffff; /* Optional: white border for thumb */
}
input[type="range"]::-moz-range-thumb {
  background-color: #3b82f6;
  height: 12px;
  width: 12px;
  border-radius: 9999px;
  border: 2px solid #ffffff;
}
input[type="range"]::-ms-thumb {
  margin-top: 0px;
  background-color: #3b82f6;
  height: 12px;
  width: 12px;
  border-radius: 9999px;
  border: 2px solid #ffffff;
}

/* Focus states for thumb (optional, for accessibility) */
input[type="range"]:focus::-webkit-slider-thumb {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5); /* blue-500 with opacity */
}
input[type="range"]:focus::-moz-range-thumb {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
}
input[type="range"]:focus::-ms-thumb {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
}

/* Ensure disabled sliders are visually distinct */
input[type="range"]:disabled::-webkit-slider-thumb {
  background-color: #6b7280; /* gray-500 */
}
input[type="range"]:disabled::-moz-range-thumb {
  background-color: #6b7280;
}
input[type="range"]:disabled::-ms-thumb {
  background-color: #6b7280;
}
input[type="range"]:disabled::-webkit-slider-runnable-track {
  background: #374151; /* gray-700 */
}
input[type="range"]:disabled::-moz-range-track {
  background: #374151;
}
input[type="range"]:disabled::-ms-track {
  background: #374151;
}
</style> 