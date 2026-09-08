import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import pinia from '@/stores/index'
import 'element-plus/theme-chalk/dark/css-vars.css'
import '@/assets/main.scss'
import '@/composables/useTheme'
import hasPermi from '@/directive/hasPermi'

const app = createApp(App)
app.use(pinia)
app.use(router)
app.directive('hasPermi', hasPermi)
app.mount('#app')
