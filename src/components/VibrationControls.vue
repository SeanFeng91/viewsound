<template>
  <div class="space-y-2">
    <h3 class="text-lg font-semibold text-white mb-3">振动参数控制</h3>
    
    <!-- 显示模式配置 -->
    <div class="space-y-1">
      <h4 class="text-sm font-medium text-white">显示模式</h4>
      <div class="p-2 bg-gray-700 border border-gray-600 space-y-2">
        <select 
          v-model="displayModeConfig.mode"
          class="w-full px-2 py-1 bg-gray-600 border border-gray-500 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          @change="updateDisplayModeConfig"
        >
          <option value="linear">线性排列</option>
          <option value="array">函数阵列</option>
          <option value="sculpture">空间雕塑</option>
        </select>

        <!-- 线性模式提示 -->
        <div v-if="displayModeConfig.mode === 'linear'" class="p-2 bg-gray-600 text-xs text-gray-300">
          <p>经典线性排列模式，杆件参数在下方"杆件配置"部分设置。</p>
        </div>

        <!-- 函数阵列模式参数 -->
        <div v-if="displayModeConfig.mode === 'array'" class="space-y-2 p-2 bg-gray-600">
          
          <div class="grid grid-cols-2 gap-2">
            <div class="space-y-1">
              <div class="flex justify-between items-center">
                <label class="text-xs font-medium text-white">X方向数量</label>
                <span class="text-xs text-blue-400">{{ displayModeConfig.arrayGridX }}</span>
              </div>
              <input 
                v-model.number="displayModeConfig.arrayGridX"
                type="range" min="10" max="50" 
                class="w-full h-1 bg-gray-500 appearance-none cursor-pointer accent-blue-500"
                @input="updateDisplayModeConfig"
              />
            </div>
            <div class="space-y-1">
              <div class="flex justify-between items-center">
                <label class="text-xs font-medium text-white">Y方向数量</label>
                <span class="text-xs text-blue-400">{{ displayModeConfig.arrayGridY }}</span>
              </div>
              <input 
                v-model.number="displayModeConfig.arrayGridY"
                type="range" min="10" max="50" 
                class="w-full h-1 bg-gray-500 appearance-none cursor-pointer accent-blue-500"
                @input="updateDisplayModeConfig"
              />
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-2">
            <div class="flex justify-between items-center">
              <label class="text-xs font-medium text-white">总杆件数</label>
              <span class="text-xs text-green-400 font-semibold">{{ totalArrayRods }}</span>
            </div>
            <div class="flex justify-between items-center">
              <label class="text-xs font-medium text-white">高度函数</label>
              <select 
                v-model="displayModeConfig.arrayHeightFunction"
                class="px-2 py-1 bg-gray-500 border border-gray-400 text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                @change="updateDisplayModeConfig"
              >
                <option value="sine">正弦波</option>
                <option value="gaussian">高斯</option>
                <option value="ripple">波纹</option>
                <option value="linear_slope">线性倾斜</option>
                <option value="peak">山峰</option>
              </select>
            </div>
            
          </div>
          
          
          <div class="grid grid-cols-3 gap-2">
            <div class="space-y-1">
              <div class="flex justify-between items-center">
                <label class="text-xs font-medium text-white">基础高度</label>
                <span class="text-xs text-blue-400">{{ displayModeConfig.arrayBaseHeight }}mm</span>
              </div>
              <input 
                v-model.number="displayModeConfig.arrayBaseHeight"
                type="range" min="10" max="50" 
                class="w-full h-1 bg-gray-500 appearance-none cursor-pointer accent-blue-500"
                @input="updateDisplayModeConfig"
              />
            </div>
            <div class="space-y-1">
              <div class="flex justify-between items-center">
                <label class="text-xs font-medium text-white">变化幅度</label>
                <span class="text-xs text-blue-400">{{ displayModeConfig.arrayAmplitude }}mm</span>
              </div>
              <input 
                v-model.number="displayModeConfig.arrayAmplitude"
                type="range" min="10" max="100" 
                class="w-full h-1 bg-gray-500 appearance-none cursor-pointer accent-blue-500"
                @input="updateDisplayModeConfig"
              />
            </div>
            <div class="space-y-1">
              <div class="flex justify-between items-center">
                <label class="text-xs font-medium text-white">缩放因子</label>
                <span class="text-xs text-blue-400">{{ displayModeConfig.arrayScaleFactor.toFixed(1) }}</span>
              </div>
              <input 
                v-model.number="displayModeConfig.arrayScaleFactor"
                type="range" min="0.1" max="3.0" step="0.1"
                class="w-full h-1 bg-gray-500 appearance-none cursor-pointer accent-blue-500"
                @input="updateDisplayModeConfig"
              />
            </div>
          </div>
          
          <div class="grid grid-cols-1 gap-2">
            <div class="space-y-1">
              <div class="flex justify-between items-center">
                <label class="text-xs font-medium text-white">阵列间距</label>
                <span class="text-xs text-blue-400">{{ displayModeConfig.arraySpacing }}mm</span>
              </div>
              <input 
                v-model.number="displayModeConfig.arraySpacing"
                type="range" min="10" max="50" 
                class="w-full h-1 bg-gray-500 appearance-none cursor-pointer accent-blue-500"
                @input="updateDisplayModeConfig"
              />
            </div>
          </div>
          <p class="text-xs text-gray-300">配置X-Y平面上的杆件阵列，杆件长度由函数确定。</p>

        </div>
        
        <!-- 空间雕塑模式参数 -->
        <div v-if="displayModeConfig.mode === 'sculpture'" class="space-y-2 p-2 bg-gray-600">
          
          <div class="grid grid-cols-2 gap-2">
            <div class="flex justify-between items-center">
              <label class="text-xs font-medium text-white">雕塑类型</label>
              <select 
                v-model="displayModeConfig.sculptureType"
                class="px-2 py-1 bg-gray-500 border border-gray-400 text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                @change="updateDisplayModeConfig"
              >
                <option value="radial">放射状</option>
                <option value="wing">翼状</option>
                <option value="spiral">螺旋状</option>
                <option value="butterfly">蝴蝶状</option>
                <option value="ring">环形</option>
              </select>
            </div>
            <div class="flex justify-between items-center">
              <label class="text-xs font-medium text-white">总杆件数</label>
              <span class="text-xs text-green-400 font-semibold">{{ displayModeConfig.sculptureRodCount }}</span>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-2">
            <div class="space-y-1">
              <div class="flex justify-between items-center">
                <label class="text-xs font-medium text-white">基础长度</label>
                <span class="text-xs text-blue-400">{{ displayModeConfig.sculptureBaseLength }}mm</span>
              </div>
              <input 
                v-model.number="displayModeConfig.sculptureBaseLength"
                type="range" min="10" max="50" 
                class="w-full h-1 bg-gray-500 appearance-none cursor-pointer accent-blue-500"
                @input="updateDisplayModeConfig"
              />
            </div>
            <div class="space-y-1">
              <div class="flex justify-between items-center">
                <label class="text-xs font-medium text-white">长度变化</label>
                <span class="text-xs text-blue-400">{{ displayModeConfig.sculptureLengthVariation }}mm</span>
              </div>
              <input 
                v-model.number="displayModeConfig.sculptureLengthVariation"
                type="range" min="10" max="100" 
                class="w-full h-1 bg-gray-500 appearance-none cursor-pointer accent-blue-500"
                @input="updateDisplayModeConfig"
              />
            </div>
            <div class="space-y-1">
              <div class="flex justify-between items-center">
                <label class="text-xs font-medium text-white">雕塑尺寸</label>
                <span class="text-xs text-blue-400">{{ displayModeConfig.sculptureScale.toFixed(1) }}</span>
              </div>
              <input 
                v-model.number="displayModeConfig.sculptureScale"
                type="range" min="0.5" max="3.0" step="0.1"
                class="w-full h-1 bg-gray-500 appearance-none cursor-pointer accent-blue-500"
                @input="updateDisplayModeConfig"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div class="space-y-1">
              <div class="flex justify-between items-center">
                <label class="text-xs font-medium text-white">杆件数量</label>
                <span class="text-xs text-blue-400">{{ displayModeConfig.sculptureRodCount }}</span>
              </div>
              <input 
                v-model.number="displayModeConfig.sculptureRodCount"
                type="range" min="20" max="200" 
                class="w-full h-1 bg-gray-500 appearance-none cursor-pointer accent-blue-500"
                @input="updateDisplayModeConfig"
              />
            </div>
            <div class="space-y-1" v-if="displayModeConfig.sculptureType === 'spiral'">
              <div class="flex justify-between items-center">
                <label class="text-xs font-medium text-white">螺旋圈数</label>
                <span class="text-xs text-blue-400">{{ displayModeConfig.spiralTurns }}</span>
              </div>
              <input 
                v-model.number="displayModeConfig.spiralTurns"
                type="range" min="1" max="5" step="0.5"
                class="w-full h-1 bg-gray-500 appearance-none cursor-pointer accent-blue-500"
                @input="updateDisplayModeConfig"
              />
            </div>
          </div>
          
          <p class="text-xs text-gray-300">
            配置3D空间中的艺术雕塑形状。每个杆件都有独立的位置和方向。
          </p>

        </div>
      </div>
    </div>
    
    <!-- 基础杆件参数 -->
    <div class="space-y-1">
      <div class="flex justify-between items-center">
        <h4 class="text-sm font-medium text-white">基础杆件参数</h4>
        <span class="text-xs text-gray-400">(线性模式及通用直径)</span>
      </div>
      <div class="p-2 bg-gray-700 border border-gray-600 space-y-2">
        <div class="grid grid-cols-2 gap-2">
          <div class="space-y-1" :class="{ 'opacity-50': displayModeConfig.mode !== 'linear' }">
            <div class="flex justify-between items-center">
              <label class="text-xs font-medium text-white">杆件数量 (线性)</label>
              <span class="text-xs text-blue-400">{{ rodConfig.count }}根</span>
            </div>
            <input 
              v-model.number="rodConfig.count"
              type="range" min="1" max="50" 
              class="w-full h-1 bg-gray-500 appearance-none cursor-pointer accent-blue-500"
              @input="updateRodConfig"
              :disabled="displayModeConfig.mode !== 'linear'"
            />
          </div>
          
          <div class="space-y-1" :class="{ 'opacity-50': displayModeConfig.mode !== 'linear' }">
            <div class="flex justify-between items-center">
              <label class="text-xs font-medium text-white">起始长度 (线性)</label>
              <span class="text-xs text-blue-400">{{ rodConfig.startLength }}mm</span>
            </div>
            <input 
              v-model.number="rodConfig.startLength"
              type="range" min="10" max="200" 
              class="w-full h-1 bg-gray-500 appearance-none cursor-pointer accent-blue-500"
              @input="updateRodConfig"
              :disabled="displayModeConfig.mode !== 'linear'"
            />
          </div>
          
          <div class="space-y-1" :class="{ 'opacity-50': displayModeConfig.mode !== 'linear' }">
            <div class="flex justify-between items-center">
              <label class="text-xs font-medium text-white">长度递增 (线性)</label>
              <span class="text-xs text-blue-400">{{ rodConfig.lengthStep }}mm</span>
            </div>
            <input 
              v-model.number="rodConfig.lengthStep"
              type="range" min="1" max="50" 
              class="w-full h-1 bg-gray-500 appearance-none cursor-pointer accent-blue-500"
              @input="updateRodConfig"
              :disabled="displayModeConfig.mode !== 'linear'"
            />
          </div>
          
          <div class="space-y-1" :class="{ 'opacity-50': displayModeConfig.mode !== 'linear' }">
            <div class="flex justify-between items-center">
              <label class="text-xs font-medium text-white">杆件间距 (线性)</label>
              <span class="text-xs text-blue-400">{{ rodConfig.spacing }}mm</span>
            </div>
            <input 
              v-model.number="rodConfig.spacing"
              type="range" min="5" max="50" 
              class="w-full h-1 bg-gray-500 appearance-none cursor-pointer accent-blue-500"
              @input="updateRodConfig"
              :disabled="displayModeConfig.mode !== 'linear'"
            />
          </div>
          
          <div class="space-y-1">
            <div class="flex justify-between items-center">
              <label class="text-xs font-medium text-white">杆件直径</label>
              <span class="text-xs text-blue-400">{{ rodConfig.diameter }}mm</span>
            </div>
            <input 
              v-model.number="rodConfig.diameter"
              type="range" min="0.5" max="5" step="0.1"
              class="w-full h-1 bg-gray-500 appearance-none cursor-pointer accent-blue-500"
              @input="updateRodConfig" 
            />
          </div>
        </div>
      </div>
    </div>
    
    <!-- 材料特性 -->
    <div class="space-y-1">
      <h4 class="text-sm font-medium text-white">材料特性</h4>
      <div class="p-2 bg-gray-700 border border-gray-600 space-y-2">
        <div class="flex gap-2 items-start">
          <!-- 左列: 材料类型选择 -->
          <div class="w-1/2">
            <select 
              v-model="materialConfig.type"
              class="w-full px-2 py-1 bg-gray-600 border border-gray-500 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              @change="updateMaterialConfig"
            >
              <option value="steel">钢材</option>
              <option value="aluminum">铝材</option>
              <option value="brass">黄铜</option>
              <option value="copper">铜材</option>
              <option value="custom">自定义</option>
            </select>
          </div>
          
          <!-- 右列: 材料特性显示/编辑 -->
          <div class="w-1/2">
            <div v-if="materialConfig.type === 'custom'" class="space-y-2">
              <div class="space-y-1">
                <div class="flex justify-between items-center">
                  <label class="text-xs font-medium text-white">弹性模量</label>
                  <span class="text-xs text-blue-400">{{ materialConfig.youngModulus }}GPa</span>
                </div>
                <input 
                  v-model.number="materialConfig.youngModulus"
                  type="range" 
                  min="50" 
                  max="400" 
                  class="w-full h-1 bg-gray-500 appearance-none cursor-pointer accent-blue-500"
                  @input="updateMaterialConfig"
                />
              </div>
              
              <div class="space-y-1">
                <div class="flex justify-between items-center">
                  <label class="text-xs font-medium text-white">密度</label>
                  <span class="text-xs text-blue-400">{{ materialConfig.density }}kg/m³</span>
                </div>
                <input 
                  v-model.number="materialConfig.density"
                  type="range" 
                  min="1000" 
                  max="12000" 
                  step="100"
                  class="w-full h-1 bg-gray-500 appearance-none cursor-pointer accent-blue-500"
                  @input="updateMaterialConfig"
                />
              </div>
            </div>
            
            <div v-else class="p-2 bg-gray-600 border border-gray-500 h-full flex flex-col justify-center">
              <div class="text-xs text-gray-300 space-y-0.5">
                <div>弹性模量: {{ getCurrentMaterial.youngModulus }}GPa</div>
                <div>密度: {{ getCurrentMaterial.density }}kg/m³</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 激励参数 -->
    <div class="space-y-1">
      <h4 class="text-sm font-medium text-white">激励参数</h4>
      <div class="p-2 bg-gray-700 border border-gray-600 space-y-2">
        <div class="grid grid-cols-2 gap-2">
          <div class="flex justify-between items-center">
            <label class="text-xs font-medium text-white">激励类型</label>
            <select 
              v-model="excitationConfig.type"
              class="px-2 py-1 bg-gray-600 border border-gray-500 text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              @change="updateExcitationConfig"
            >
              <option value="sine">正弦波</option>
              <option value="sweep">扫频</option>
              <option value="audio">音频文件</option>
            </select>
          </div>
          <div class="space-y-1">
            <div class="flex justify-between items-center">
              <label class="text-xs font-medium text-white">频率</label>
              <span class="text-xs text-blue-400">{{ excitationConfig.frequency }}Hz</span>
              <span v-if="excitationConfig.type === 'audio' && currentAudioFrequency !== null" class="text-xs text-yellow-400">(实时: {{ currentAudioFrequency.toFixed(1) }}Hz)</span>
            </div>
            <input 
              v-model.number="excitationConfig.frequency"
              type="range" min="1" max="2000" 
              class="w-full h-1 bg-gray-500 appearance-none cursor-pointer accent-blue-500"
              @input="updateExcitationConfig"
              :disabled="excitationConfig.type === 'audio'"
            />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div class="space-y-1">
            <div class="flex justify-between items-center">
              <label class="text-xs font-medium text-white">幅值</label>
              <span class="text-xs text-blue-400">{{ excitationConfig.amplitude.toFixed(2) }}</span>
            </div>
            <input 
              v-model.number="excitationConfig.amplitude"
              type="range" min="0.01" max="2" step="0.01"
              class="w-full h-1 bg-gray-500 appearance-none cursor-pointer accent-blue-500"
              @input="updateExcitationConfig"
            />
          </div>
          <div class="space-y-1">
            <div class="flex justify-between items-center">
              <label class="text-xs font-medium text-white">阻尼比</label>
              <span class="text-xs text-blue-400">{{ excitationConfig.damping.toFixed(2) }}</span>
            </div>
            <input 
              v-model.number="excitationConfig.damping"
              type="range" min="0.01" max="0.2" step="0.005"
              class="w-full h-1 bg-gray-500 appearance-none cursor-pointer accent-blue-500"
              @input="updateExcitationConfig"
            />
          </div>
        </div>
        <div v-if="excitationConfig.type === 'audio'" class="p-2 bg-gray-600 border border-gray-500 text-xs text-gray-300">
          <p>🎵 使用音频文件作为激励源，实时分析主导频率。</p>
          <p>幅值和阻尼比参数仍然有效。</p>
        </div>
      </div>
    </div>

    <!-- 模拟控制 -->
    <div class="space-y-1">
      <h4 class="text-sm font-medium text-white">模拟控制</h4>
      <div class="p-2 bg-gray-700 border border-gray-600">
        <!-- 主控制按钮组 -->
        <div class="grid grid-cols-3 gap-1">
          <button 
            @click="toggleSimulation" 
            class="flex items-center justify-center px-3 py-2 text-xs font-medium transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-offset-gray-800"
            :class="isRunning ? 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-500' : 'bg-green-500 hover:bg-green-600 text-white focus:ring-green-500'"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path v-if="!isRunning" fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
              <path v-else fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            {{ isRunning ? '停止' : '开始' }}
          </button>
          <button 
            @click="resetSimulation" 
            class="flex items-center justify-center px-3 py-2 text-xs font-medium bg-gray-600 hover:bg-gray-500 text-white transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1 focus:ring-offset-gray-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
            </svg>
            重置
          </button>
          <button 
            @click="exportData"
            class="flex items-center justify-center px-3 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-gray-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
            导出
          </button>
        </div>

        <!-- 音频控制开关 -->
        <div class="flex items-center justify-between mt-2 px-0 py-2">
          <div class="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" 
                 :class="audioEnabled ? 'text-blue-400' : 'text-gray-400'">
              <path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.414A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clip-rule="evenodd" />
            </svg>
            <span class="text-xs" :class="audioEnabled ? 'text-gray-200' : 'text-gray-400'">音频反馈</span>
          </div>
          <button
            @click="toggleAudioEnabled"
            class="relative inline-flex h-5 w-9 items-center transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
            :class="audioEnabled ? 'bg-blue-600' : 'bg-gray-600'"
            role="switch"
            :aria-checked="audioEnabled.toString()"
          >
            <span class="sr-only">启用音频</span>
            <span
              class="inline-block h-3 w-3 transform bg-white shadow-lg transition-transform duration-200 ease-in-out"
              :class="audioEnabled ? 'translate-x-5' : 'translate-x-1'"
            />
          </button>
        </div>

        <!-- 运行状态指示器 -->
        <div class="mt-2 px-1 py-1 bg-gray-800 border border-gray-600 flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <div class="flex h-2 w-2 relative">
              <span 
                class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                :class="isRunning ? 'bg-green-400' : 'bg-gray-400'"
              ></span>
              <span 
                class="relative inline-flex rounded-full h-2 w-2"
                :class="isRunning ? 'bg-green-500' : 'bg-gray-500'"
              ></span>
            </div>
            <span class="text-xs" :class="isRunning ? 'text-green-400' : 'text-gray-400'">
              {{ isRunning ? '模拟运行中' : '已停止' }}
            </span>
          </div>
          <span v-if="excitationConfig.type === 'audio' && currentAudioFrequency" 
                class="text-xs text-yellow-400">
            {{ currentAudioFrequency.toFixed(1) }}Hz
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { SculptureManager, DEFAULT_SCULPTURE_CONFIG } from '../utils/sculpture-manager.js'
import { ArrayManager, DEFAULT_ARRAY_CONFIG } from '../utils/array-manager.js'

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
  count: 20,
  startLength: 20,
  lengthStep: 10,
  diameter: 1,
  spacing: 10
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

// 新增：显示模式配置 - 使用DEFAULT_SCULPTURE_CONFIG和DEFAULT_ARRAY_CONFIG
const displayModeConfig = ref({
  mode: 'linear',
  // 阵列参数 - 从默认配置中获取
  arrayGridX: DEFAULT_ARRAY_CONFIG.gridX,
  arrayGridY: DEFAULT_ARRAY_CONFIG.gridY,
  arrayHeightFunction: DEFAULT_ARRAY_CONFIG.heightFunction,
  arrayBaseHeight: DEFAULT_ARRAY_CONFIG.baseHeight,
  arrayAmplitude: DEFAULT_ARRAY_CONFIG.amplitude,
  arrayScaleFactor: DEFAULT_ARRAY_CONFIG.scaleFactor,
  arraySpacing: DEFAULT_ARRAY_CONFIG.spacing,
  // 雕塑参数 - 从默认配置中获取
  sculptureType: DEFAULT_SCULPTURE_CONFIG.type,
  sculptureDensity: 'medium',
  sculptureScale: 1.0,
  sculptureRodCount: DEFAULT_SCULPTURE_CONFIG.rodCount,
  sculptureBaseLength: DEFAULT_SCULPTURE_CONFIG.baseLength,
  sculptureLengthVariation: DEFAULT_SCULPTURE_CONFIG.lengthVariation,
  spiralTurns: DEFAULT_SCULPTURE_CONFIG.spiralTurns
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

const totalArrayRods = computed(() => {
  return displayModeConfig.value.arrayGridX * displayModeConfig.value.arrayGridY
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

function toggleAudioEnabled() {
  audioEnabled.value = !audioEnabled.value
  updateAudioSettings()
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
    configToSend.spacing = displayModeConfig.value.arraySpacing;
  } else if (displayModeConfig.value.mode === 'sculpture') {
    configToSend.type = displayModeConfig.value.sculptureType;
    configToSend.density = displayModeConfig.value.sculptureDensity;
    configToSend.scale = displayModeConfig.value.sculptureScale;
    configToSend.rodCount = displayModeConfig.value.sculptureRodCount;
    configToSend.baseLength = displayModeConfig.value.sculptureBaseLength;
    configToSend.lengthVariation = displayModeConfig.value.sculptureLengthVariation;
    configToSend.spiralTurns = displayModeConfig.value.spiralTurns;
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

// 获取当前rod配置的方法
function getCurrentRodConfig() {
  return { ...rodConfig.value }
}

// 获取当前显示模式配置的方法  
function getCurrentDisplayModeConfig() {
  return { ...displayModeConfig.value }
}

// 更新雕塑配置方法 - 接收外部更新
function updateSculptureConfig(config) {
  if (config) {
    // 只更新雕塑相关参数，不影响其他配置
    displayModeConfig.value.sculptureType = config.sculptureType || displayModeConfig.value.sculptureType;
    displayModeConfig.value.sculptureRodCount = config.sculptureRodCount || displayModeConfig.value.sculptureRodCount;
    displayModeConfig.value.sculptureBaseLength = config.sculptureBaseLength || displayModeConfig.value.sculptureBaseLength;
    displayModeConfig.value.sculptureLengthVariation = config.sculptureLengthVariation || displayModeConfig.value.sculptureLengthVariation;
    displayModeConfig.value.spiralTurns = config.spiralTurns || displayModeConfig.value.spiralTurns;
    
    // 更新显示模式配置
    updateDisplayModeConfig();
  }
}

// 更新阵列配置方法 - 接收外部更新
function updateArrayConfig(config) {
  if (config) {
    // 只更新阵列相关参数，不影响其他配置
    displayModeConfig.value.arrayGridX = config.gridX || displayModeConfig.value.arrayGridX;
    displayModeConfig.value.arrayGridY = config.gridY || displayModeConfig.value.arrayGridY;
    displayModeConfig.value.arrayHeightFunction = config.heightFunction || displayModeConfig.value.arrayHeightFunction;
    displayModeConfig.value.arrayBaseHeight = config.baseHeight || displayModeConfig.value.arrayBaseHeight;
    displayModeConfig.value.arrayAmplitude = config.amplitude || displayModeConfig.value.arrayAmplitude;
    displayModeConfig.value.arrayScaleFactor = config.scaleFactor || displayModeConfig.value.arrayScaleFactor;
    displayModeConfig.value.arraySpacing = config.spacing || displayModeConfig.value.arraySpacing;
    
    // 更新显示模式配置
    updateDisplayModeConfig();
  }
}

defineExpose({
  updateRodStatus,
  setRunningState,
  updateCurrentAudioFrequency,
  updateExcitationTypeExternally,
  getCurrentRodConfig,
  getCurrentDisplayModeConfig,
  updateSculptureConfig,
  updateArrayConfig
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
  height: 2px; /* Even thinner track */
  background: #6b7280; /* gray-500 */
  border-radius: 0; /* No rounded corners */
}
input[type="range"]::-moz-range-track {
  height: 2px;
  background: #6b7280;
  border-radius: 0;
}
input[type="range"]::-ms-track {
  height: 2px;
  background: #6b7280;
  border-radius: 0;
  border-color: transparent;
  color: transparent;
}

/* Thumb */
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  margin-top: -5px; /* (track height - thumb height) / 2 ... (2px - 12px)/2 = -5px */
  background-color: #3b82f6; /* blue-500 */
  height: 12px;
  width: 12px;
  border-radius: 0; /* Square thumb, no rounded corners */
  border: 1px solid #ffffff; /* White border for thumb */
}
input[type="range"]::-moz-range-thumb {
  background-color: #3b82f6;
  height: 12px;
  width: 12px;
  border-radius: 0;
  border: 1px solid #ffffff;
}
input[type="range"]::-ms-thumb {
  margin-top: 0px;
  background-color: #3b82f6;
  height: 12px;
  width: 12px;
  border-radius: 0;
  border: 1px solid #ffffff;
}

/* Focus states for thumb (optional, for accessibility) */
input[type="range"]:focus::-webkit-slider-thumb {
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5); /* blue-500 with opacity */
}
input[type="range"]:focus::-moz-range-thumb {
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
}
input[type="range"]:focus::-ms-thumb {
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
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

/* Additional computed property for total array rods */
</style> 