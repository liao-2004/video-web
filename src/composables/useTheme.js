import { ref, watch } from 'vue'

// 主题：亮色(light) / 暗色(dark)，持久化到 localStorage
const KEY = 'bili-theme'
const saved = localStorage.getItem(KEY)
// 未设置过则跟随系统偏好
const prefersDark =
  saved === null && window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false

const isDark = ref(saved ? saved === 'dark' : prefersDark)

const apply = (dark) => {
  document.documentElement.classList.toggle('dark', dark)
}
// 模块加载时立即应用，避免首屏闪烁
apply(isDark.value)

watch(isDark, (v) => {
  apply(v)
  localStorage.setItem(KEY, v ? 'dark' : 'light')
})

export function useTheme() {
  const toggle = () => {
    isDark.value = !isDark.value
  }
  return { isDark, toggle }
}
