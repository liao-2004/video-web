import axios from 'axios'
import { useUserStore } from '@/stores'
import { ElMessage } from 'element-plus'
import router from '@/router'
export const baseURL = 'http://120.27.201.60:3007'

const instance = axios.create({
  baseURL,
  timeout: 10000
})

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    const useStore = useUserStore()
    if (useStore.token) {
      config.headers.Authorization = useStore.token
    }
    return config
  },
  (err) => Promise.reject(err)
)

instance.interceptors.response.use(
  (res) => {
    if (res.data.code === 0) {
      return res
    }
    if (res.data.status === 0) {
      return res
    }
    ElMessage.error(res.data.message || '服务异常')
    return Promise.reject(res.data)
  },
  (err) => {
    if (err.response?.status === 401) {
      router.push('/login')
    }

    ElMessage.error(err.response.data.message || '服务异常')
    return Promise.reject(err)
  }
)
export default instance
