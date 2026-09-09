<!-- 基本信息 -->
<template>
  <page-container title="基本资料">
    <!-- 表单部分 -->
    <el-form ref="formRef" :model="form" :rules="rules" label-width="600px" :style="{width:'1080px'}">
      <el-form-item label="登录名称">
        <el-input v-model="form.username" disabled></el-input>
      </el-form-item>
      <el-form-item label="用户昵称" prop="nickname">
        <el-input v-model="form.nickname"></el-input>
      </el-form-item>
      <el-form-item label="用户邮箱" prop="email">
        <el-input v-model="form.email"></el-input>
      </el-form-item>
      <el-form-item>
        <PinkButton @click="submitForm" :style="{marginLeft:'180px'}">提交修改</PinkButton>
      </el-form-item>
    </el-form>
  </page-container>
</template>



<script setup>
import PageContainer from '@/components/PageContainer.vue'
import { ref } from 'vue'
import { useUserStore } from '@/stores'
import { userUpdateInfoService } from '@/api/user'

const formRef = ref()

const {
  user: { email, id, nickname, username },
  getUser
} = useUserStore()

const form = ref({
  id,
  username,
  nickname,
  email
})

const rules = ref({
  nickname: [
    { required: true, message: '请输入用户昵称', trigger: 'blur' },
    {
      pattern: /^\S{2,10}/,
      message: '昵称长度在2-10个非空字符',
      trigger: 'blur'
    }
  ],
  email: [
    { required: true, message: '请输入用户邮箱', trigger: 'blur' },
    {
      type: 'email',
      message: '请输入正确的邮箱格式',
      trigger: ['blur', 'change']
    }
  ]
})

  // 提交修改
const submitForm = async () => {
  await formRef.value.validate()
  await userUpdateInfoService(form.value)
  getUser()
  ElMessage.success('修改成功')
}
</script>
