<script setup>
import { userRegisterService, userLoginService } from '@/api/user.js'
import { User, Lock } from '@element-plus/icons-vue'
import { ref, watch } from 'vue'
import { useUserStore } from '@/stores'
import { useRouter } from 'vue-router'
const isRegister = ref(false)
const form = ref()

// 整个的用于提交的form数据对象
const formModel = ref({
  username: '',
  password: '',
  repassword: ''
})
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 5, max: 10, message: '用户名必须是 5-10位 的字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    {
      pattern: /^\S{6,15}$/,
      message: '密码必须是 6-15位 的非空字符',
      trigger: 'blur'
    }
  ],
  repassword: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    {
      pattern: /^\S{6,15}$/,
      message: '密码必须是 6-15位 的非空字符',
      trigger: 'blur'
    },
    {
      validator: (rule, value, callback) => {
        if (value !== formModel.value.password) {
          callback(new Error('两次输入密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const register = async () => {
  await form.value.validate()
  await userRegisterService(formModel.value)
  ElMessage.success('注册成功')
  isRegister.value = false
}

const userStore = useUserStore()
const router = useRouter()
const login = async () => {
  await form.value.validate()
  const res = await userLoginService(formModel.value)
  userStore.setToken(res.data.token)
  ElMessage.success('登录成功')
  router.push('/')
}

// 切换的时候，重置表单内容
watch(isRegister, () => {
  formModel.value = {
    username: '',
    password: '',
    repassword: ''
  }
})
</script>

<template>
  <!-- 登录 / 注册：左侧品牌展示，右侧表单（校验规则见 rules） -->
  <div class="login-page">
    <div class="login-card">
      <!-- 左侧品牌展示 -->
      <div class="brand-panel">
        <div class="brand-inner">
          <div class="illo"></div>
          <h2>欢迎来到视频管理平台</h2>
        </div>
      </div>

      <!-- 右侧表单 -->
      <div class="form-panel">
      <!-- 注册相关表单 -->
      <el-form
        :model="formModel"
        :rules="rules"
        ref="form"
        size="large"
        autocomplete="off"
        v-if="isRegister"
      >
        <el-form-item>
          <h1>注册</h1>
        </el-form-item>
        <el-form-item prop="username">
          <el-input
            v-model="formModel.username"
            :prefix-icon="User"
            placeholder="请输入用户名"
          ></el-input>
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="formModel.password"
            :prefix-icon="Lock"
            type="password"
            placeholder="请输入密码"
          ></el-input>
        </el-form-item>
        <el-form-item prop="repassword">
          <el-input
            v-model="formModel.repassword"
            :prefix-icon="Lock"
            type="password"
            placeholder="请输入再次密码"
          ></el-input>
        </el-form-item>
        <el-form-item>
          <PinkButton @click="register" class="button">
            注册
          </PinkButton>
        </el-form-item>
        <el-form-item class="flex">
          <el-link type="info" :underline="false" @click="isRegister = false">
            ← 返回
          </el-link>
        </el-form-item>
      </el-form>
      <!-- 登录相关表单 -->
      <el-form
        :model="formModel"
        :rules="rules"
        ref="form"
        size="large"
        autocomplete="off"
        v-else
      >
        <el-form-item>
          <h1>登录</h1>
        </el-form-item>
        <el-form-item prop="username">
          <el-input
            v-model="formModel.username"
            :prefix-icon="User"
            placeholder="请输入用户名"
          ></el-input>
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="formModel.password"
            name="password"
            :prefix-icon="Lock"
            type="password"
            placeholder="请输入密码"
          ></el-input>
        </el-form-item>
        <el-form-item class="flex">
          <div class="flex">
            <el-checkbox>记住我</el-checkbox>
            <el-link type="primary" :underline="false">忘记密码？</el-link>
          </div>
        </el-form-item>
        <el-form-item>
          <PinkButton @click="login" class="button">登录</PinkButton>
        </el-form-item>
        <el-form-item class="flex">
          <el-link type="info" :underline="false" @click="isRegister = true">
            注册 →
          </el-link>
        </el-form-item>
      </el-form>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #fff1f5 0%, #ffe1ec 45%, #ffd2e3 100%);

  /* 两团柔和的粉色光斑作装饰 */
  &::before,
  &::after {
    content: '';
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.55;
    z-index: 0;
  }
  &::before {
    width: 420px;
    height: 420px;
    top: -120px;
    left: -100px;
    background: #fb7299;
  }
  &::after {
    width: 360px;
    height: 360px;
    bottom: -120px;
    right: -80px;
    background: #ff9bbb;
  }
}

.login-card {
  position: relative;
  z-index: 1;
  display: flex;
  width: 900px;
  max-width: 100%;
  min-height: 540px;
  background: var(--app-surface, #ffffff);
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 24px 64px rgba(251, 114, 153, 0.28);
}

/* 左侧品牌展示栏 */
.brand-panel {
  flex: 1.05;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 36px;
  color: #fff;
  background: linear-gradient(160deg, #fb7299 0%, #ff9bbb 100%);
  text-align: center;

  .brand-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    user-select: none;
  }
  .illo {
    width: 240px;
    height: 220px;
    background: url('@/assets/bilibili.png') no-repeat center / contain;
    filter: drop-shadow(0 12px 24px rgba(0, 0, 0, 0.18));
    animation: float 4s ease-in-out infinite;
  }
  h2 {
    margin: 0;
    font-size: 26px;
    font-weight: 700;
    letter-spacing: 1px;
  }
  p {
    margin: 0;
    font-size: 14px;
    opacity: 0.92;
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-12px);
  }
}

/* 右侧表单栏 */
.form-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 48px 52px;
  user-select: none;

  h1 {
    margin: 0 0 24px;
    font-size: 28px;
    font-weight: 700;
    color: var(--app-text, #1f2329);
  }

  /* 输入框：更圆润、聚焦粉色描边 */
  :deep(.el-input__wrapper) {
    border-radius: 12px;
    padding: 4px 14px;
    box-shadow: 0 0 0 1px var(--app-border, #e4e7ed) inset;
    transition: box-shadow 0.2s ease;
  }
  :deep(.el-input__wrapper.is-focus),
  :deep(.el-input__wrapper:hover) {
    box-shadow: 0 0 0 1px var(--bili-pink, #fb7299) inset;
  }

  .button {
    width: 100%;
    margin-top: 4px;
  }
  .flex {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}

/* 窄屏时隐藏左侧品牌栏，表单铺满 */
@media (max-width: 768px) {
  .login-card {
    width: 100%;
    min-height: auto;
  }
  .brand-panel {
    display: none;
  }
  .form-panel {
    padding: 40px 28px;
  }
}
</style>
