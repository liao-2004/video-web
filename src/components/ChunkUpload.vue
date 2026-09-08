<template>
  <div class="chunk-upload">
    <!-- 文件选择区 -->
    <el-upload
      v-if="!file"
      class="chunk-upload__dragger"
      drag
      :auto-upload="false"
      :show-file-list="false"
      :accept="accept"
      :on-change="handleFileChange"
    >
      <el-icon class="el-icon--upload"><upload-filled /></el-icon>
      <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
      <template #tip>
        <div class="el-upload__tip">
          支持大文件分片上传，断网后可自动断点续传
        </div>
      </template>
    </el-upload>

    <!-- 上传进度区 -->
    <div v-else class="chunk-upload__progress">
      <div class="chunk-upload__file-info">
        <el-icon><video-camera /></el-icon>
        <span class="chunk-upload__file-name" :title="file.name">{{ file.name }}</span>
        <span class="chunk-upload__file-size">{{ formatSize(file.size) }}</span>
      </div>

      <el-progress
        :percentage="totalProgress"
        :status="uploadStatus === 'success' ? 'success' : uploadStatus === 'error' ? 'exception' : undefined"
        :stroke-width="20"
      >
        <template #default="{ percentage }">
          <span class="chunk-upload__progress-text">
            {{ percentage }}%
            <span v-if="uploadStatus === 'uploading'" class="chunk-upload__status">
              （{{ uploadedCount }}/{{ totalChunks }} 片）
            </span>
          </span>
        </template>
      </el-progress>

      <!-- 状态提示 -->
      <div class="chunk-upload__status-bar">
        <el-tag v-if="isOnline === false" type="warning" size="small" effect="dark">
          <el-icon><warning /></el-icon> 网络已断开，正在等待重连...
        </el-tag>
        <el-tag v-else-if="uploadStatus === 'uploading'" type="primary" size="small">
          正在上传（并发 {{ concurrency }}）
        </el-tag>
        <el-tag v-else-if="uploadStatus === 'paused'" type="info" size="small">已暂停</el-tag>
        <el-tag v-else-if="uploadStatus === 'merging'" type="warning" size="small">正在合并分片...</el-tag>
        <el-tag v-else-if="uploadStatus === 'success'" type="success" size="small">上传成功</el-tag>
        <el-tag v-else-if="uploadStatus === 'error'" type="danger" size="small">上传失败</el-tag>
      </div>

      <!-- 操作按钮 -->
      <div class="chunk-upload__actions">
        <el-button
          v-if="uploadStatus === 'uploading'"
          type="warning"
          size="small"
          @click="pauseUpload"
        >
          暂停上传
        </el-button>
        <el-button
          v-if="uploadStatus === 'paused' || uploadStatus === 'error'"
          type="primary"
          size="small"
          @click="resumeUpload"
        >
          {{ uploadStatus === 'error' ? '重新上传' : '继续上传' }}
        </el-button>
        <el-button
          v-if="uploadStatus === 'success'"
          type="success"
          size="small"
          @click="resetUpload"
        >
          再传一个
        </el-button>
        <el-button
          v-if="uploadStatus !== 'success' && file"
          size="small"
          @click="resetUpload"
        >
          取消
        </el-button>
      </div>

      <!-- 错误信息 -->
      <el-alert
        v-if="errorMsg"
        :title="errorMsg"
        type="error"
        show-icon
        :closable="false"
        class="chunk-upload__error"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled, VideoCamera, Warning } from '@element-plus/icons-vue'
import {
  chunkInitService,
  chunkUploadService,
  chunkStatusService,
  chunkMergeService
} from '@/api/video'

// ==================== Props ====================
const props = defineProps({
  // 单片大小，默认 5MB
  chunkSize: {
    type: Number,
    default: 5 * 1024 * 1024
  },
  // 并发上传数
  concurrency: {
    type: Number,
    default: 3
  },
  // 接受的文件类型
  accept: {
    type: String,
    default: 'video/*'
  }
})

// ==================== Emits ====================
const emit = defineEmits(['success', 'error', 'progress'])

// ==================== 状态 ====================
const file = ref(null) // 当前文件
const fileHash = ref('') // 文件唯一标识
const totalChunks = ref(0) // 总分片数
const chunks = ref([]) // 分片 Blob 数组
const uploadedSet = ref(new Set()) // 已上传的分片索引
const uploadStatus = ref('idle') // idle | uploading | paused | merging | success | error
const errorMsg = ref('')
const isOnline = ref(navigator.onLine)
let isPaused = false // 暂停标志
let activeCount = 0 // 当前正在上传的分片数
let nextIndex = 0 // 下一个待上传的分片索引

// ==================== 计算属性 ====================
const uploadedCount = computed(() => uploadedSet.value.size)
const totalProgress = computed(() => {
  if (totalChunks.value === 0) return 0
  return Math.round((uploadedSet.value.size / totalChunks.value) * 100)
})

// ==================== 工具函数 ====================

// 简单字符串哈希（djb2 算法），用于生成文件唯一标识
function hashString(str) {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i)
    hash = hash & hash // 转成 32 位整数
  }
  return Math.abs(hash).toString(36)
}

// 根据文件信息生成唯一标识：文件名 + 大小 + 最后修改时间
function generateFileHash(f) {
  return hashString(`${f.name}_${f.size}_${f.lastModified}`)
}

// 格式化文件大小
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
}

// 文件切片
function createChunks(f) {
  const result = []
  let start = 0
  while (start < f.size) {
    result.push(f.slice(start, start + props.chunkSize))
    start += props.chunkSize
  }
  return result
}

// ==================== 核心逻辑 ====================

// 选择文件
function handleFileChange(uploadFile) {
  const f = uploadFile.raw
  if (!f) return
  if (f.size === 0) {
    ElMessage.error('文件大小为 0，请重新选择')
    return
  }
  file.value = f
  fileHash.value = generateFileHash(f)
  chunks.value = createChunks(f)
  totalChunks.value = chunks.value.length
  uploadedSet.value = new Set()
  errorMsg.value = ''
  isPaused = false
  startUpload()
}

// 开始上传（初始化 + 获取已上传分片 + 并发上传）
async function startUpload() {
  uploadStatus.value = 'uploading'
  errorMsg.value = ''

  try {
    // 1. 初始化，获取已上传的分片（断点续传核心）
    const res = await chunkInitService({
      fileHash: fileHash.value,
      fileName: file.value.name,
      fileSize: file.value.size
    })
    const uploaded = res.data?.data?.uploadedChunks || []
    uploadedSet.value = new Set(uploaded)

    if (uploadedSet.value.size > 0) {
      ElMessage.info(`检测到未完成的上传，已上传 ${uploadedSet.value.size}/${totalChunks.value} 片，将继续上传`)
    }

    // 2. 并发上传缺失的分片
    nextIndex = 0
    activeCount = 0
    await uploadChunksConcurrent()

    // 3. 如果全部上传完成，合并
    if (uploadedSet.value.size === totalChunks.value && !isPaused) {
      await mergeChunks()
    }
  } catch (err) {
    if (!isPaused && isOnline.value) {
      errorMsg.value = err.message || '上传失败'
      uploadStatus.value = 'error'
      emit('error', err.message || '上传失败')
    }
  }
}

// 并发上传分片（生产者-消费者模式）
function uploadChunksConcurrent() {
  return new Promise((resolve) => {
    const pump = () => {
      // 暂停或断网时停止启动新分片
      if (isPaused || !isOnline.value) {
        if (activeCount === 0) resolve()
        return
      }
      // 所有分片都已处理完
      if (nextIndex >= totalChunks.value) {
        if (activeCount === 0) resolve()
        return
      }
      // 达到并发上限
      if (activeCount >= props.concurrency) return

      const idx = nextIndex++
      // 跳过已上传的分片
      if (uploadedSet.value.has(idx)) {
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
          // 单个分片失败不终止整体，标记错误后等用户重试
          if (!isPaused && isOnline.value) {
            errorMsg.value = `第 ${idx + 1} 片上传失败，可点击继续重试`
            uploadStatus.value = 'error'
          }
          pump()
        })
      // 立即尝试启动下一个（填满并发池）
      pump()
    }
    pump()
  })
}

// 上传单个分片（带重试）
async function uploadSingleChunk(index, retry = 2) {
  try {
    await chunkUploadService(chunks.value[index], fileHash.value, index)
    uploadedSet.value.add(index)
    emit('progress', totalProgress.value)
  } catch (err) {
    if (retry > 0 && isOnline.value && !isPaused) {
      await new Promise((r) => setTimeout(r, 1000))
      return uploadSingleChunk(index, retry - 1)
    }
    throw err
  }
}

// 合并分片
async function mergeChunks() {
  uploadStatus.value = 'merging'
  try {
    const res = await chunkMergeService({
      fileHash: fileHash.value,
      fileName: file.value.name,
      totalChunks: totalChunks.value
    })
    const url = res.data?.url
    uploadStatus.value = 'success'
    ElMessage.success('上传成功')
    emit('success', url)
  } catch (err) {
    errorMsg.value = '合并失败：' + (err.message || '未知错误')
    uploadStatus.value = 'error'
    emit('error', errorMsg.value)
  }
}

// 暂停上传
function pauseUpload() {
  isPaused = true
  uploadStatus.value = 'paused'
}

// 继续上传（断点续传入口）
async function resumeUpload() {
  if (!file.value) return
  isPaused = false
  errorMsg.value = ''

  try {
    // 重新查询服务端已上传的分片，确保状态一致
    const res = await chunkStatusService(fileHash.value)
    const uploaded = res.data?.data?.uploadedChunks || []
    uploadedSet.value = new Set(uploaded)

    uploadStatus.value = 'uploading'
    nextIndex = 0
    activeCount = 0
    await uploadChunksConcurrent()

    if (uploadedSet.value.size === totalChunks.value && !isPaused) {
      await mergeChunks()
    }
  } catch (err) {
    errorMsg.value = err.message || '继续上传失败'
    uploadStatus.value = 'error'
  }
}

// 重置上传
function resetUpload() {
  isPaused = true
  file.value = null
  fileHash.value = ''
  chunks.value = []
  totalChunks.value = 0
  uploadedSet.value = new Set()
  uploadStatus.value = 'idle'
  errorMsg.value = ''
  nextIndex = 0
  activeCount = 0
}

// ==================== 断网监听 ====================
function handleOnline() {
  isOnline.value = true
  // 网络恢复时，如果之前在上传中，自动继续
  if (uploadStatus.value === 'uploading' || uploadStatus.value === 'paused') {
    ElMessage.info('网络已恢复，继续上传')
    resumeUpload()
  }
}

function handleOffline() {
  isOnline.value = false
  if (uploadStatus.value === 'uploading') {
    // 标记暂停，正在进行的请求会失败但不会丢进度
    isPaused = true
    uploadStatus.value = 'paused'
  }
}

onMounted(() => {
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
})

onUnmounted(() => {
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
  isPaused = true
})
</script>

<style scoped lang="scss">
.chunk-upload {
  width: 100%;

  &__dragger {
    width: 100%;
  }

  &__progress {
    padding: 16px;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    background: #fafafa;
  }

  &__file-info {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    font-size: 14px;
  }

  &__file-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 500;
  }

  &__file-size {
    color: #909399;
    font-size: 12px;
    flex-shrink: 0;
  }

  &__progress-text {
    font-size: 14px;
    font-weight: 600;
  }

  &__status {
    font-size: 12px;
    font-weight: normal;
    color: #606266;
  }

  &__status-bar {
    margin-top: 12px;
    display: flex;
    gap: 8px;
  }

  &__actions {
    margin-top: 12px;
    display: flex;
    gap: 8px;
  }

  &__error {
    margin-top: 12px;
  }
}
</style>
