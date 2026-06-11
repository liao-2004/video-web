<script setup>
    import { ref, nextTick } from 'vue'
    import { artGetChannelsService, artGetListService } from '../../api/video'
    import { baseURL } from '@/utils/request'

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
              >
                <div class="crad-img-box">
                  <img class="card-img" :src="baseURL + item.cover_img" alt="" />
                </div>
                <div class="card-font">
                  <p class="card-title">{{ item.title }}</p>
                  <p class="card-content">{{ item.content }}</p>
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
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
      height: 75vh;
      background-color: rgb(255, 255, 255);
    }
    .title-box {
      border-bottom: 1px solid rgb(228, 231, 237);
      height: 13%;
      display: flex;
      align-items: center;
      justify-content: start;
    }
    .title {
      color: rgb(251, 114, 153);
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
      color: rgb(251, 114, 153);
      border-bottom: 3px solid rgb(251, 114, 153);
    }
    .oldCate {
      color: black;
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
      height: 190px;
      width: 240px;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .crad-img-box {
      height: 68%;
      width: 100%;
      overflow: hidden;
      border-radius: 8px;
      transition: transform 0.3s ease;
    }
    .card-img {
      height: 100%;
      width: 100%;
      border-radius: 8px;
    }
    .crad-img-box:hover { transform: scale(1.05); }
    .card-font {
      line-height: 18px;
      height: 32%;
      color: black;
    }
    .card-title:hover,
    .card-content:hover { color: rgb(251, 114, 153); }

    .tip {
      text-align: center;
      color: #999;
      padding: 12px 0;
    }
    </style>