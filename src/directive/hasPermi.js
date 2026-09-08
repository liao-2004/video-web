// 按钮级权限指令 v-hasPermi
// 用法：v-hasPermi="['video:add']" 或 v-hasPermi="'video:add'"
import { usePermissionStore } from '@/stores'

export default {
  mounted(el, binding) {
    checkPermission(el, binding)
  },
  updated(el, binding) {
    checkPermission(el, binding)
  }
}

function checkPermission(el, binding) {
  const { value } = binding
  if (!value) return

  const permissionStore = usePermissionStore()
  const hasPermission = permissionStore.hasPermi(value)

  if (!hasPermission) {
    // 没有权限，移除元素
    if (el.parentNode) {
      el.parentNode.removeChild(el)
    } else {
      el.style.display = 'none'
    }
  }
}
