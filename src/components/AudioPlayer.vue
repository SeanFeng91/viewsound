<template>
  <div class="space-y-3">
    <h3 class="text-base font-semibold text-white mb-2">音频文件处理</h3>
    
    <div class="space-y-1.5">
      <label class="block text-xs font-medium text-gray-300">选择音频文件</label>
      <input 
        ref="audioFileInput"
        type="file" 
        accept="audio/*" 
        @change="handleFileChange"
        class="w-full px-3 py-1.5 bg-gray-700 border border-gray-600 text-gray-200 text-xs 
               file:mr-2 file:py-1 file:px-3 file:border-0 file:text-xs file:font-semibold 
               file:bg-blue-600 file:text-white file: file:cursor-pointer hover:file:bg-blue-700 
               focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
    
    <div v-if="isProcessing" class="p-2.5 bg-blue-600/30 border border-blue-500/50">
      <div class="flex items-center text-blue-300 text-xs">
        <svg class="animate-spin h-4 w-4 text-blue-300 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        正在分析音频文件...
      </div>
    </div>
    
    <div v-if="audioInfo && audioBuffer" class="p-2.5 bg-green-600/30 border border-green-500/50  space-y-1.5">
      <div class="flex items-center text-green-300 mb-1 text-xs font-medium">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>
        音频文件就绪
      </div>
      <div class="text-xs text-gray-300 space-y-1 pl-1">
        <div class="flex justify-between"><span class="font-medium text-gray-400">文件:</span> <span class="truncate">{{ audioInfo.filename }}</span></div>
        <div class="flex justify-between"><span class="font-medium text-gray-400">时长:</span> <span>{{ audioInfo.duration?.toFixed(2) }}秒</span></div>
        <div class="flex justify-between"><span class="font-medium text-gray-400">采样率:</span> <span>{{ audioInfo.sampleRate }}Hz</span></div>
        <div class="flex justify-between"><span class="font-medium text-gray-400">声道数:</span> <span>{{ audioInfo.channels }}</span></div>
      </div>
    </div>
    
    <div v-if="audioBuffer" class="space-y-1.5">
      <div class="flex justify-between text-xs text-gray-400">
        <span>{{ formatTime(currentTime) }}</span>
        <span>{{ formatTime(duration) }}</span>
      </div>
      <div 
        ref="timelineTrack"
        @click="seekOnTimelineClick"
        class="h-2.5 bg-gray-600 rounded-full cursor-pointer relative group"
      >
        <div 
          class="h-full bg-blue-500 rounded-full"
          :style="{ width: progressPercentage + '%' }"
        ></div>
        <div 
          class="absolute top-1/2 h-3.5 w-3.5 bg-white rounded-full shadow border-2 border-blue-500 -translate-y-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
          :style="{ left: progressPercentage + '%' }"
          aria-hidden="true"
        ></div>
      </div>
    </div>
    
    <div v-if="audioBuffer" class="space-y-1.5">
      <label class="block text-xs font-medium text-gray-300">波形显示</label>
      <div ref="waveformContainer" class="h-24 relative overflow-hidden bg-gray-700  border border-gray-600 group">
        <canvas 
          ref="waveformCanvas"
          class="absolute inset-0 w-full h-full" 
          @mousemove="onWaveformHover"
          @mouseleave="clearHoverTime"
        ></canvas>
        <div v-if="hoverTime !== null && waveformContainer && waveformCanvas" 
             class="absolute top-0 bottom-0 border-l border-dashed border-yellow-400 pointer-events-none"
             :style="{ left: (hoverTime / duration) * waveformCanvas.width + 'px' }" >
            <span class="absolute top-0 -translate-x-1/2 bg-gray-800 text-yellow-400 text-2xs px-1 rounded-b-sm">{{ formatTime(hoverTime) }}</span>
        </div>
        <div 
          v-if="isPlaying && duration > 0 && waveformCanvas"
          class="absolute top-0 bottom-0 w-0.5 bg-red-500 pointer-events-none transition-transform duration-100 ease-linear"
          :style="{ transform: 'translateX(' + (currentTime / duration * waveformCanvas.width) + 'px)' }"
        >
      </div>
      </div>
    </div>
    
    <div v-if="audioBuffer" class="space-y-1.5">
      <label class="block text-xs font-medium text-gray-300">频谱分析</label>
      <div 
        ref="spectrumContainer"
        class="h-20 bg-gray-700 border border-gray-600"
      >
        <canvas 
          ref="spectrumCanvas"
          class="w-full h-full"
        ></canvas>
      </div>
    </div>
    
    <div v-if="isPlaying && isExcitationMode" class="p-2.5 bg-gray-700/70 border border-gray-600/50 space-y-1.5">
      <div class="flex justify-between items-center">
        <span class="text-xs font-medium text-gray-200">实时频率分析</span>
        <button 
          @click="resetFrequencyAnalysis"
          class="px-2 py-0.5 text-2xs bg-gray-600 hover:bg-gray-500 text-gray-200 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          重置
        </button>
      </div>
      <div class="text-2xs text-gray-300 space-y-1">
        <div v-if="currentAnalysis && typeof currentAnalysis.frequency === 'number'" class="flex justify-between">
          <div><span class="text-blue-400">主导频率:</span> {{ currentAnalysis.frequency.toFixed(1) }}Hz</div>
          <div v-if="typeof currentAnalysis.confidence === 'number'"><span class="text-yellow-400">置信度:</span> {{ (currentAnalysis.confidence * 100).toFixed(0) }}%</div>
        </div>
        <div v-if="currentAnalysis && currentAnalysis.peaks && currentAnalysis.peaks.length > 1">
          <span class="text-green-400">主要峰值:</span>
          <span v-for="(peak, index) in currentAnalysis.peaks.slice(0, 3)" :key="index" class="ml-1">
            <span v-if="peak && typeof peak.frequency === 'number'">{{ peak.frequency.toFixed(0) }}Hz</span>
          </span>
        </div>
      </div>
    </div>
    
    <div v-if="!audioBuffer && !isProcessing" class="p-2.5 bg-gray-700/50 border border-gray-600/30 ">
      <p class="text-xs text-gray-400">
        <span class="font-semibold">💡 提示:</span> 上传音频文件后将自动分析。播放控制请使用主控制面板的 "开始/暂停" 按钮。
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'

// 响应式数据
const audioFileInput = ref(null)
const waveformContainer = ref(null)
const waveformCanvas = ref(null)
const spectrumContainer = ref(null)
const spectrumCanvas = ref(null)
const timelineTrack = ref(null)

const selectedFile = ref(null)
const audioBuffer = ref(null)
const audioInfo = ref(null)
const isProcessing = ref(false)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const isAudioEnabled = ref(true)
const isExcitationMode = ref(false)
const currentAnalysis = ref(null)
const hoverTime = ref(null)

// Emit definitions
const emit = defineEmits(['frequency-change', 'audio-processed-successfully', 'audio-playback-ended']);

// 音频相关
let audioContext = null
let audioSource = null
let analyser = null
let gainNode = null
let startTime = 0
let pauseTime = 0
let onFrequencyChange = null
let frequencyHistory = []
let lastDominantFreq = 0

// 动画帧
let animationFrame = null
let waveformCtx = null
let spectrumCtx = null

// 计算属性
const progressPercentage = computed(() => {
  if (duration.value === 0) return 0
  return (currentTime.value / duration.value) * 100
})

const progressPixel = computed(() => {
  if (!waveformContainer.value || duration.value === 0) return 0;
  return (currentTime.value / duration.value) * waveformContainer.value.clientWidth;
});

// 生命周期
onMounted(async () => {
  await initAudioContext()
  initCanvas()
})

onUnmounted(() => {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
  }
  if (audioSource) {
    audioSource.disconnect()
  }
})

// 方法
async function initAudioContext() {
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)()
    
    // 创建分析器节点
    analyser = audioContext.createAnalyser()
    analyser.fftSize = 2048
    analyser.smoothingTimeConstant = 0.8
    
    // 创建增益节点
    gainNode = audioContext.createGain()
    gainNode.connect(audioContext.destination)
    
    // 设置初始音量状态
    gainNode.gain.setValueAtTime(isAudioEnabled.value ? 1.0 : 0.0, audioContext.currentTime)
    
    console.log('AudioContext initialized successfully')
  } catch (error) {
    console.error('Failed to initialize AudioContext:', error)
  }
}

function initCanvas() {
  if (waveformCanvas.value && waveformContainer.value) {
    waveformCtx = waveformCanvas.value.getContext('2d')
    waveformCanvas.value.width = waveformContainer.value.clientWidth > 0 ? waveformContainer.value.clientWidth : 300;
    waveformCanvas.value.height = waveformContainer.value.clientHeight > 0 ? waveformContainer.value.clientHeight : 100;
  }
  
  if (spectrumCanvas.value && spectrumContainer.value) {
    spectrumCtx = spectrumCanvas.value.getContext('2d')
    spectrumCanvas.value.width = spectrumContainer.value.clientWidth > 0 ? spectrumContainer.value.clientWidth : 300;
    spectrumCanvas.value.height = spectrumContainer.value.clientHeight > 0 ? spectrumContainer.value.clientHeight : 80;
  }
}

// 处理文件选择
async function handleFileChange(event) {
  const file = event.target.files[0]
  if (!file) return
  
  selectedFile.value = file
  audioInfo.value = {
    filename: file.name,
    size: file.size,
    type: file.type
  }
  
  console.log('📁 选择音频文件:', file.name)
  
  // 自动处理音频文件
  await processAudio()
}

async function processAudio() {
  if (!selectedFile.value) return
  
  isProcessing.value = true
  
  try {
    const arrayBuffer = await selectedFile.value.arrayBuffer()
    audioBuffer.value = await audioContext.decodeAudioData(arrayBuffer)
    
    // 更新音频信息
    audioInfo.value = {
      ...audioInfo.value,
      duration: audioBuffer.value.duration,
      sampleRate: audioBuffer.value.sampleRate,
      channels: audioBuffer.value.numberOfChannels
    }
    
    duration.value = audioBuffer.value.duration
    
    // 绘制完整波形
    drawWaveform()
    
    console.log('Audio processed successfully')
    emit('audio-processed-successfully'); // Emit event when audio is processed
  } catch (error) {
    console.error('Error processing audio:', error)
    alert('音频处理失败: ' + error.message)
  } finally {
    isProcessing.value = false
  }
}

async function togglePlayback() {
  if (!audioBuffer.value) return
  
  if (audioContext.state === 'suspended') {
    await audioContext.resume()
  }
  
  if (isPlaying.value) {
    pausePlayback()
  } else {
    startPlayback()
  }
}

function startPlayback() {
  if (!audioBuffer.value) return
  
  // 停止当前播放
  if (audioSource) {
    audioSource.disconnect()
  }
  
  // 重置频率分析状态
  frequencyHistory = []
  lastDominantFreq = 0
  
  // 创建新的音频源
  audioSource = audioContext.createBufferSource()
  audioSource.buffer = audioBuffer.value
  
  // 连接音频图
  audioSource.connect(analyser)
  analyser.connect(gainNode)
  
  // 设置结束回调
  audioSource.onended = () => {
    if (currentTime.value >= duration.value) {
      stopPlayback()
    }
  }
  
  // 开始播放
  const offset = pauseTime > 0 ? pauseTime : 0
  audioSource.start(0, offset)
  startTime = audioContext.currentTime - offset
  isPlaying.value = true
  
  // 开始动画循环
  updateProgress()
  
  console.log('Playback started')
}

function pausePlayback() {
  if (audioSource) {
    audioSource.stop()
    audioSource.disconnect()
    audioSource = null
  }
  
  pauseTime = currentTime.value
  isPlaying.value = false
  
  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
    animationFrame = null
  }
  
  console.log('Playback paused')
}

function stopPlayback() {
  if (audioSource) {
    audioSource.stop()
    audioSource.disconnect()
    audioSource = null
  }
  
  isPlaying.value = false
  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
    animationFrame = null
  }
  
  // 重新绘制完整波形
  drawWaveform()
  
  console.log('Playback stopped');

  // If playback stopped because audio naturally ended, currentTime will be at or beyond duration.
  // Reset pauseTime to 0 to signify it's not just paused but finished or fully stopped.
  if (currentTime.value >= duration.value) {
    pauseTime = 0;
    // currentTime.value = 0; // Option to reset playhead to start, or leave at end (duration.value)
  }
}

function updateProgress() {
  if (!isPlaying.value || !audioBuffer.value) return // Added audioBuffer check
  
  currentTime.value = audioContext.currentTime - startTime
  
  if (currentTime.value >= duration.value) {
    currentTime.value = duration.value; // Cap currentTime at duration
    stopPlayback();
    console.log('Audio naturally ended. Emitting audio-playback-ended.');
    emit('audio-playback-ended');
    return;
  }
  
  // 绘制滚动波形
  drawScrollingWaveform()
  
  // 绘制实时频谱
  drawSpectrum()
  
  // 如果在激励模式，分析并传递主导频率
  if (isExcitationMode.value && onFrequencyChange) {
    const analysis = getMusicalFrequencyAnalysis()
    if (analysis && analysis.confidence > 0.4) { // 只传递置信度较高的频率
      onFrequencyChange(analysis.frequency)
    }
    
    // 更新分析结果显示
    currentAnalysis.value = analysis
  }
  
  animationFrame = requestAnimationFrame(updateProgress)
}

function drawWaveform() {
  if (!waveformCtx || !audioBuffer.value || !waveformCanvas.value) return;
  
  const canvas = waveformCanvas.value
  const ctx = waveformCtx
  const width = canvas.width
  const height = canvas.height
  
  ctx.clearRect(0, 0, width, height)
  
  // 获取音频数据
  const channelData = audioBuffer.value.getChannelData(0)
  const samples = channelData.length
  const step = Math.ceil(samples / width)
  
  ctx.strokeStyle = '#3b82f6'
  ctx.lineWidth = 1
  ctx.beginPath()
  
  for (let i = 0; i < width; i++) {
    const sampleIndex = i * step
    const sample = channelData[sampleIndex] || 0
    const y = (sample + 1) * height / 2
    
    if (i === 0) {
      ctx.moveTo(i, y)
    } else {
      ctx.lineTo(i, y)
    }
  }
  
  ctx.stroke()
}

function drawScrollingWaveform() {
  if (!waveformCtx || !audioBuffer.value) return
  
  const canvas = waveformCanvas.value
  const ctx = waveformCtx
  const width = canvas.width
  const height = canvas.height
  
  ctx.clearRect(0, 0, width, height)
  
  // 计算当前显示的时间窗口（显示前后各2秒）
  const windowSize = 4 // 秒
  const startTime = Math.max(0, currentTime.value - windowSize / 2)
  const endTime = Math.min(duration.value, currentTime.value + windowSize / 2)
  
  const sampleRate = audioBuffer.value.sampleRate
  const channelData = audioBuffer.value.getChannelData(0)
  const startSample = Math.floor(startTime * sampleRate)
  const endSample = Math.floor(endTime * sampleRate)
  const totalSamples = endSample - startSample
  
  if (totalSamples <= 0) return
  
  const step = Math.ceil(totalSamples / width)
  
  // 绘制波形
  ctx.strokeStyle = '#3b82f6'
  ctx.lineWidth = 1
  ctx.beginPath()
  
  for (let i = 0; i < width; i++) {
    const sampleIndex = startSample + i * step
    if (sampleIndex >= channelData.length) break
    
    const sample = channelData[sampleIndex] || 0
    const y = (sample + 1) * height / 2
    
    if (i === 0) {
      ctx.moveTo(i, y)
    } else {
      ctx.lineTo(i, y)
    }
  }
  
  ctx.stroke()
  
  // 绘制当前播放位置线
  const currentPosition = ((currentTime.value - startTime) / (endTime - startTime)) * width
  ctx.strokeStyle = '#ef4444'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(currentPosition, 0)
  ctx.lineTo(currentPosition, height)
  ctx.stroke()
}

function drawSpectrum() {
  if (!spectrumCtx || !analyser) return
  
  const canvas = spectrumCanvas.value
  const ctx = spectrumCtx
  const width = canvas.width
  const height = canvas.height
  
  const bufferLength = analyser.frequencyBinCount
  const dataArray = new Uint8Array(bufferLength)
  analyser.getByteFrequencyData(dataArray)
  
  ctx.clearRect(0, 0, width, height)
  
  const barWidth = width / bufferLength
  let x = 0
  
  // 绘制频谱条
  for (let i = 0; i < bufferLength; i++) {
    const barHeight = (dataArray[i] / 255) * height
    
    // 颜色渐变
    const hue = (i / bufferLength) * 300
    ctx.fillStyle = `hsl(${hue}, 100%, 50%)`
    
    ctx.fillRect(x, height - barHeight, barWidth, barHeight)
    x += barWidth
  }
}

function seekTo(event) {
  if (!audioBuffer.value || !event.target) return;
  
  const canvas = event.target; // Assuming event.target is the waveformCanvas
  const rect = canvas.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  let percentage = clickX / rect.width;
  percentage = Math.max(0, Math.min(1, percentage)); // Clamp between 0 and 1

  const newTime = percentage * duration.value;
  
  currentTime.value = newTime;
  pauseTime = newTime; 
  
  if (isPlaying.value) {
    pausePlayback();
    startPlayback();
  } else {
    // If paused, update the static waveform to the new seek position
    drawWaveform(); 
  }
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function onWaveformHover(event) {
  // 可以添加鼠标悬停显示时间信息的功能
}

// 清除悬停时间显示
function clearHoverTime() {
  hoverTime.value = null
}

// 音频激励相关方法
function startAudioExcitation() {
  console.log('尝试开始音频激励模式...')
  console.log('audioBuffer.value:', !!audioBuffer.value)
  
  if (!audioBuffer.value) {
    console.warn('无音频缓冲区，无法开始激励')
    return false
  }
  
  isExcitationMode.value = true
  
  // 如果不在播放状态，开始播放
  if (!isPlaying.value) {
    console.log('开始播放音频...')
    startPlayback()
  } else {
    console.log('音频已在播放中')
  }
  
  console.log('🎵 开始音频激励模式')
  return true
}

function stopAudioExcitation() {
  isExcitationMode.value = false
  
  // 停止播放
  if (isPlaying.value) {
    stopPlayback()
  }
  
  console.log('⏹️ 停止音频激励模式')
}

function setAudioEnabled(enabled) {
  isAudioEnabled.value = enabled
  
  // 控制音频输出的静音状态
  if (gainNode) {
    if (enabled) {
      gainNode.gain.setValueAtTime(1.0, audioContext.currentTime) // 恢复音量
      console.log('恢复音频输出')
    } else {
      gainNode.gain.setValueAtTime(0.0, audioContext.currentTime) // 静音
      console.log('静音音频输出')
    }
  }
  
  console.log('🔊 音频输出', enabled ? '启用' : '静音')
}

// 获取当前音频的主要频率成分（用于振动分析）
function getAudioFrequencyData() {
  if (!analyser || !isPlaying.value) return null
  
  const bufferLength = analyser.frequencyBinCount
  const dataArray = new Uint8Array(bufferLength)
  analyser.getByteFrequencyData(dataArray)
  
  // 找到主要频率成分
  const sampleRate = audioContext.sampleRate
  const frequencies = []
  const threshold = 50 // 频率强度阈值
  
  for (let i = 0; i < bufferLength; i++) {
    if (dataArray[i] > threshold) {
      const frequency = (i * sampleRate) / (2 * bufferLength)
      frequencies.push({
        frequency: frequency,
        amplitude: dataArray[i] / 255.0
      })
    }
  }
  
  // 按幅度排序，返回前5个主要频率
  return frequencies
    .sort((a, b) => b.amplitude - a.amplitude)
    .slice(0, 5)
}

// 设置频率变化回调函数
function setFrequencyChangeCallback(callback) {
  onFrequencyChange = callback
}

// 改进的频率分析算法
function getMusicalFrequencyAnalysis() {
  if (!analyser || !isPlaying.value) return null
  
  const bufferLength = analyser.frequencyBinCount
  const dataArray = new Uint8Array(bufferLength)
  analyser.getByteFrequencyData(dataArray)
  
  const sampleRate = audioContext.sampleRate
  const freqResolution = sampleRate / (2 * bufferLength)
  
  // 1. 找到所有显著的频率峰值
  const peaks = findFrequencyPeaks(dataArray, freqResolution)
  
  // 2. 过滤掉低频噪声和高频噪声
  const filteredPeaks = peaks.filter(peak => 
    peak.frequency >= 60 && peak.frequency <= 4000 && peak.amplitude > 0.1
  )
  
  if (filteredPeaks.length === 0) return null
  
  // 4. 始终使用能量最强的过滤后峰值作为主导频率的候选
  const dominantFreq = filteredPeaks[0].frequency;
  let confidenceScore = filteredPeaks[0].amplitude; // 将最强峰值的幅度作为基础置信度

  // 3. 尝试识别基频，主要用于调整置信度，而不是覆盖最强峰值
  const fundamentalFreqAttempt = findFundamentalFrequency(filteredPeaks);
  if (fundamentalFreqAttempt) {
      // 如果基频识别与最强峰值接近，或提供了一个合理的基频解释，则可以提高置信度
      if (Math.abs(dominantFreq - fundamentalFreqAttempt) < dominantFreq * 0.05) { // 如果基频与最强峰值非常接近
        confidenceScore = Math.max(confidenceScore, 0.75); // 较高的置信度
      } else {
         // 如果找到的基频与最强峰值不同，说明声音可能较复杂，或者基频不明确
         // 仍然可以认为找到一个潜在的基频是有价值的，所以略微提高置信度
         confidenceScore = Math.max(confidenceScore, 0.6);
      }
      // 注意：我们不再用 fundamentalFreqAttempt 直接覆盖 dominantFreq
  }
  
  // 5. 应用时间平滑。如果初始候选峰值多于一个，允许更剧烈的跳动。
  const smoothedFreq = applyFrequencySmoothing(dominantFreq, filteredPeaks.length > 1);
  
  return {
    frequency: smoothedFreq,
    confidence: confidenceScore, // 置信度现在更多地反映了最强峰值的清晰度以及是否有基频支持
    peaks: filteredPeaks.slice(0, 10) // 返回前10个主要峰值供参考或显示
  }
}

// 寻找频率峰值
function findFrequencyPeaks(dataArray, freqResolution) {
  const peaks = []
  const threshold = 20 // 最小幅度阈值
  
  for (let i = 2; i < dataArray.length - 2; i++) {
    const amplitude = dataArray[i]
    
    // 局部最大值检测
    if (amplitude > threshold &&
        amplitude > dataArray[i-1] && 
        amplitude > dataArray[i+1] &&
        amplitude > dataArray[i-2] && 
        amplitude > dataArray[i+2]) {
      
      const frequency = i * freqResolution
      peaks.push({
        frequency: frequency,
        amplitude: amplitude / 255.0,
        bin: i
      })
    }
  }
  
  // 按幅度排序
  return peaks.sort((a, b) => b.amplitude - a.amplitude)
}

// 识别基频（考虑谐波关系）
function findFundamentalFrequency(peaks) {
  if (peaks.length < 2) return null
  
  // 尝试每个峰值作为基频
  for (let i = 0; i < Math.min(peaks.length, 5); i++) {
    const candidateFreq = peaks[i].frequency
    
    // 检查是否有谐波支持
    let harmonicSupport = 0
    let totalHarmonicStrength = 0
    
    for (let harmonic = 2; harmonic <= 6; harmonic++) {
      const harmonicFreq = candidateFreq * harmonic
      const tolerance = candidateFreq * 0.05 // 5% 容差
      
      // 寻找接近谐波频率的峰值
      const nearbyPeak = peaks.find(peak => 
        Math.abs(peak.frequency - harmonicFreq) < tolerance
      )
      
      if (nearbyPeak) {
        harmonicSupport++
        totalHarmonicStrength += nearbyPeak.amplitude
      }
    }
    
    // 如果有足够的谐波支持，认为是基频
    if (harmonicSupport >= 2 && candidateFreq >= 80 && candidateFreq <= 2000) {
      return candidateFreq
    }
  }
  
  // 如果没有找到明显的基频，返回最强的低频成分
  const lowFreqPeak = peaks.find(peak => peak.frequency >= 80 && peak.frequency <= 800)
  return lowFreqPeak ? lowFreqPeak.frequency : null
}

// 频率平滑处理
function applyFrequencySmoothing(newFreq, allowJumps = false) {
  const maxHistoryLength = 5
  
  // 添加到历史记录
  frequencyHistory.push(newFreq)
  if (frequencyHistory.length > maxHistoryLength) {
    frequencyHistory.shift()
  }

  // If jumps are allowed (e.g., multiple significant peaks detected),
  // return the new frequency more directly to allow for more drastic changes.
  if (allowJumps) {
    lastDominantFreq = newFreq;
    return newFreq; // Return new frequency with minimal or no smoothing
  }
  
  // 如果频率变化太剧烈，进行平滑 (original smoothing logic)
  if (lastDominantFreq > 0) {
    const freqChange = Math.abs(newFreq - lastDominantFreq) / lastDominantFreq
    
    if (freqChange > 0.3) { // 如果变化超过30%
      // 使用加权平均平滑
      const weights = [0.4, 0.3, 0.2, 0.1] // 新的权重更大
      let weightedSum = 0
      let totalWeight = 0
      
      for (let i = 0; i < Math.min(frequencyHistory.length, weights.length); i++) {
        const idx = frequencyHistory.length - 1 - i
        weightedSum += frequencyHistory[idx] * weights[i]
        totalWeight += weights[i]
      }
      
      if (totalWeight > 0) {
        newFreq = weightedSum / totalWeight;
      } else if (frequencyHistory.length > 0) {
        newFreq = frequencyHistory[frequencyHistory.length -1]; // Fallback to the most recent
      }
      // else newFreq remains unchanged if history is empty and totalWeight is 0
    }
  }
  
  lastDominantFreq = newFreq
  return newFreq
}

// 获取当前音频的主导频率（改进版）
function getDominantFrequency() {
  const analysis = getMusicalFrequencyAnalysis()
  return analysis ? {
    frequency: analysis.frequency,
    amplitude: analysis.peaks[0]?.amplitude || 0,
    confidence: analysis.confidence
  } : null
}

// 监听窗口大小变化
watch([waveformContainer, spectrumContainer], async () => {
  await nextTick();
  initCanvas();
  if (audioBuffer.value) {
    await nextTick();
    drawWaveform(); 
  }
}, { flush: 'post' });

// 获取详细的音频分析信息（用于调试）
function getDetailedAudioAnalysis() {
  const analysis = getMusicalFrequencyAnalysis()
  if (!analysis) return null
  
  return {
    dominantFrequency: analysis.frequency,
    confidence: analysis.confidence,
    peaks: analysis.peaks,
    frequencyHistory: [...frequencyHistory],
    analysisTime: new Date().toISOString()
  }
}

// 手动重置频率分析状态
function resetFrequencyAnalysis() {
  frequencyHistory = []
  lastDominantFreq = 0
  console.log('频率分析状态已重置')
}

// 检查是否有可用的音频文件
function hasAudioFile() {
  return !!(audioBuffer.value && selectedFile.value)
}

// New seek function for the dedicated timeline bar
function seekOnTimelineClick(event) {
  if (!audioBuffer.value || !timelineTrack.value) return;

  const rect = timelineTrack.value.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  let percentage = clickX / rect.width;
  percentage = Math.max(0, Math.min(1, percentage)); // Clamp between 0 and 1

  const newTime = percentage * duration.value;
  
  currentTime.value = newTime;
  pauseTime = newTime; 
  
  if (isPlaying.value) {
    pausePlayback();
    startPlayback();
  } else {
    // If paused, update the static waveform to the new seek position
    drawWaveform(); 
  }
}

// 暴露方法供父组件调用
defineExpose({
  startAudioExcitation,
  stopAudioExcitation,
  setAudioEnabled,
  getAudioFrequencyData,
  setFrequencyChangeCallback,
  getDominantFrequency,
  getDetailedAudioAnalysis,
  resetFrequencyAnalysis,
  hasAudioFile
})
</script>

<style scoped>
/* Minimal additional styles, Tailwind should cover most */
.text-2xs {
  font-size: 0.625rem; /* 10px */
  line-height: 0.875rem; /* 14px */
}
</style> 