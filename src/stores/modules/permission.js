import { defineStore } from 'pinia'
import { ref } from 'vue'
import { menuGetUserTreeService } from '@/api/system'
import { useUserStore } from '@/stores'

// 前端组件路径映射：后端返回的 component 字符串 -> 实际组件
const componentMap = {
  'video/userVideo': () => import('@/views/video/userVideo.vue'),
  'video/VideoManage': () => import('@/views/video/VideoManage.vue'),
  'video/VideoChannel': () => import('@/views/video/VideoChannel.vue'),
  'video/VideoWatch': () => import('@/views/video/VideoWatch.vue'),
  'user/UserProfile': () => import('@/views/user/UserProfile.vue'),
  'user/UserAvatar': () => import('@/views/user/UserAvatar.vue'),
  'user/UserPassword': () => import('@/views/user/UserPassword.vue'),
  'system/RoleManage': () => import('@/views/system/RoleManage.vue'),
  'system/MenuManage': () => import('@/views/system/MenuManage.vue')
}

export const usePermissionStore = defineStore(
  'bilibili-permission',
  () => {
    // 后端返回的菜单树（原始数据）
    const menuTree = ref([])
    // 生成的动态路由（已转换为 Vue Router 格式）
    const dynamicRoutes = ref([])
    // 路由是否已生成
    const routesGenerated = ref(false)

    // 从后端获取当前用户的菜单树
    const generateRoutes = async () => {
      const res = await menuGetUserTreeService()
      menuTree.value = res.data.data || []
      // 将菜单树转换为路由配置
      const routes = convertMenuToRoutes(menuTree.value)
      dynamicRoutes.value = routes
      routesGenerated.value = true
      return routes
    }

    // 重置权限（退出登录时调用）
    const resetPermission = () => {
      menuTree.value = []
      dynamicRoutes.value = []
      routesGenerated.value = false
    }

    // 将后端菜单树转换为 Vue Router 路由配置
    function convertMenuToRoutes(menus) {
      const routes = []
      menus.forEach((menu) => {
        // 只处理菜单类型（C）和目录类型（M），按钮类型（F）不生成路由
        if (menu.menu_type === 'F') return

        const route = {
          path: menu.path,
          name: menu.menu_name,
          meta: {
            title: menu.menu_name,
            icon: menu.icon,
            id: menu.id,
            parentId: menu.parent_id
          }
        }

        // 目录类型（M）：有子菜单，作为嵌套路由
        if (menu.menu_type === 'M' && menu.children && menu.children.length > 0) {
          route.children = convertMenuToRoutes(menu.children)
        }

        // 菜单类型（C）：有 component，加载实际组件
        if (menu.menu_type === 'C' && menu.component) {
          const componentFn = componentMap[menu.component]
          if (componentFn) {
            route.component = componentFn
          } else {
            console.warn(`未找到组件映射: ${menu.component}`)
            return // 跳过未映射的路由
          }
        }

        routes.push(route)
      })
      return routes
    }

    // 判断是否有某个权限标识
    const hasPermi = (perms) => {
      const userStore = useUserStore()
      const permissions = userStore.user?.permissions || []
      if (permissions.includes('*')) return true
      if (Array.isArray(perms)) {
        return perms.some((p) => permissions.includes(p))
      }
      return permissions.includes(perms)
    }

    return {
      menuTree,
      dynamicRoutes,
      routesGenerated,
      generateRoutes,
      resetPermission,
      hasPermi
    }
  },
  {
    // 注意：dynamicRoutes 包含组件函数，不可序列化，不持久化
    // 每次刷新后由路由守卫重新调用 generateRoutes 生成
    persist: {
      paths: ['menuTree']
    }
  }
)
