import './assets/main.css'
import './style.css'

import { createApp } from 'vue'
import App from './App.vue'

// 等待外部库加载完成
const waitForLibraries = () => {
  return new Promise((resolve) => {
    const checkLibraries = () => {
      if (typeof THREE !== 'undefined' && typeof Plotly !== 'undefined') {
        console.log('✓ 外部库已加载完成，启动Vue应用')
        resolve()
      } else {
        console.log('等待外部库加载...')
        setTimeout(checkLibraries, 100)
      }
    }
    checkLibraries()
  })
}

// 启动应用
async function startApp() {
  try {
    await waitForLibraries()
    createApp(App).mount('#app')
    console.log('✓ Vue应用启动成功')
  } catch (error) {
    console.error('应用启动失败:', error)
    document.body.innerHTML = '<div style="color: red; text-align: center; margin-top: 50px;">应用启动失败，请刷新页面重试</div>'
  }
}

startApp()
