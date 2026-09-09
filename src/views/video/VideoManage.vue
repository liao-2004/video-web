<!-- 添加视频 -->
<template>
  <page-container title="视频管理">
    <template #extra>
      <PinkButton @click="onAddArticle">添加视频</PinkButton>
    </template>

    <el-form inline>
      <el-form-item label="视频分类:">
        <channel-select v-model="params.cate_id" :style="{width:'100px'}"></channel-select>

      </el-form-item>
      <el-form-item label="发布状态:">
        <el-select v-model="params.state" :style="{width:'100px'}">
          <el-option label="已发布" value="已发布"></el-option>
          <el-option label="草稿" value="草稿"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item>
        <PinkButton @click="onSearch">搜索</PinkButton>
        <el-button @click="onReset">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="articleList" v-loading="loading">
      <el-table-column label="视频标题" prop="title">
        <template #default="{ row }">
          <el-link type="primary" :underline="false">{{ row.title }}</el-link>
        </template>
      </el-table-column>
      <el-table-column label="分类" prop="cate_id"></el-table-column>
      <el-table-column label="发布人">
        <template #default="scope">
          {{ scope.row.nickname || scope.row.user }}
        </template>
      </el-table-column>
      <el-table-column label="发表时间" prop="pub_date">
        <template #default="{ row }">
          {{ formatTime(row.pub_date) }}
        </template>
      </el-table-column>
      <el-table-column label="状态" prop="state"></el-table-column>
      <el-table-column label="操作">
        <template #default="{ row }">
          <div class="op-btns">
            <PinkButton
              circle
              plain
              :icon="Edit"
              @click="onEditArticle(row)"
            ></PinkButton>
            <el-button
              circle
              plain
              type="danger"
              :icon="Delete"
              @click="onDeleteArticle(row)"
            ></el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="params.pagenum"
      v-model:page-size="params.pagesize"
      :page-sizes="[2, 3, 5, 10]"
      :background="true"
      layout="jumper, total, sizes, prev, pager, next"
      :total="total"
      @size-change="onSizeChange"
      @current-change="onCurrentChang"
      style="margin-top: 20px; justify-content: flex-end"
    />  
     

    <article-edit ref="articleEditRef" @success="onSuccess"></article-edit>
  </page-container>
</template>
<script setup>
import { ref } from 'vue'
import { Delete, Edit } from '@element-plus/icons-vue'
import ChannelSelect from './components/ChannelSelect.vue'
import ArticleEdit from './components/ArticleEdit.vue'
import { artGetListManageService, artDelService } from '@/api/video.js'
import { formatTime } from '@/utils/format.js'
const articleList = ref([]) // 视频列表
const total = ref(0) // 总条数
const loading = ref(false) // loading状态

const params = ref({
  pagenum: 1, 
  pagesize: 5,
  cate_id: '',
  state: ''
})

const getArticleList = async () => {
  loading.value = true
  const res = await artGetListManageService(params.value)
  articleList.value = res.data.data
  total.value = res.data.total

  loading.value = false
}
getArticleList()

// 处理分页逻辑
const onSizeChange = (size) => {
  params.value.pagenum = 1
  params.value.pagesize = size
  getArticleList()
}
const onCurrentChang = (page) => {
  params.value.pagenum = page
  getArticleList()
}

const onSearch = () => {
  params.value.pagenum = 1 // 重置页面
  getArticleList()
}

const onReset = () => {
  params.value.pagenum = 1 
  params.value.cate_id = ''
  params.value.state = ''
  getArticleList()
}

const articleEditRef = ref()
// 添加逻辑
const onAddArticle = () => {
  articleEditRef.value.open({})
}
// 编辑逻辑
const onEditArticle = (row) => {
  articleEditRef.value.open(row)
}

// 删除逻辑
const onDeleteArticle = async (row) => {
  await ElMessageBox.confirm('此操作将永久删除该文件, 是否继续?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
  await artDelService(row.id)
  ElMessage.success('删除成功')
  getArticleList()
}

const onSuccess = (type) => {
  if (type === 'add') {
    const lastPage = Math.ceil((total.value + 1) / params.value.pagesize)
    params.value.pagenum = lastPage
  }

  getArticleList()
}
</script>


<style lang="scss" scoped>
.op-btns {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
