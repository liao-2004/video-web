// 文章的路由模块

const express = require('express')
const router = express.Router()

// 导入需要的处理函数模块
const article_handler = require('../router_handler/video')

// 导入 multer 和 path
const multer = require('multer')
const path = require('path')

// 创建 multer 的实例（封面图：随机文件名）
const uploads = multer({ dest: path.join(__dirname, '../uploads') })

// 视频专用 multer：保留扩展名，便于 express.static 返回正确 Content-Type 并支持 Range 播放
const videoStorage = multer.diskStorage({
  destination: path.join(__dirname, '../uploads'),
  filename(req, file, cb) {
    const ext = path.extname(file.originalname) || '.mp4'
    cb(null, `video-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`)
  }
})
const videoUpload = multer({
  storage: videoStorage,
  limits: { fileSize: 500 * 1024 * 1024 } // 最大 500MB
})
// 导入验证数据的中间件
const expressJoi = require('@escook/express-joi')
// 导入需要的验证规则对象
const { add_article_schema } = require('../schema/video')

// 发布视频的路由
router.post('/add', uploads.single('cover_img'), expressJoi(add_article_schema), article_handler.addArticle)
// 上传视频文件，返回保存后的地址（前端拿到后随表单一起提交）
router.post('/upload', videoUpload.single('video'), article_handler.uploadVideo)
//获取视频列表的路由
router.get('/list',article_handler.getVideoList)
//获取视频管理路由
router.get('/listManage',article_handler.getVideoManageList)
//获得视频详细
router.get('/info',article_handler.getVideoInfo)
//编辑视频接口
router.put('/info',uploads.single('cover_img'),article_handler.putVideoInfo)
//删除视频接口
router.delete('/info',article_handler.deleteVideoInfo)

module.exports = router
