<script setup>
import { ref } from 'vue'
import ChannelSelect from './ChannelSelect.vue'
import { Plus, VideoCamera, Delete } from '@element-plus/icons-vue'
import {
  artPublishService,
  artGetDetailService,
  artEditService,
  videoUploadService
} from '@/api/video'
import { baseURL } from '@/utils/request'
import axios from 'axios'
// 控制抽屉显示隐藏
const visibleDrawer = ref(false)

// 默认数据
const defaultForm = {
  title: '', // 标题
  cate_id: '', // 分类id
  cover_img: '', // 封面图片 file 对象
  content: '', // string 内容
  video_url: '', // 视频文件地址（上传到后端后返回的相对路径）
  state: '' // 状态
}

// 准备数据
const formModel = ref({ ...defaultForm })

// 图片上传相关逻辑
const imgUrl = ref('')
const onSelectFile = (uploadFile) => {
  imgUrl.value = URL.createObjectURL(uploadFile.raw) // 预览图片
  // 立刻将图片对象，存入 formModel.value.cover_img 将来用于提交
  formModel.value.cover_img = uploadFile.raw
}

// 视频上传相关逻辑：选中文件后直接上传到后端 uploads 目录
const videoUploading = ref(false) // 是否正在上传
const videoProgress = ref(0) // 上传进度 0~100
const videoName = ref('') // 已上传视频的文件名（用于展示）

const onSelectVideo = async (uploadFile) => {
  const raw = uploadFile.raw
  // 简单校验：必须是视频，且不超过 500MB
  if (!raw.type.startsWith('video/')) {
    ElMessage.error('请选择视频文件')
    return
  }
  if (raw.size > 500 * 1024 * 1024) {
    ElMessage.error('视频大小不能超过 500MB')
    return
  }

  videoUploading.value = true
  videoProgress.value = 0
  try {
    const res = await videoUploadService(raw, (p) => {
      videoProgress.value = p
    })
    formModel.value.video_url = res.data.url // 保存视频地址，随表单一起提交
    videoName.value = raw.name
    ElMessage.success('视频上传成功')
  } catch (e) {
    ElMessage.error('视频上传失败，请确认后端服务已启动')
    console.error(e)
  } finally {
    videoUploading.value = false
  }
}

// 移除已上传的视频
const onRemoveVideo = () => {
  formModel.value.video_url = ''
  videoName.value = ''
  videoProgress.value = 0
}

// 提交
const emit = defineEmits(['success'])
const onPublish = async (state) => {
  // 校验：必须先上传视频才能提交
  if (videoUploading.value) {
    ElMessage.warning('视频正在上传中，请稍候')
    return
  }
  if (!formModel.value.video_url) {
    ElMessage.warning('请先上传视频')
    return
  }

  // 将已发布还是草稿状态，存入 formModel
  formModel.value.state = state

  // 注意：当前接口，需要的是 formData 对象
  // 将普通对象 => 转换成 => formData对象
  const fd = new FormData()
  for (let key in formModel.value) {
    fd.append(key, formModel.value[key])
  }

  // 发请求
  if (formModel.value.id) {
    // 编辑操作
    await artEditService(fd)
    ElMessage.success('修改成功')
    visibleDrawer.value = false
    emit('success', 'edit')
  } else {
    // 添加操作
    await artPublishService(fd)
    ElMessage.success('添加成功')
    visibleDrawer.value = false
    // 通知到父组件，添加成功了
    emit('success', 'add')
  }
}

const open = async (row) => {
  visibleDrawer.value = true // 显示抽屉

  if (row.id) {
    const res = await artGetDetailService(row.id)
    const data = res.data.data
    formModel.value = {
      ...data[0],
      id: row.id
    }
    // 图片需要单独处理回显
    imgUrl.value = baseURL + formModel.value.cover_img
    // 注意：提交给后台，需要的数据格式，是file对象格式
    // 需要将网络图片地址 => 转换成 file对象，存储起来, 将来便于提交
    const file = await imageUrlToFileObject(
      imgUrl.value,
      formModel.value.cover_img
    )
    formModel.value.cover_img = file
    // 视频回显：已上传过则展示文件名
    videoName.value = formModel.value.video_url ? '已上传的视频' : ''
    videoProgress.value = formModel.value.video_url ? 100 : 0
  } else {
    formModel.value = { ...defaultForm } // 基于默认的数据，重置form数据
    // 这里重置了表单的数据，但是图片上传img地址需要手动重置
    imgUrl.value = ''
    videoName.value = ''
    videoProgress.value = 0
  }
}

// 将网络图片地址转换为 File 对象的函数
async function imageUrlToFileObject(imageUrl, filename) {
  try {
    // 使用 Axios 下载图片数据
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' })

    // 将下载的数据转换成 Blob 对象
    const blob = new Blob([response.data], {
      type: response.headers['content-type']
    })

    // 创建 File 对象
    const file = new File([blob], filename, {
      type: response.headers['content-type']
    })

    return file
  } catch (error) {
    console.error('Error converting image URL to File object:', error)
    return null
  }
}

defineExpose({
  open
})
</script>

<template>
  <el-drawer
    v-model="visibleDrawer"
    :title="formModel.id ? '编辑视频' : '添加视频'"
    direction="rtl"
    size="50%"
  >
    <!-- 发表视频表单 -->
    <el-form :model="formModel" ref="formRef" label-width="100px">
      <el-form-item label="视频标题" prop="title">
        <el-input v-model="formModel.title" placeholder="请输入标题"></el-input>
      </el-form-item>
      <el-form-item label="视频分类" prop="cate_id">
        <channel-select
          v-model="formModel.cate_id"
          width="100%"
        ></channel-select>
      </el-form-item>
      <el-form-item label="视频封面" :prop="baseURL+'/'+cover_img">
        <!-- 此处需要关闭 element-plus 的自动上传，不需要配置 action 等参数
             只需要做前端的本地预览图片即可，无需在提交前上传图标
             语法：URL.createObjectURL(...) 创建本地预览的地址，来预览
        -->
        <el-upload
          class="avatar-uploader"
          :show-file-list="false"
          :auto-upload="false"
          :on-change="onSelectFile"
        >
          <img v-if="imgUrl" :src="imgUrl" class="avatar" />
          <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
        </el-upload>
      </el-form-item>
      <el-form-item label="视频文件" prop="video_url" required>
        <div class="video-uploader">
          <el-upload
            :show-file-list="false"
            :auto-upload="false"
            accept="video/*"
            :on-change="onSelectVideo"
          >
            <PinkButton :icon="VideoCamera" :loading="videoUploading">
              {{ videoUploading ? '上传中...' : '选择视频上传' }}
            </PinkButton>
          </el-upload>

          <!-- 上传进度 -->
          <el-progress
            v-if="videoUploading"
            :percentage="videoProgress"
            :stroke-width="10"
            style="margin-top: 8px"
          />

          <!-- 上传成功后的预览 -->
          <div v-if="formModel.video_url && !videoUploading" class="video-preview">
            <video :src="baseURL + formModel.video_url" controls preload="metadata"></video>
            <div class="video-meta">
              <span class="video-name">
                <el-icon><VideoCamera /></el-icon>
                {{ videoName || '已上传视频' }}
              </span>
              <el-button type="danger" link :icon="Delete" @click="onRemoveVideo">
                移除
              </el-button>
            </div>
          </div>
          <div v-else-if="!videoUploading" class="video-tip">
            支持 mp4 等常见格式，单个文件不超过 500MB；上传后保存到服务器
          </div>
        </div>
      </el-form-item>
      <el-form-item label="视频内容" prop="content">
        <el-input
          v-model="formModel.content"
          type="textarea"
          :rows="4"
          placeholder="请输入视频简介"
        ></el-input>
      </el-form-item>
      <el-form-item>
        <PinkButton @click="onPublish('已发布')">发布</PinkButton>
        <el-button @click="onPublish('草稿')" type="info">草稿</el-button>
      </el-form-item>
    </el-form>
  </el-drawer>
</template>

<style lang="scss" scoped>
.avatar-uploader {
  :deep() {
    .avatar {
      width: 178px;
      height: 178px;
      display: block;
    }
    .el-upload {
      border: 1px dashed var(--el-border-color);
      border-radius: 6px;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      transition: var(--el-transition-duration-fast);
    }
    .el-upload:hover {
      border-color: var(--el-color-primary);
    }
    .el-icon.avatar-uploader-icon {
      font-size: 28px;
      color: #8c939d;
      width: 178px;
      height: 178px;
      text-align: center;
    }
  }
}

.video-uploader {
  width: 100%;
  .video-preview {
    margin-top: 10px;
    video {
      width: 100%;
      max-height: 240px;
      border-radius: 8px;
      background: #000;
      display: block;
    }
    .video-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 6px;
      font-size: 13px;
      color: #606266;
      .video-name {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 80%;
      }
    }
  }
  .video-tip {
    margin-top: 8px;
    font-size: 12px;
    color: #909399;
  }
}
</style>
