import { defineStore } from 'pinia'
import { ref } from 'vue'
import { menuGetUserTreeService } from '@/api/system'
import { useUserStore } from '@/stores'

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
    const menuTree = ref([])
    const dynamicRoutes = ref([])
    const routesGenerated = ref(false)

    const generateRoutes = async () => {
      const res = await menuGetUserTreeService()
      menuTree.value = res.data.data || []
      const routes = convertMenuToRoutes(menuTree.value)
      dynamicRoutes.value = routes
      routesGenerated.value = true
      return routes
    }

    const resetPermission = () => {
      menuTree.value = []
      dynamicRoutes.value = []
      routesGenerated.value = false
    }

    function convertMenuToRoutes(menus) {
      const routes = []
      menus.forEach((menu) => {
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

        if (menu.menu_type === 'M' && menu.children && menu.children.length > 0) {
          route.children = convertMenuToRoutes(menu.children)
        }

        if (menu.menu_type === 'C' && menu.component) {
          const componentFn = componentMap[menu.component]
          if (componentFn) {
            route.component = componentFn
          } else {
            console.warn(`未找到组件映射: ${menu.component}`)
          }
        }

        routes.push(route)
      })
      return routes
    }

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
    persist: {
      paths: ['menuTree']
    }
  }
)
