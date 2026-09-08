<template>
  <el-drawer
    v-model="visibleDrawer"
    :title="formModel.id ? '编辑视频' : '添加视频'"
    direction="rtl"
    size="50%"
  >
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
            <PinkButton :icon="VideoCamera" :loading="isUploading">
              {{ isUploading ? '上传中...' : '选择视频上传' }}
            </PinkButton>
          </el-upload>

          <!-- 普通上传进度 -->
          <el-progress
            v-if="videoUploading"
            
            :percentage="videoProgress"
            :stroke-width="10"
            
            style="margin-top: 8px"
          />

          <!-- 分片上传进度区 -->
          <div v-if="chunkUploading" class="chunk-upload-area">
            <el-progress
              :percentage="chunkProgress"
              :stroke-width="10"
              :status="chunkMerging ? '' : undefined"
            >
              <template #default="{ percentage }">
                <span class="chunk-progress-text">
                  {{ percentage }}%
                  <span class="chunk-count">（{{ uploadedChunks }}/{{ totalChunks }} 片）</span>
                </span>
              </template>
            </el-progress>

            <!-- 状态标签 -->
            <div class="chunk-status-bar">
              <el-tag v-if="!isOnline" type="warning" size="small" effect="dark">
                <el-icon><Warning /></el-icon> 网络已断开，等待重连...
              </el-tag>
              <el-tag v-else-if="chunkMerging" type="warning" size="small">正在合并分片...</el-tag>
              <el-tag v-else-if="chunkPaused" type="info" size="small">已暂停</el-tag>
              <el-tag v-else type="primary" size="small">分片上传中（并发 {{ CONCURRENCY }}）</el-tag>
            </div>

            <!-- 操作按钮 -->
            <div class="chunk-actions">
              <el-button
                v-if="!chunkPaused && !chunkMerging"
                type="warning"
                size="small"
                @click="pauseChunkUpload"
              >
                暂停上传
              </el-button>
              <el-button
                v-if="chunkPaused"
                type="primary"
                size="small"
                @click="resumeChunkUpload"
              >
                继续上传
              </el-button>
            </div>

            <!-- 错误信息 -->
            <el-alert
              v-if="chunkError"
              :title="chunkError"
              type="error"
              show-icon
              :closable="false"
              class="chunk-error"
            />
          </div>

          <!-- 上传成功后的预览 -->
          <div v-if="formModel.video_url && !isUploading" class="video-preview">
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
          <div v-else-if="!isUploading" class="video-tip">
            支持 mp4、avi、mov、mkv、flv、webm 等格式；小于 20MB 普通上传，大于 20MB 自动分片上传（支持断点续传）
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
<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import ChannelSelect from './ChannelSelect.vue'
import { Plus, VideoCamera, Delete, Warning } from '@element-plus/icons-vue'
import {
  artPublishService,
  artGetDetailService,
  artEditService,
  videoUploadService,
  chunkInitService,
  chunkUploadService,
  chunkStatusService,
  chunkMergeService
} from '@/api/video'
import { baseURL } from '@/utils/request'
import axios from 'axios'

// 控制抽屉显示隐藏
const visibleDrawer = ref(false)

// 分片大小阈值：小于 20MB 走普通上传，大于等于 20MB 走分片上传
// 注意：阈值不能设太大，否则普通上传一次性发送大文件会被 Nginx 拦截（413 Content Too Large）
const CHUNK_THRESHOLD = 20 * 1024 * 1024
// 单片大小 256KB（Nginx 默认 client_max_body_size 为 1MB，留足余量确保不被拦截）
// 如需更大分片，请在 Nginx 配置中设置 client_max_body_size 500M; 后再调大此值
const CHUNK_SIZE = 256 * 1024
// 并发上传数
const CONCURRENCY = 3
// 视频扩展名白名单
const VIDEO_EXTENSIONS = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.webm', '.m4v', '.mpeg', '.mpg', '.3gp', '.ts']

// 默认数据
const defaultForm = {
  title: '',
  cate_id: '',
  cover_img: '',
  content: '',
  video_url: '',
  state: ''
}

const formModel = ref({ ...defaultForm })

// ==================== 封面图片上传 ====================
const imgUrl = ref('')
const onSelectFile = (uploadFile) => {
  imgUrl.value = URL.createObjectURL(uploadFile.raw)
  formModel.value.cover_img = uploadFile.raw
}

// ==================== 视频上传：普通 + 分片 ====================
const videoUploading = ref(false) // 普通上传中
const videoProgress = ref(0)
const videoName = ref('')

// 分片上传相关状态
const chunkUploading = ref(false) // 分片上传中（包含暂停状态）
const chunkPaused = ref(false)
const chunkMerging = ref(false)
const totalChunks = ref(0)
const uploadedChunks = ref(0)
const chunkError = ref('')
const isOnline = ref(navigator.onLine)

let chunkFile = null // 当前文件
let chunkFileHash = ''
let chunks = [] // 分片 Blob 数组
let uploadedSet = new Set()
let isPausedFlag = false
let activeCount = 0
let nextIndex = 0

// 计算属性：是否正在上传（普通或分片）
const isUploading = computed(() => videoUploading.value || chunkUploading.value)
// 分片总进度
const chunkProgress = computed(() => {
  if (totalChunks.value === 0) return 0
  return Math.round((uploadedChunks.value / totalChunks.value) * 100)
})

// ==================== 视频文件校验 ====================
function validateVideoFile(file) {
  // 1. MIME type 校验
  const isVideoMime = file.type && file.type.startsWith('video/')
  // 2. 扩展名校验
  const ext = '.' + file.name.split('.').pop().toLowerCase()
  const isVideoExt = VIDEO_EXTENSIONS.includes(ext)
  // 3. 两者满足其一即认为是视频（某些格式 MIME 识别不准，靠扩展名兜底）
  if (!isVideoMime && !isVideoExt) {
    return { valid: false, message: '请选择视频文件（支持 mp4、avi、mov、mkv、flv、webm 等格式）' }
  }
  // 4. 文件大小不能为 0
  if (file.size === 0) {
    return { valid: false, message: '文件大小为 0，请重新选择' }
  }
  return { valid: true }
}

// 简单字符串哈希（djb2），生成文件唯一标识
function hashString(str) {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i)
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}

function generateFileHash(f) {
  return hashString(`${f.name}_${f.size}_${f.lastModified}`)
}

// 文件切片
function createChunks(f) {
  const result = []
  let start = 0
  while (start < f.size) {
    result.push(f.slice(start, start + CHUNK_SIZE))
    start += CHUNK_SIZE
  }
  return result
}

// ==================== 选择视频：按大小分流 ====================
const onSelectVideo = async (uploadFile) => {
  const raw = uploadFile.raw

  // 视频文件校验
  const check = validateVideoFile(raw)
  if (!check.valid) {
    ElMessage.error(check.message)
    return
  }

  // 小于阈值：走原来的普通上传
  if (raw.size < CHUNK_THRESHOLD) {
    await uploadVideoNormal(raw)
    return
  }

  // 大于等于阈值：走分片上传
  await uploadVideoChunk(raw)
}

// 普通上传（原有逻辑不变）
async function uploadVideoNormal(raw) {
  // 普通上传后端限制 500MB，超过则提示
  if (raw.size > 500 * 1024 * 1024) {
    ElMessage.error('普通上传最大支持 500MB，更大文件请使用分片上传')
    return
  }
  videoUploading.value = true
  videoProgress.value = 0
  try {
    const res = await videoUploadService(raw, (p) => {
      videoProgress.value = p
    })
    formModel.value.video_url = res.data.url
    videoName.value = raw.name
    ElMessage.success('视频上传成功')
  } catch (e) {
    ElMessage.error('视频上传失败，请确认后端服务已启动')
    console.error(e)
  } finally {
    videoUploading.value = false
  }
}

// ==================== 分片上传核心逻辑 ====================

async function uploadVideoChunk(raw) {
  // 初始化分片状态
  chunkFile = raw
  chunkFileHash = generateFileHash(raw)
  chunks = createChunks(raw)
  totalChunks.value = chunks.length
  uploadedSet = new Set()
  uploadedChunks.value = 0
  chunkError.value = ''
  isPausedFlag = false
  chunkPaused.value = false
  chunkMerging.value = false
  chunkUploading.value = true

  await startChunkUpload()
}

async function startChunkUpload() {
  chunkPaused.value = false
  isPausedFlag = false
  chunkError.value = ''

  try {
    // 1. 初始化，获取已上传分片（断点续传核心）
    const res = await chunkInitService({
      fileHash: chunkFileHash,
      fileName: chunkFile.name,
      fileSize: chunkFile.size
    })
    const uploaded = res.data?.data?.uploadedChunks || []
    uploadedSet = new Set(uploaded)
    uploadedChunks.value = uploadedSet.size

    if (uploadedSet.size > 0) {
      ElMessage.info(`检测到未完成的上传，已上传 ${uploadedSet.size}/${totalChunks.value} 片，将继续上传`)
    }

    // 2. 并发上传缺失分片
    nextIndex = 0
    activeCount = 0
    await uploadChunksConcurrent()

    // 3. 全部完成则合并
    if (uploadedSet.size === totalChunks.value && !isPausedFlag && isOnline.value) {
      await mergeChunks()
    }
  } catch (err) {
    if (!isPausedFlag && isOnline.value) {
      chunkError.value = err.message || '上传失败'
      chunkPaused.value = true
      ElMessage.error('分片上传失败，可点击继续重试')
    }
  }
}

// 并发上传（生产者-消费者模式）
function uploadChunksConcurrent() {
  return new Promise((resolve) => {
    const pump = () => {
      if (isPausedFlag || !isOnline.value) {
        if (activeCount === 0) resolve()
        return
      }
      if (nextIndex >= totalChunks.value) {
        if (activeCount === 0) resolve()
        return
      }
      if (activeCount >= CONCURRENCY) return

      const idx = nextIndex++
      if (uploadedSet.has(idx)) {
        pump()
        return
      }

      activeCount++
      uploadSingleChunk(idx)
        .then(() => {
          activeCount--
          pump()
        })
        .catch(() => {
          activeCount--
          if (!isPausedFlag && isOnline.value) {
            chunkError.value = `第 ${idx + 1} 片上传失败，可点击继续重试`
            chunkPaused.value = true
          }
          pump()
        })
      pump()
    }
    pump()
  })
}

// 上传单个分片（带 2 次重试）
async function uploadSingleChunk(index, retry = 2) {
  try {
    await chunkUploadService(chunks[index], chunkFileHash, index)
    uploadedSet.add(index)
    uploadedChunks.value = uploadedSet.size
  } catch (err) {
    if (retry > 0 && isOnline.value && !isPausedFlag) {
      await new Promise((r) => setTimeout(r, 1000))
      return uploadSingleChunk(index, retry - 1)
    }
    throw err
  }
}

// 合并分片
async function mergeChunks() {
  chunkMerging.value = true
  chunkError.value = ''
  try {
    const res = await chunkMergeService({
      fileHash: chunkFileHash,
      fileName: chunkFile.name,
      totalChunks: totalChunks.value
    })
    formModel.value.video_url = res.data.url
    videoName.value = chunkFile.name
    chunkUploading.value = false
    chunkMerging.value = false
    chunkPaused.value = false
    ElMessage.success('视频上传成功')
  } catch (err) {
    chunkMerging.value = false
    chunkError.value = '合并失败：' + (err.message || '未知错误')
    chunkPaused.value = true
    ElMessage.error('合并失败，可点击继续重试')
  }
}

// 暂停分片上传
function pauseChunkUpload() {
  isPausedFlag = true
  chunkPaused.value = true
}

// 继续分片上传（断点续传入口）
async function resumeChunkUpload() {
  if (!chunkFile) return
  chunkPaused.value = false
  isPausedFlag = false
  chunkError.value = ''

  try {
    // 重新查询服务端已上传分片，确保状态一致（断点续传核心）
    const res = await chunkStatusService(chunkFileHash)
    const uploaded = res.data?.data?.uploadedChunks || []
    uploadedSet = new Set(uploaded)
    uploadedChunks.value = uploadedSet.size

    // 明确提示用户：从哪片继续，跳过了多少已上传的分片
    if (uploadedSet.size > 0) {
      ElMessage.info(`断点续传：已上传 ${uploadedSet.size}/${totalChunks.value} 片，跳过已传部分，从第 ${uploadedSet.size + 1} 片继续`)
    } else {
      ElMessage.warning('未找到该文件的上传记录，将从头开始上传')
    }

    nextIndex = 0
    activeCount = 0
    await uploadChunksConcurrent()

    if (uploadedSet.size === totalChunks.value && !isPausedFlag && isOnline.value) {
      await mergeChunks()
    }
  } catch (err) {
    chunkError.value = err.message || '继续上传失败'
    chunkPaused.value = true
  }
}

// 清理分片上传状态
function resetChunkState() {
  isPausedFlag = true
  chunkFile = null
  chunkFileHash = ''
  chunks = []
  uploadedSet = new Set()
  totalChunks.value = 0
  uploadedChunks.value = 0
  chunkUploading.value = false
  chunkPaused.value = false
  chunkMerging.value = false
  chunkError.value = ''
  nextIndex = 0
  activeCount = 0
}

// ==================== 移除视频 ====================
const onRemoveVideo = () => {
  formModel.value.video_url = ''
  videoName.value = ''
  videoProgress.value = 0
  resetChunkState()
}

// ==================== 断网监听 ====================
function handleOnline() {
  isOnline.value = true
  if (chunkUploading.value && chunkPaused.value && !chunkMerging.value) {
    ElMessage.info('网络已恢复，继续上传')
    resumeChunkUpload()
  }
}

function handleOffline() {
  isOnline.value = false
  if (chunkUploading.value && !chunkPaused.value) {
    isPausedFlag = true
    chunkPaused.value = true
  }
}

onMounted(() => {
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
})

onUnmounted(() => {
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
  resetChunkState()
})

// ==================== 提交表单 ====================
const emit = defineEmits(['success'])
const onPublish = async (state) => {
  if (isUploading.value) {
    ElMessage.warning('视频正在上传中，请稍候')
    return
  }
  if (!formModel.value.video_url) {
    ElMessage.warning('请先上传视频')
    return
  }

  formModel.value.state = state

  const fd = new FormData()
  for (let key in formModel.value) {
    fd.append(key, formModel.value[key])
  }

  if (formModel.value.id) {
    await artEditService(fd)
    ElMessage.success('修改成功')
    visibleDrawer.value = false
    emit('success', 'edit')
  } else {
    await artPublishService(fd)
    ElMessage.success('添加成功')
    visibleDrawer.value = false
    emit('success', 'add')
  }
}

// ==================== 打开抽屉 ====================
const open = async (row) => {
  visibleDrawer.value = true

  if (row.id) {
    const res = await artGetDetailService(row.id)
    const data = res.data.data
    formModel.value = {
      ...data[0],
      id: row.id
    }
    imgUrl.value = baseURL + formModel.value.cover_img
    const file = await imageUrlToFileObject(
      imgUrl.value,
      formModel.value.cover_img
    )
    formModel.value.cover_img = file
    videoName.value = formModel.value.video_url ? '已上传的视频' : ''
    videoProgress.value = formModel.value.video_url ? 100 : 0
  } else {
    formModel.value = { ...defaultForm }
    imgUrl.value = ''
    videoName.value = ''
    videoProgress.value = 0
  }
  // 每次打开都重置分片状态
  resetChunkState()
}

// 将网络图片地址转换为 File 对象
async function imageUrlToFileObject(imageUrl, filename) {
  try {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' })
    const blob = new Blob([response.data], {
      type: response.headers['content-type']
    })
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

  .chunk-upload-area {
    margin-top: 10px;
    padding: 12px;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    background: #fafafa;

    .chunk-progress-text {
      font-size: 14px;
      font-weight: 600;

      .chunk-count {
        font-size: 12px;
        font-weight: normal;
        color: #606266;
      }
    }

    .chunk-status-bar {
      margin-top: 10px;
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .chunk-actions {
      margin-top: 10px;
      display: flex;
      gap: 8px;
    }

    .chunk-error {
      margin-top: 10px;
    }
  }

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
    line-height: 1.6;
  }
}
</style>
