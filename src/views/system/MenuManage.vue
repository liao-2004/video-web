<!-- 菜单管理 -->
<template>
  <page-container title="菜单管理">
    <template #extra>
      <PinkButton v-hasPermi="['system:menu:add']" :icon="Plus" @click="onAdd(null)">新增菜单</PinkButton>
    </template>

    <!-- 菜单树表格 -->
    <el-table
      :data="menuTree"
      v-loading="loading"
      border
      row-key="id"
      default-expand-all
      :tree-props="{ children: 'children' }"
    >
      <el-table-column label="菜单名称" prop="menu_name" min-width="200">
        <template #default="{ row }">
          <el-icon v-if="row.icon && row.icon !== '#'" style="margin-right: 6px">
            <component :is="row.icon" />
          </el-icon>
          {{ row.menu_name }}
        </template>
      </el-table-column>
      <el-table-column label="类型" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="menuTypeTag(row.menu_type)" size="small">{{ menuTypeText(row.menu_type) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="路由地址" prop="path" min-width="180" show-overflow-tooltip />
      <el-table-column label="组件路径" prop="component" min-width="180" show-overflow-tooltip />
      <el-table-column label="权限标识" prop="perms" min-width="150" show-overflow-tooltip />
      <el-table-column label="排序" prop="sort" width="80" align="center" />
      <el-table-column label="显示" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="row.visible === 1 ? 'success' : 'info'" size="small">
            {{ row.visible === 1 ? '显示' : '隐藏' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <span
            v-if="row.menu_type !== 'F'"
            v-hasPermi="['system:menu:add']"
            class="link-btn primary"
            @click="onAdd(row)"
          ><el-icon><Plus /></el-icon>新增</span>
          <span
            v-hasPermi="['system:menu:edit']"
            class="link-btn success"
            @click="onEdit(row)"
          ><el-icon><Edit /></el-icon>编辑</span>
          <span
            v-hasPermi="['system:menu:delete']"
            class="link-btn danger"
            @click="onDelete(row)"
          ><el-icon><Delete /></el-icon>删除</span>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增，编辑抽屉 -->
    <el-drawer v-model="drawerVisible" :title="drawerTitle" direction="rtl" size="45%">
      <el-form :model="formModel" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="上级菜单">
          <el-select v-model="formModel.parent_id" style="width: 100%">
            <el-option
              v-for="opt in parentOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
              :disabled="opt.menu_type === 'C' && formModel.menu_type === 'M'"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="菜单类型" prop="menu_type">
          <el-radio-group v-model="formModel.menu_type">
            <el-radio v-for="opt in menuTypeOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="菜单名称" prop="menu_name">
          <el-input v-model="formModel.menu_name" placeholder="请输入菜单名称" />
        </el-form-item>
        <el-form-item v-if="formModel.menu_type !== 'F'" label="路由地址">
          <el-input v-model="formModel.path" placeholder="如 /video/manage" />
        </el-form-item>
        <el-form-item v-if="formModel.menu_type === 'C'" label="组件路径">
          <el-input v-model="formModel.component" placeholder="如 video/VideoManage" />
        </el-form-item>
        <el-form-item label="权限标识">
          <el-input v-model="formModel.perms" placeholder="如 system:role:list" />
        </el-form-item>
        <el-form-item v-if="formModel.menu_type !== 'F'" label="图标">
          <el-input v-model="formModel.icon" placeholder="如 Setting，# 表示无图标" />
        </el-form-item>
        <el-form-item label="显示排序">
          <el-input-number v-model="formModel.sort" :min="0" />
        </el-form-item>
        <el-form-item label="是否显示">
          <el-radio-group v-model="formModel.visible">
            <el-radio :value="1">显示</el-radio>
            <el-radio :value="0">隐藏</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="formModel.remark" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item>
          <PinkButton @click="onSubmit">确定</PinkButton>
          <el-button @click="drawerVisible = false">取消</el-button>
        </el-form-item>
      </el-form>
    </el-drawer>
  </page-container>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { Delete, Edit, Plus } from '@element-plus/icons-vue'
import {
  menuGetTreeService,
  menuAddService,
  menuUpdateService,
  menuDeleteService,
  menuGetInfoService
} from '@/api/system'

// 获取菜单树
const menuTree = ref([])
const loading = ref(false)
const defaultProps = { children: 'children', label: 'menu_name' }

const getTree = async () => {
  loading.value = true
  const res = await menuGetTreeService()
  menuTree.value = res.data.data
  loading.value = false
}
onMounted(getTree)

// 菜单类型
const menuTypeOptions = [
  { value: 'M', label: '目录' },
  { value: 'C', label: '菜单' },
  { value: 'F', label: '按钮' }
]
const menuTypeText = (type) => {
  const map = { M: '目录', C: '菜单', F: '按钮' }
  return map[type] || type
}
const menuTypeTag = (type) => {
  const map = { M: 'primary', C: 'success', F: 'warning' }
  return map[type] || 'info'
}

// ====== 新增，编辑组件 ============
const drawerVisible = ref(false)
const drawerTitle = ref('')
const formRef = ref()
const formModel = ref({
  id: null,
  parent_id: 0,
  menu_name: '',
  path: '',
  component: '',
  perms: '',
  menu_type: 'C',
  icon: '#',
  sort: 0,
  visible: 1,
  remark: ''
})
const rules = {
  menu_name: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
  menu_type: [{ required: true, message: '请选择菜单类型', trigger: 'change' }]
}

// 父级菜单选择（树形）
const parentOptions = ref([])
const buildParentOptions = (menus, level = 0) => {
  const result = []
  menus.forEach((m) => {
    if (m.menu_type !== 'F') {
      result.push({
        value: m.id,
        label: '　'.repeat(level) + m.menu_name,
        menu_type: m.menu_type
      })
      if (m.children) {
        result.push(...buildParentOptions(m.children, level + 1))
      }
    }
  })
  return result
}

const onAdd = (row) => {
  drawerTitle.value = '新增菜单'
  formModel.value = {
    id: null,
    parent_id: row ? row.id : 0,
    menu_name: '',
    path: '',
    component: '',
    perms: '',
    menu_type: row ? (row.menu_type === 'M' ? 'C' : 'F') : 'M',
    icon: '#',
    sort: 0,
    visible: 1,
    remark: ''
  }
  parentOptions.value = [{ value: 0, label: '顶级目录' }, ...buildParentOptions(menuTree.value)]
  drawerVisible.value = true
}

const onEdit = async (row) => {
  drawerTitle.value = '编辑菜单'
  const res = await menuGetInfoService(row.id)
  formModel.value = { ...res.data.data }
  parentOptions.value = [{ value: 0, label: '顶级目录' }, ...buildParentOptions(menuTree.value)]
  drawerVisible.value = true
}

const onSubmit = async () => {
  await formRef.value.validate()
  // 按钮类型不需要 path 和 component
  if (formModel.value.menu_type === 'F') {
    formModel.value.path = ''
    formModel.value.component = ''
  }
  if (formModel.value.id) {
    await menuUpdateService(formModel.value)
    ElMessage.success('编辑成功')
  } else {
    await menuAddService(formModel.value)
    ElMessage.success('新增成功')
  }
  drawerVisible.value = false
  getTree()
}

// ==================== 删除 ====================
const onDelete = async (row) => {
  await ElMessageBox.confirm('确认删除该菜单？', '提示', { type: 'warning' })
  await menuDeleteService(row.id)
  ElMessage.success('删除成功')
  getTree()
}
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
