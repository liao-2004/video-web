<script setup>
    import { ref, nextTick } from 'vue'
    import { useRouter } from 'vue-router'
    import { VideoPlay } from '@element-plus/icons-vue'
    import { artGetChannelsService, artGetListService } from '../../api/video'
    import { baseURL } from '@/utils/request'

    const router = useRouter()
    // 点击卡片跳转到站内观看页
    const goWatch = (item) => {
      if (item.id == null) return
      router.push(`/video/watch/${item.id}`)
    }

    const loading = ref(false)      // 是否正在加载
    const finished = ref(false)     // 是否已全部加载完
    const channelList = ref([])     // 分类列表
    const newCate = ref('')         // 当前分类
    const video_data = ref([])      // 累加的视频数据
    const total = ref(0)            // 当前分类总数
    const listRef = ref(null)       // 滚动容器引用

    const params = ref({
      pagenum: 1,
      pagesize: 8,   // 每页数量，4 的倍数和栅格对齐
      cate_id: '',
      state: '已发布'
    })

    // 加载列表：reset=true 表示重新从第一页加载（切换分类/首次）
    const getList = async (reset = false) => {
      if (reset) {
        params.value.pagenum = 1
        video_data.value = []
        total.value = 0
        finished.value = false
        loading.value = false              // 中断上一个分类未完成的加载状态
        await nextTick()
        if (listRef.value) listRef.value.scrollTop = 0   // 滚动位置归零
      }
      if (loading.value || finished.value) return

      loading.value = true
      const reqCate = params.value.cate_id  // 记录本次请求所属分类
      try {
        const res = await artGetListService(params.value)
        // 请求期间分类已切换，丢弃这次结果，避免串数据
        if (reqCate !== params.value.cate_id) return

        const list = res.data.data
        total.value = res.data.total
        video_data.value.push(...list)

        // 判断是否加载完
        if (list.length === 0 || video_data.value.length >= total.value) {
          finished.value = true
        } else {
          params.value.pagenum += 1
        }
      } finally {
        if (reqCate === params.value.cate_id) loading.value = false
      }

      // 内容没填满容器时继续加载，保证有滚动条、能触发无限滚动
      if (reqCate === params.value.cate_id && !finished.value) {
        await nextTick()
        const el = listRef.value
        if (el && el.scrollHeight <= el.clientHeight) {
          getList()
        }
      }
    }

    // 获取分类并加载首屏
    const getCateFun = async () => {
      const res = await artGetChannelsService()
      channelList.value = res.data.data
      newCate.value = channelList.value[0].Id
      params.value.cate_id = newCate.value
      await getList(true)
    }
    getCateFun()

    // 无限滚动触发
    const load = () => {
      getList()
    }

    // 切换分类
    const cateListFun = async (Id) => {
      if (Id === newCate.value) return
      newCate.value = Id
      params.value.cate_id = Id
      await getList(true)
    }
    </script>

    <template>
      <div class="body">
        <div class="title-box">
          <div class="title">bili视频</div>
          <div class="cate">
            <div
              v-for="i in channelList"
              :key="i.Id"
              :class="[newCate === i.Id ? 'newCate' : 'oldCate', 'cate-obj']"
              @click="cateListFun(i.Id)"
            >
              <p>{{ i.name }}</p>
            </div>
          </div>
        </div>

        <div class="list-wrap">
          <ul
            ref="listRef"
            v-infinite-scroll="load"
            :infinite-scroll-disabled="loading || finished"
            :infinite-scroll-distance="50"
            class="infinite-list"
          >
            <div class="card-grid">
              <div
                v-for="(item, idx) in video_data"
                :key="item.id ?? idx"
                class="card"
                @click="goWatch(item)"
              >
                <div class="crad-img-box">
                  <img class="card-img" :src="baseURL + item.cover_img" alt="" />
                  <!-- 悬浮播放按钮 -->
                  <div class="play-mask">
                    <el-icon :size="40"><VideoPlay /></el-icon>
                  </div>
                  <!-- 是否含播放源标记 -->
                </div>
                <div class="card-font">
                  <p class="card-title">{{ item.title }}</p>
                  <p class="card-content">{{ item.content }}</p>
                  <p class="card-author">
                    UP：{{ item.nickname || item.username || '匿名' }}
                  </p>
                </div>
              </div>
            </div>

            <p v-if="loading" class="tip">加载中...</p>
            <p v-if="finished && video_data.length" class="tip">没有更多了</p>
            <p v-if="finished && !video_data.length" class="tip">暂无数据</p>
          </ul>
        </div>
      </div>
    </template>

    <style scoped>
    .body {
      box-shadow: var(--shadow-card);
      border-radius: var(--radius-md);
      height: 75vh;
      background-color: var(--app-surface);
    }
    .title-box {
      border-bottom: 1px solid var(--app-border);
      height: 13%;
      display: flex;
      align-items: center;
      justify-content: start;
    }
    .title {
      color: var(--bili-pink);
      font-size: 24px;
      font-weight: 700;
      margin: 20px;
    }
    .cate {
      display: flex;
      gap: 20px;
      font-size: 15px;
    }
    .cate-obj { cursor: pointer; }
    .newCate {
      color: var(--bili-pink);
      border-bottom: 3px solid var(--bili-pink);
    }
    .oldCate {
      color: var(--app-text-sub);
      border-bottom: 0;
    }

    /* 关键：滚动容器要有固定高度 + overflow:auto，无限滚动才会触发 */
    .list-wrap { height: 87%; }
    .infinite-list {
      height: 100%;
      overflow: auto;
      padding: 0;
      margin: 0;
      list-style: none;
    }

    .card-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      justify-items: center;
      padding: 10px;
    }
    .card {
      height: 215px;
      width: 240px;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .card:hover { transform: translateY(-4px); }
    .crad-img-box {
      position: relative;
      height: 60%;
      width: 100%;
      overflow: hidden;
      border-radius: 8px;
    }
    .card-img {
      height: 100%;
      width: 100%;
      border-radius: 8px;
      object-fit: cover;
      transition: transform 0.3s ease;
    }
    .crad-img-box:hover .card-img { transform: scale(1.08); }

    /* 悬浮播放遮罩 */
    .play-mask {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      background: rgba(0, 0, 0, 0.35);
      opacity: 0;
      transition: opacity 0.25s ease;
    }
    .crad-img-box:hover .play-mask { opacity: 1; }

    /* 可播放角标 */
    .badge {
      position: absolute;
      top: 8px;
      left: 8px;
      padding: 2px 8px;
      font-size: 12px;
      color: #fff;
      background: rgba(251, 114, 153, 0.9);
      border-radius: 4px;
    }

    .card-font {
      line-height: 20px;
      height: 40%;
      padding-top: 6px;
      color: var(--app-text);
    }
    .card-title {
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin: 0;
    }
    .card-content {
      color: var(--app-text-mute);
      font-size: 13px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin: 2px 0;
    }
    .card-author {
      color: var(--app-text-mute);
      font-size: 12px;
      margin: 0;
    }
    .card-title:hover,
    .card-content:hover { color: var(--bili-pink); }

    .tip {
      text-align: center;
      color: var(--app-text-mute);
      padding: 12px 0;
    }
    </style>