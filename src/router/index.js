import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores'
import { usePermissionStore } from '@/stores'

// ==================== 静态路由（不需要权限） ====================
const constantRoutes = [
  {
    path: '/login',
    component: () => import('@/views/login/LoginPage.vue')
  },
  {
    path: '/:pathMatch(.*)*',
    component: () => import('@/views/login/LoginPage.vue')
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: constantRoutes
})

// ==================== 路由守卫 ====================
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  const permissionStore = usePermissionStore()

  // 有 token
  if (userStore.token) {
    // 已登录还去登录页，重定向到首页
    if (to.path === '/login') {
      return next('/')
    }

    // 检查是否已获取用户信息（含权限列表）
    // 注意：旧版用户信息没有 permissions 字段，需要重新获取
    if (!userStore.user.id || !userStore.user.permissions) {
      try {
        await userStore.getUser()
      } catch (err) {
        // 获取用户信息失败，清除 token 重新登录
        userStore.removeToken()
        userStore.setUser({})
        return next('/login')
      }
    }

    // 检查是否已生成动态路由
    if (!permissionStore.routesGenerated) {
      try {
        const dynamicRoutes = await permissionStore.generateRoutes()
        // 动态添加布局路由（所有菜单都在 LayoutContainer 下）
        router.addRoute({
          path: '/',
          component: () => import('@/views/layout/LayoutContainer.vue'),
          redirect: dynamicRoutes.length > 0 ? dynamicRoutes[0].path : '/',
          children: [
            ...dynamicRoutes,
            // 视频观看页（不在菜单中，但需要登录）
            {
              path: '/video/watch/:id',
              component: () => import('@/views/video/VideoWatch.vue'),
              meta: { title: '视频观看', hidden: true }
            }
          ]
        })
        // 重定向到当前路径，确保动态路由生效
        return next({ ...to, replace: true })
      } catch (err) {
        console.error('生成动态路由失败:', err)
        return next('/login')
      }
    }

    // 已生成路由，直接放行
    return next()
  }

  // 无 token，去登录页放行
  if (to.path === '/login') {
    return next()
  }

  // 无 token，去其他页重定向到登录页
  return next('/login')
})

// 退出登录时重置路由
export function resetRouter() {
  const permissionStore = usePermissionStore()
  permissionStore.resetPermission()
  // 移除所有动态路由（重新创建 router 是最简单的方式）
  // 这里通过替换 matcher 实现
  const newRouter = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: constantRoutes
  })
  router.matcher = newRouter.matcher
}

export default router
