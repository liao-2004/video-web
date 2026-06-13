<script setup>
import { ref } from 'vue'
import { Plus, Upload, Camera } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores'
import { userUpdateAvatarService } from '@/api/user'
const userStore = useUserStore()
const imgUrl = ref(userStore.user.user_pic)
const imgFile = ref()
const uploadRef = ref()
const onSelectFile = (uploadFile) => {
  // 基于 FileReader 读取图片做预览
  const reader = new FileReader()
  reader.readAsDataURL(uploadFile.raw)
  reader.onload = () => {
    imgUrl.value = reader.result
    imgFile.value=uploadFile.raw
  }
}

const onUpdateAvatar = async () => {
  // 发送请求更新头像
  const formFile= new FormData()
  formFile.append('avatar', imgFile.value)
  if (!formFile.get('avatar').uid) {
    ElMessage.warning('请先选择头像！')
    return
  }
  await userUpdateAvatarService(formFile)
  // userStore 重新渲染
  await userStore.getUser()
  // 提示用户
  ElMessage.success('头像更新成功')
}
</script>

<template>
  <page-container title="更换头像">
    <div class="update_img">
      <el-upload
        ref="uploadRef"
        :auto-upload="false"
        class="avatar-uploader"
        :show-file-list="false"
        :on-change="onSelectFile"
      >
        <div class="avatar-box">
          <img v-if="imgUrl" :src="imgUrl" class="avatar" />
          <div v-else class="avatar-placeholder">
            <el-icon><Plus /></el-icon>
            <span>点击上传</span>
          </div>
          <div class="avatar-mask">
            <el-icon :size="26"><Camera /></el-icon>
            <span>点击更换</span>
          </div>
        </div>
      </el-upload>

      <p class="avatar-tip">支持 jpg / png 格式，建议使用正方形图片</p>

    <div class="op-btns">
      <PinkButton
        @click="uploadRef.$el.querySelector('input').click()"
        :icon="Plus"
        size="large"
        >选择图片</PinkButton
      >
      <el-button
        @click="onUpdateAvatar"
        type="success"
        :icon="Upload"
        size="large"
        >上传头像</el-button
      >
    </div>
    </div>
  </page-container>
</template>

<style lang="scss" scoped>
.update_img {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 36px;
  min-height: 70vh;
}

/* 去掉 el-upload 默认外框，让圆形头像本身做容器 */
.avatar-uploader :deep(.el-upload) {
  border: none;
  border-radius: 50%;
  overflow: visible;
}

.avatar-box {
  position: relative;
  width: 240px;
  height: 240px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  background: var(--app-surface-2);
  border: 4px solid var(--app-surface);
  box-shadow: 0 0 0 3px var(--bili-pink), 0 12px 32px rgba(251, 114, 153, 0.3);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.avatar-box:hover {
  transform: translateY(-4px);
  box-shadow: 0 0 0 3px var(--bili-pink), 0 18px 44px rgba(251, 114, 153, 0.45);
}

.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--app-text-mute);
  .el-icon {
    font-size: 42px;
  }
  span {
    font-size: 14px;
  }
}

/* 悬浮遮罩：提示点击更换 */
.avatar-mask {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #fff;
  background: rgba(0, 0, 0, 0.45);
  opacity: 0;
  transition: opacity 0.3s ease;
  span {
    font-size: 14px;
  }
}
.avatar-box:hover .avatar-mask {
  opacity: 1;
}

.avatar-tip {
  margin: 20px 0 26px;
  color: var(--app-text-mute);
  font-size: 13px;
}

.op-btns {
  display: flex;
  align-items: center;
  gap: 12px;
}
</style>
