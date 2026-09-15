import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores'
import { usePermissionStore } from '@/stores'

//不需要权限 
const constantRoutes = [
  {
    path: '/login',
    component: () => import('@/views/login/LoginPage.vue')
  },{
    path: '/:pathMatch(.*)*',
    component: () => import('@/views/login/LoginPage.vue')
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: constantRoutes
})


router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  const permissionStore = usePermissionStore()

  if (userStore.token) {
    if (to.path === '/login') {
      return next('/')
    }

    if (!userStore.user.id || !userStore.user.permissions) {
      try {
        await userStore.getUser()
      } catch (err) {
        userStore.removeToken()
        userStore.setUser({})
        return next('/login')
      }
    }

    if (!permissionStore.routesGenerated) {
      try {
        const dynamicRoutes = await permissionStore.generateRoutes()
        router.addRoute({
          path: '/',
          component: () => import('@/views/layout/LayoutContainer.vue'),
          redirect: dynamicRoutes.length > 0 ? dynamicRoutes[0].path : '/',
          children: [
            ...dynamicRoutes,
            {
              path: '/video/watch/:id',
              component: () => import('@/views/video/VideoWatch.vue'),
              meta: { title: '视频观看', hidden: true }
            }
          ]
        })
        return next({ ...to, replace: true })
      } catch (err) {
        const useStore = useUserStore()
        userStore.removeToken()
        userStore.setUser({})
        permissionStore.resetPermission()
        console.error('生成动态路由失败:',useStore.token, err)
        return next('/login')
      }
    }

    return next()
  }

  if (to.path === '/login') {
    return next()
  }

  // 无 token，重定向到登录页
  return next('/login')
})

export function resetRouter() {
  const permissionStore = usePermissionStore()
  permissionStore.resetPermission()
  const newRouter = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: constantRoutes
  })
  router.matcher = newRouter.matcher
}

export default router
