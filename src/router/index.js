import { createRouter,createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      component: ()=>import('@/views/login/LoginPage.vue') ,
    },{
      path: '/',
      component: () => import('@/views/layout/LayoutContainer.vue'),
      redirect: '/video/userVideo',
      children:[
        {
          path:'/video/userVideo',
          component:()=>import('@/views/video/userVideo.vue')
        },
        {
          path:'/video/manage',
          component:()=>import('@/views/video/VideoManage.vue')
        },
        {
          path:'/video/channel',
          component:()=>import('@/views/video/VideoChannel.vue')
        },
        {
          path: '/user/profile',
          component: () => import('@/views/user/UserProfile.vue')
        }
      ]
    },
      {
        path:'/update',
        component:()=>import('@/views/video/user_p_a.vue'),
        children:[
          {
            path: '/update/avatar',
            component: () => import('@/views/user/UserAvatar.vue')
          },{
            path: '/update/password',
            component: () => import('@/views/user/UserPassword.vue')
          }
        ]
      }
  ],
})

router.beforeEach((to) => {
  // 如果没有token, 且访问的是非登录页，拦截到登录，其他情况正常放行
  const useStore = useUserStore()
  if (!useStore.token && to.path !== '/login') return '/login'
})

export default router