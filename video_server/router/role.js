// 角色管理路由
const express = require('express')
const router = express.Router()
const roleHandler = require('../router_handler/role')
const { checkPermi } = require('../utils/permission')

// 获取角色列表
router.get('/list', checkPermi('system:role'), roleHandler.getRoleList)

// 获取所有角色（下拉选择）
router.get('/all', roleHandler.getAllRoles)

// 获取角色详情
router.get('/info', checkPermi('system:role'), roleHandler.getRoleById)

// 新增角色
router.post('/add', checkPermi('system:role:add'), roleHandler.addRole)

// 编辑角色
router.put('/info', checkPermi('system:role:edit'), roleHandler.updateRole)

// 删除角色
router.delete('/info', checkPermi('system:role:delete'), roleHandler.deleteRole)

// 角色分配菜单
router.put('/assignMenus', checkPermi('system:role:menu'), roleHandler.assignMenus)

module.exports = router
