<script setup>
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
// 按需引入用到的图标
import { User, Crop, EditPen, SwitchButton, CaretBottom } from '@element-plus/icons-vue'
import avatar from '@/assets/default.png'
import { useUserStore } from '@/stores'

const userStore = useUserStore()
const router = useRouter()

const handleCommand = async (key) => {
  if (key === 'logout') {
      userStore.removeToken()
      userStore.setUser({})
      router.push('/login')
  } else if (key === 'password' || key === 'avatar') {
    // 跳 /update/avatar、/update/password 独立路由，跳出布局
    router.push(`/update/${key}`)
  } else {
    router.push(`/user/${key}`)
  }
}
</script>

<template>
  <div class="header">
    <div class="background-img"></div>
    <div class="avatar">
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
  </div>
  <router-view></router-view>
</template>

<style lang="scss" scoped>
.header {
  width: 100vw;
  display: flex;
  justify-content: left;
  align-content: center;
  /* 修正类名拼写background，删掉多余嵌套.header */
  .background-img {
    background: url('@/assets/logo2.png') no-repeat center / 80px;
    height: 60px;
    width: 140px;
  }
  .avatar{
    margin-top: 14px;
    margin-left: auto;
    margin-right: 20px;
  }
  .el-dropdown__box {
    display: flex;
    align-items: center;
    cursor: pointer;
  }
}
.el-dropdown__box {
      display: flex;
      align-items: center;
      .el-icon {
        color: #999;
        margin-left: 10px;
      }

      &:active,
      &:focus {
        outline: none;
      }
    }
</style>