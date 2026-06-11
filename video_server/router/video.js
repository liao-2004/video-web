// 文章的路由模块

const express = require('express')
const router = express.Router()

// 导入需要的处理函数模块
const article_handler = require('../router_handler/video')

// 导入 multer 和 path
const multer = require('multer')
const path = require('path')

// 创建 multer 的实例
const uploads = multer({ dest: path.join(__dirname, '../uploads') })
// 导入验证数据的中间件
const expressJoi = require('@escook/express-joi')
// 导入需要的验证规则对象
const { add_article_schema } = require('../schema/video')

// 发布文章的路由
router.post('/add', uploads.single('cover_img'), expressJoi(add_article_schema), article_handler.addArticle)
//获取视频列表的路由
router.get('/list',article_handler.getVideoList)
//获取文章管理路由
router.get('/listManage',article_handler.getVideoManageList)
//获得文章详细
router.get('/info',article_handler.getVideoInfo)
//编辑文章接口
router.put('/info',uploads.single('cover_img'),article_handler.putVideoInfo)
//删除文章接口
router.delete('/info',article_handler.deleteVideoInfo)

module.exports = router
