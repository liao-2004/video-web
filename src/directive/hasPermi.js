//获取权限
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
    if (el.parentNode) {
      el.parentNode.removeChild(el)
    } else {
      el.style.display = 'none'
    }
  }
}
