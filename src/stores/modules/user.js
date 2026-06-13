import { defineStore } from 'pinia'
import { ref } from 'vue'
import { userGetInfoService } from '../../api/user'
import {baseURL} from '@/utils/request'
// 用户模块 token setToken removeToken
export const useUserStore = defineStore(
  'bilibili-user',
  () => {
    const token = ref('')
    const setToken = (newToken) => {
      token.value = newToken
    }
    const removeToken = () => {
      token.value = ''
    }

    const user = ref({})
    const getUser = async () => {
      const res = await userGetInfoService() // 请求获取数据
      user.value = res.data.data
      user.value.user_pic=baseURL+'/'+user.value.user_pic
    }
    const setUser = (obj) => {
      user.value = obj
    }

    return {
      token,
      setToken,
      removeToken,
      user,
      getUser,
      setUser
    }
  },
  {
    persist: true
  }
)
