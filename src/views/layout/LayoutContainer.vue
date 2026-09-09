<template>
  <el-container class="layout-container">
    <el-aside width="200px">
      <div class="el-aside__logo"></div>
      <el-menu
        active-text-color="rgb(251, 114, 153)"
        :default-active="$route.path"
        :text-color="menuTextColor"
        :background-color="'transparent'"
        router
      >
      
        <template v-for="route in menuList" :key="route.path">
          <el-sub-menu v-if="hasChildren(route)" :index="route.path">
            <template #title>
              <el-icon><component :is="getIcon(route.meta?.icon)" /></el-icon>
              <span>{{ route.meta?.title }}</span>
            </template>
            <el-menu-item
              v-for="child in route.children"
              :key="child.path"
              :index="child.path"
            >
              <el-icon><component :is="getIcon(child.meta?.icon)" /></el-icon>
              <span>{{ child.meta?.title }}</span>
            </el-menu-item>
          </el-sub-menu>

          <!-- 无子菜单渲染 -->
          <el-menu-item v-else :index="route.path">
            <el-icon><component :is="getIcon(route.meta?.icon)" /></el-icon>
            <span>{{ route.meta?.title }}</span>
          </el-menu-item>
        </template>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header>
        <div>
          {{ userStore.user.role?.id === 1 ? '管理员' : '用户' }}：<strong>{{
            userStore.user.nickname || userStore.user.username
          }}</strong>
        </div>
        <div class="header-right">
          <!-- 主题 -->
          <el-switch
            v-model="isDark"
            :active-action-icon="Moon"
            :inactive-action-icon="Sunny"
            inline-prompt
            style="--el-switch-on-color: #2c2e36; --el-switch-off-color: #fb7299"
          />
          <el-dropdown placement="bottom-end" @command="handleCommand">
            <span class="el-dropdown__box">
              <el-avatar :src="userStore.user.user_pic || avatar" />
              <el-icon><CaretBottom /></el-icon>
            </span>

            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile" :icon="User">基本资料</el-dropdown-item>
                <el-dropdown-item command="avatar" :icon="Crop">更换头像</el-dropdown-item>
                <el-dropdown-item command="password" :icon="EditPen">重置密码</el-dropdown-item>
                <el-dropdown-item command="logout" :icon="SwitchButton">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main>
        <div class="body">
           <router-view></router-view>
        </div>
      </el-main>
      <el-footer>C端bili视频管理模拟网站 ©2026 </el-footer>
    </el-container>
  </el-container>
</template>
<script setup>
import {
  Management,
  Promotion,
  UserFilled,
  User,
  HomeFilled,
  Crop,
  EditPen,
  SwitchButton,
  CaretBottom,
  Moon,
  Sunny,
  Upload,
  Setting,
  Menu as MenuIcon
} from '@element-plus/icons-vue'
import avatar from '@/assets/default.png'
import { useUserStore, usePermissionStore } from '@/stores'
import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from '@/composables/useTheme'
import { resetRouter } from '@/router'

const userStore = useUserStore()
const permissionStore = usePermissionStore()
const router = useRouter()
const { isDark } = useTheme()

// 菜单文字色随主题变化
const menuTextColor = computed(() => (isDark.value ? '#cfd3dc' : '#1f2329'))

// 图标名称到组件的映射
const iconMap = {
  HomeFilled,
  Management,
  Promotion,
  Upload,
  Setting,
  UserFilled,
  User,
  Crop,
  EditPen,
  MenuIcon
}

// 从动态路由获取菜单列表
const menuList = computed(() => {
  return permissionStore.dynamicRoutes || []
})

// 判断是否有子菜单（目录类型）
const hasChildren = (route) => {
  return route.children && route.children.length > 0
}

// 获取图标组件
const getIcon = (iconName) => {
  return iconMap[iconName] || HomeFilled
}

onMounted(() => {
  userStore.getUser()
})

const handleCommand = async (key) => {
  if (key === 'logout') {
    // 退出登录：清除 token、用户信息、权限，重置路由
    userStore.removeToken()
    userStore.setUser({})
    permissionStore.resetPermission()
    resetRouter()
    router.push('/login')
  } else if (key === 'password' || key === 'avatar') {
    router.push(`/update/${key}`)
  } else {
    router.push(`/user/${key}`)
  }
}
</script>


<style lang="scss" scoped>
.layout-container {
  height: 100vh;
  .el-aside {
    background-color: var(--app-surface);
    border: 1px var(--app-border) solid;
    &__logo {
      height: 120px;
      background: url('@/assets/logo2.png') no-repeat center / 160px auto;
    }
    .el-menu {
      border-right: none;
      background-color: transparent;
    }
  }
  .el-header {
    background-color: var(--app-surface);
    border-bottom: 1px solid var(--app-border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    .header-right {
      display: flex;
      align-items: center;
      gap: 18px;
    }
    .el-dropdown__box {
      display: flex;
      align-items: center;
      .el-icon {
        color: var(--app-text-mute);
        margin-left: 10px;
      }

      &:active,
      &:focus {
        outline: none;
      }
    }
  }
  .el-main {
    background-color: var(--app-bg);
  }
  .el-footer {
    background-color: var(--app-surface);
    border-top: 1px solid var(--app-border);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    color: var(--app-text-sub);
  }
}
</style>
