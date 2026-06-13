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
  Sunny
} from '@element-plus/icons-vue'
import avatar from '@/assets/default.png'
import { useUserStore } from '@/stores'
import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from '@/composables/useTheme'
const userStore = useUserStore()
const router = useRouter()
const { isDark } = useTheme()
// 菜单文字色随主题变化
const menuTextColor = computed(() => (isDark.value ? '#cfd3dc' : '#1f2329'))

onMounted(() => {
  userStore.getUser()
})

const handleCommand = async (key) => {
  if (key === 'logout') {
    // 直接退出：清除本地的数据 (token + user信息)
    userStore.removeToken()
    userStore.setUser({})
    router.push('/login')
  } else if(key=='password'||key=='avatar'){
    router.push(`/update/${key}`)
  }else {
    // 跳转操作
    router.push(`/user/${key}`)
  }
}
</script>

<template>
  <!-- 
    el-menu 整个菜单组件
      :default-active="$route.path"  配置默认高亮的菜单项
      router  router选项开启，el-menu-item 的 index 就是点击跳转的路径

    el-menu-item 菜单项
      index="/article/channel" 配置的是访问的跳转路径，配合default-active的值，实现高亮
  -->
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
        <el-menu-item index="/video/userVideo">
          <el-icon><HomeFilled /></el-icon>
          <span>视频中心</span>
        </el-menu-item>
        <el-menu-item v-if="userStore.user.role==1" index="/video/channel">
          <el-icon><Management /></el-icon>
          <span>视频分类</span>
        </el-menu-item>
        <el-menu-item index="/video/manage">
          <el-icon><Promotion /></el-icon>
          <span>视频管理</span>
        </el-menu-item>

        <el-sub-menu index="/user">
          <!-- 多级菜单的标题 - 具名插槽 title -->
          <template #title>
            <el-icon><UserFilled /></el-icon>
            <span>个人中心</span>
          </template>

          <!-- 展开的内容 - 默认插槽 -->
          <el-menu-item index="/user/profile">
            <el-icon><User /></el-icon>
            <span>基本资料</span>
          </el-menu-item>
          <el-menu-item index="/update/avatar">
            <el-icon><Crop /></el-icon>
            <span>更换头像</span>
          </el-menu-item>
          <el-menu-item index="/update/password">
            <el-icon><EditPen /></el-icon>
            <span>重置密码</span>
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header>
        <div>
          {{userStore.user.role==1?'管理员':'用户'}}：<strong>{{
            userStore.user.nickname || userStore.user.username
          }}</strong>
        </div>
        <div class="header-right">
          <!-- 主题切换：亮色 / 黑夜 -->
          <el-switch
            v-model="isDark"
            :active-action-icon="Moon"
            :inactive-action-icon="Sunny"
            inline-prompt
            style="--el-switch-on-color: #2c2e36; --el-switch-off-color: #fb7299"
          />
          <el-dropdown placement="bottom-end" @command="handleCommand">
          <!-- 展示给用户，默认看到的 -->
          <span class="el-dropdown__box">
            <el-avatar :src="userStore.user.user_pic || avatar" />
            <el-icon><CaretBottom /></el-icon>
          </span>

          <!-- 折叠的下拉部分 -->
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile" :icon="User"
                >基本资料</el-dropdown-item
              >
              <el-dropdown-item command="avatar" :icon="Crop"
                >更换头像</el-dropdown-item
              >
              <el-dropdown-item command="password" :icon="EditPen"
                >重置密码</el-dropdown-item
              >
              <el-dropdown-item command="logout" :icon="SwitchButton"
                >退出登录</el-dropdown-item
              >
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
