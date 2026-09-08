// 分片上传路由模块（独立于原有 video.js，不修改原有接口）

const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')

const chunkHandler = require('../router_handler/videoChunk')

// 分片临时存储：multer 默认存到 uploads 目录，处理函数中再移动到 chunks 子目录
const chunkUpload = multer({
  dest: path.join(__dirname, '../uploads'),
  limits: { fileSize: 100 * 1024 * 1024 } // 单个分片最大 100MB
})

// 1. 初始化分片上传（返回已上传分片，用于断点续传）
router.post('/init', chunkHandler.initChunkUpload)

// 2. 上传单个分片
router.post('/upload', chunkUpload.single('chunk'), chunkHandler.uploadChunk)

// 3. 查询上传状态（断网重连后调用）
router.get('/status', chunkHandler.getChunkStatus)

// 4. 合并所有分片，生成最终文件
router.post('/merge', chunkHandler.mergeChunks)

module.exports = router
