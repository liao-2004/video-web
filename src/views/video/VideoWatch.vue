<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, View, Calendar, User, VideoPlay } from '@element-plus/icons-vue'
import { artGetDetailService } from '@/api/video'
import { baseURL } from '@/utils/request'
import { formatTime } from '@/utils/format.js'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const video = ref(null)

const getDetail = async () => {
  loading.value = true
  try {
    const res = await artGetDetailService(route.params.id)
    video.value = res.data.data?.[0] || null
  } finally {
    loading.value = false
  }
}
getDetail()

const goBack = () => {
  // 有历史则返回，否则回到视频中心
  if (window.history.length > 1) router.back()
  else router.push('/video/userVideo')
}
</script>

<template>
  <div class="watch-page" v-loading="loading">
    <div class="watch-header">
      <el-button :icon="ArrowLeft" round @click="goBack">返回</el-button>
      <span class="brand">bili 视频</span>
    </div>

    <template v-if="video">
      <div class="player-card">
        <!-- 视频播放器：优先播放上传的视频文件，没有则展示封面占位 -->
        <div class="player">
          <video
            v-if="video.video_url"
            :src="baseURL + video.video_url"
            :poster="baseURL + video.cover_img"
            controls
            autoplay
            preload="metadata"
          ></video>
          <div v-else class="no-video">
            <img :src="baseURL + video.cover_img" alt="封面" />
            <div class="no-video-mask">
              <el-icon :size="48"><VideoPlay /></el-icon>
              <p>该视频暂未上传播放源</p>
            </div>
          </div>
        </div>

        <!-- 视频信息 -->
        <div class="info">
          <h1 class="title">{{ video.title }}</h1>
          <div class="meta">
            <span><el-icon><User /></el-icon> {{ video.nickname || video.username || '匿名UP主' }}</span>
            <span><el-icon><Calendar /></el-icon> {{ formatTime(video.pub_date) }}</span>
            <span><el-icon><View /></el-icon> {{ video.state }}</span>
          </div>
          <el-divider />
          <div class="desc-title">视频简介</div>
          <p class="desc">{{ video.content || '这位 UP 主很懒，还没有写简介~' }}</p>
        </div>
      </div>
    </template>

    <el-empty v-else-if="!loading" description="视频不存在或已被删除" />
  </div>
</template>

<style scoped>
.watch-page {
  min-height: 75vh;
  background: var(--app-bg);
  padding: 16px;
}
.watch-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}
.brand {
  color: var(--bili-pink);
  font-size: 20px;
  font-weight: 700;
}
.player-card {
  max-width: 980px;
  margin: 0 auto;
  background: var(--app-surface);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--shadow-card);
}
.player {
  width: 100%;
  background: #000;
  aspect-ratio: 16 / 9;
}
.player video {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
}
.no-video {
  position: relative;
  width: 100%;
  height: 100%;
}
.no-video img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: brightness(0.5);
}
.no-video-mask {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
  gap: 8px;
}
.info {
  padding: 20px 24px 28px;
}
.title {
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 12px;
  color: var(--app-text);
}
.meta {
  display: flex;
  gap: 24px;
  color: var(--app-text-mute);
  font-size: 14px;
}
.meta span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.desc-title {
  font-weight: 600;
  color: var(--app-text);
  margin-bottom: 8px;
}
.desc {
  color: var(--app-text-sub);
  line-height: 1.7;
  white-space: pre-wrap;
  margin: 0;
}
</style>
