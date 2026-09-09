<!-- 角色管理 -->



<template>
  <page-container title="角色管理">
    <template #extra>
      <PinkButton v-hasPermi="['system:role:add']" :icon="Plus" @click="onAdd">新增角色</PinkButton>
    </template>

    



    <el-form inline>
      <el-form-item label="角色名称">
        <el-input v-model="params.role_name" placeholder="请输入角色名称" clearable />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="params.status" placeholder="请选择状态" clearable style="width: 120px">
          <el-option label="正常" :value="1" />
          <el-option label="停用" :value="0" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <PinkButton @click="onSearch">搜索</PinkButton>
        <el-button @click="onReset">重置</el-button>
      </el-form-item>
    </el-form>

    



    <el-table :data="roleList" v-loading="loading" border>
      <el-table-column label="角色ID" prop="id" width="80" />
      <el-table-column label="角色名称" prop="role_name" />
      <el-table-column label="权限字符" prop="role_key" />
      <el-table-column label="显示顺序" prop="sort" width="100" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusTag(row.status)" size="small">{{ statusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="备注" prop="remark" show-overflow-tooltip />
      <el-table-column label="操作" width="280" fixed="right">
        <template #default="{ row }">
          <span
            v-hasPermi="['system:role:edit']"
            class="link-btn success"
            @click="onEdit(row)"
          ><el-icon><Edit /></el-icon>编辑</span>
          <span
            v-hasPermi="['system:role:menu']"
            class="link-btn primary"
            @click="onAssignMenu(row)"
          ><el-icon><Setting /></el-icon>分配菜单</span>
          <span
            v-hasPermi="['system:role:delete']"
            class="link-btn danger"
            @click="onDelete(row)"
          ><el-icon><Delete /></el-icon>删除</span>
        </template>
      </el-table-column>
    </el-table>

    


    <el-pagination
      v-model:current-page="params.pagenum"
      v-model:page-size="params.pagesize"
      :page-sizes="[5, 10, 20]"
      :background="true"
      layout="jumper, total, sizes, prev, pager, next"
      :total="total"
      @size-change="onSizeChange"
      @current-change="onCurrentChange"
      style="margin-top: 20px; justify-content: flex-end"
    />

    
    <!-- 抽屉 -->
    <el-drawer v-model="drawerVisible" :title="drawerTitle" direction="rtl" size="40%">
      <el-form :model="formModel" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="角色名称" prop="role_name">
          <el-input v-model="formModel.role_name" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="权限字符" prop="role_key">
          <el-input v-model="formModel.role_key" placeholder="请输入权限字符，如 admin" />
        </el-form-item>
        <el-form-item label="显示顺序">
          <el-input-number v-model="formModel.sort" :min="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="formModel.status">
            <el-radio :value="1">正常</el-radio>
            <el-radio :value="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="formModel.remark" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item>
          <PinkButton @click="onSubmit">确定</PinkButton>
          <el-button @click="drawerVisible = false">取消</el-button>
        </el-form-item>
      </el-form>
    </el-drawer>

    <!-- 分配菜单抽屉 -->
    <el-drawer v-model="menuDrawerVisible" title="分配菜单权限" direction="rtl" size="40%">
      <el-tree
        ref="menuTreeRef"
        :data="menuTree"
        :props="defaultProps"
        show-checkbox
        node-key="id"
        :default-checked-keys="checkedMenuIds"
        default-expand-all
      />
      <div style="margin-top: 20px">
        <PinkButton @click="onSubmitMenu">确定</PinkButton>
        <el-button @click="menuDrawerVisible = false">取消</el-button>
      </div>
    </el-drawer>
  </page-container>
</template>








<script setup>
import { ref, onMounted } from 'vue'
import { Delete, Edit, Plus, Setting } from '@element-plus/icons-vue'
import {
  roleGetListService,
  roleAddService,
  roleUpdateService,
  roleDeleteService,
  roleGetInfoService,
  roleAssignMenusService,
  menuGetTreeService
} from '@/api/system'

// 列表数据
const roleList = ref([])
const total = ref(0)
const loading = ref(false)
const params = ref({
  pagenum: 1,
  pagesize: 10,
  role_name: '',
  status: ''
})

// 获取列表
const getList = async () => {
  loading.value = true
  const res = await roleGetListService(params.value)
  roleList.value = res.data.data
  total.value = res.data.total
  loading.value = false
}
onMounted(getList)

// 搜索
const onSearch = () => {
  params.value.pagenum = 1
  getList()
}
const onReset = () => {
  params.value.role_name = ''
  params.value.status = ''
  params.value.pagenum = 1
  getList()
}

// 分页
const onSizeChange = (size) => {
  params.value.pagesize = size
  getList()
}
const onCurrentChange = (page) => {
  params.value.pagenum = page
  getList()
}

// ==================== 新增/编辑 ====================
const drawerVisible = ref(false)
const drawerTitle = ref('')
const formRef = ref()
const formModel = ref({
  id: null,
  role_name: '',
  role_key: '',
  sort: 0,
  status: 1,
  remark: ''
})
const rules = {
  role_name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  role_key: [{ required: true, message: '请输入权限字符', trigger: 'blur' }]
}

const onAdd = () => {
  drawerTitle.value = '新增角色'
  formModel.value = { id: null, role_name: '', role_key: '', sort: 0, status: 1, remark: '' }
  drawerVisible.value = true
}
const onEdit = async (row) => {
  drawerTitle.value = '编辑角色'
  const res = await roleGetInfoService(row.id)
  formModel.value = { ...res.data.data }
  drawerVisible.value = true
}
const onSubmit = async () => {
  await formRef.value.validate()
  if (formModel.value.id) {
    await roleUpdateService(formModel.value)
    ElMessage.success('编辑成功')
  } else {
    await roleAddService(formModel.value)
    ElMessage.success('新增成功')
  }
  drawerVisible.value = false
  getList()
}

// ==================== 删除 ====================
const onDelete = async (row) => {
  await ElMessageBox.confirm('确认删除该角色？', '提示', { type: 'warning' })
  await roleDeleteService(row.id)
  ElMessage.success('删除成功')
  getList()
}

// ==================== 分配菜单 ====================
const menuDrawerVisible = ref(false)
const currentRoleId = ref(null)
const menuTree = ref([])
const checkedMenuIds = ref([])
const defaultProps = { children: 'children', label: 'menu_name' }

const onAssignMenu = async (row) => {
  currentRoleId.value = row.id
  // 获取菜单树
  const menuRes = await menuGetTreeService()
  menuTree.value = menuRes.data.data
  // 获取角色已分配的菜单
  const roleRes = await roleGetInfoService(row.id)
  checkedMenuIds.value = roleRes.data.data.menuIds || []
  menuDrawerVisible.value = true
}

const onSubmitMenu = async () => {
  await roleAssignMenusService({
    role_id: currentRoleId.value,
    menu_ids: checkedMenuIds.value
  })
  ElMessage.success('分配菜单成功')
  menuDrawerVisible.value = false
}

// 状态标签
const statusTag = (status) => (status === 1 ? 'success' : 'info')
const statusText = (status) => (status === 1 ? '正常' : '停用')
</script>

<style lang="scss" scoped>
.link-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  font-size: 14px;
  padding: 0 6px;
  transition: opacity 0.2s;
  user-select: none;

  .el-icon {
    font-size: 14px;
  }

  &:hover {
    opacity: 0.7;
  }

  &.primary {
    color: #409eff;
  }
  &.success {
    color: #67c23a;
  }
  &.danger {
    color: #f56c6c;
  }
}
</style>

