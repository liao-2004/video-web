import request from '@/utils/request'

// ==================== 角色管理 ====================

// 获取角色列表
export const roleGetListService = (params) =>
  request.get('/my/role/list', { params })

// 获取所有角色（下拉选择）
export const roleGetAllService = () => request.get('/my/role/all')

// 获取角色详情
export const roleGetInfoService = (id) =>
  request.get('/my/role/info', { params: { id } })

// 新增角色
export const roleAddService = (data) => request.post('/my/role/add', data)

// 编辑角色
export const roleUpdateService = (data) => request.put('/my/role/info', data)

// 删除角色
export const roleDeleteService = (id) =>
  request.delete('/my/role/info', { params: { id } })

// 角色分配菜单
export const roleAssignMenusService = (data) =>
  request.put('/my/role/assignMenus', data)

// ==================== 菜单管理 ====================

// 获取菜单列表（树形）
export const menuGetTreeService = () => request.get('/my/menu/list')

// 获取当前用户的菜单树（用于动态路由）
export const menuGetUserTreeService = () => request.get('/my/menu/userMenu')

// 获取菜单详情
export const menuGetInfoService = (id) =>
  request.get('/my/menu/info', { params: { id } })

// 新增菜单
export const menuAddService = (data) => request.post('/my/menu/add', data)

// 编辑菜单
export const menuUpdateService = (data) => request.put('/my/menu/info', data)

// 删除菜单
export const menuDeleteService = (id) =>
  request.delete('/my/menu/info', { params: { id } })
