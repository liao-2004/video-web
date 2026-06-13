// 这是视频分类的路由模块

const express = require('express')
const router = express.Router()

// 导入视频分类的路由处理函数模块
const artCate_handler = require('../router_handler/videocate')

// 导入验证数据的中间件
const expressJoi = require('@escook/express-joi')
// 导入需要的验证规则对象
const { add_cate_schema, delete_cate_schema, get_cate_schema, update_cate_schema } = require('../schema/videocate')

// 获取视频分类列表数据的路由
router.get('/cates', artCate_handler.getArtCates)
// 新增视频分类的路由
router.post('/add', expressJoi(add_cate_schema), artCate_handler.addArticleCates)
// 根据 Id 删除视频分类的路由
router.delete('/del', expressJoi(delete_cate_schema), artCate_handler.deleteCateById)
// 根据 Id 获取视频分类的路由
router.get('/cates/:id', expressJoi(get_cate_schema), artCate_handler.getArtCateById)
// 根据 Id 更新视频分类的路由（前端使用 PUT /my/cate/info）
router.put('/info', expressJoi(update_cate_schema), artCate_handler.updateCateById)

module.exports = router
