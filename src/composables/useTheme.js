import { ref, watch } from 'vue'
// 背景配置
const KEY = 'bili-theme'
const saved = localStorage.getItem(KEY)
const prefersDark =
  saved === null && window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false

const isDark = ref(saved ? saved === 'dark' : prefersDark)

const apply = (dark) => {
  document.documentElement.classList.toggle('dark', dark)
}
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
