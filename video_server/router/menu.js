// 菜单管理路由
const express = require('express')
const router = express.Router()
const menuHandler = require('../router_handler/menu')
const { checkPermi } = require('../utils/permission')

// 获取菜单列表（树形，管理员用）
router.get('/list', checkPermi('system:menu'), menuHandler.getMenuTree)

// 获取当前用户的菜单树（用于前端动态路由，所有登录用户可访问）
router.get('/userMenu', menuHandler.getUserMenuTree)

// 获取菜单详情
router.get('/info', checkPermi('system:menu'), menuHandler.getMenuById)

// 新增菜单
router.post('/add', checkPermi('system:menu:add'), menuHandler.addMenu)

// 编辑菜单
router.put('/info', checkPermi('system:menu:edit'), menuHandler.updateMenu)

// 删除菜单
router.delete('/info', checkPermi('system:menu:delete'), menuHandler.deleteMenu)

module.exports = router
