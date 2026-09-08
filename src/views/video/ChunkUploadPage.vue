<template>
  <div class="chunk-upload-page">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="title">大文件分片上传</span>
          <el-tag type="info" size="small">支持断点续传</el-tag>
        </div>
      </template>

      <el-alert
        title="上传说明"
        type="info"
        :closable="false"
        show-icon
        class="tip"
      >
        <template #default>
          <ul>
            <li>文件自动按 {{ chunkSizeText }} 切片，支持并发上传</li>
            <li>断网后自动暂停，网络恢复后自动续传（跳过已上传分片）</li>
            <li>可手动暂停 / 继续，关闭页面后重新选择同一文件也可续传</li>
            <li>原有普通上传接口不受影响</li>
          </ul>
        </template>
      </el-alert>

      <!-- 分片上传组件 -->
      <ChunkUpload
        :chunk-size="chunkSize"
        :concurrency="concurrency"
        @success="handleSuccess"
        @error="handleError"
      />

      <!-- 上传结果 -->
      <div v-if="uploadedUrl" class="result">
        <el-divider content-position="left">上传结果</el-divider>
        <el-result icon="success" title="上传成功" sub-title="文件已保存到服务器">
          <template #extra>
            <div class="result-url">
              <span class="label">文件地址：</span>
              <el-input :model-value="uploadedUrl" readonly>
                <template #append>
                  <el-button @click="copyUrl">复制</el-button>
                </template>
              </el-input>
            </div>
          </template>
        </el-result>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import ChunkUpload from '@/components/ChunkUpload.vue'

// 分片大小：5MB
const chunkSize = 5 * 1024 * 1024
// 并发数
const concurrency = 3

const chunkSizeText = computed(() => (chunkSize / (1024 * 1024)).toFixed(0) + 'MB')

const uploadedUrl = ref('')

function handleSuccess(url) {
  uploadedUrl.value = url
}

function handleError(msg) {
  ElMessage.error(msg)
}

function copyUrl() {
  navigator.clipboard.writeText(uploadedUrl.value).then(() => {
    ElMessage.success('已复制到剪贴板')
  })
}
</script>

<style scoped lang="scss">
.chunk-upload-page {
  .card-header {
    display: flex;
    align-items: center;
    gap: 12px;

    .title {
      font-size: 16px;
      font-weight: 600;
    }
  }

  .tip {
    margin-bottom: 20px;

    ul {
      margin: 0;
      padding-left: 20px;
      line-height: 1.8;
    }
  }

  .result {
    margin-top: 24px;

    .result-url {
      max-width: 600px;
      margin: 0 auto;
      text-align: left;

      .label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
      }
    }
  }
}
</style>
