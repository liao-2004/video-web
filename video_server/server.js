// 引入依赖
const express = require('express')
const path = require('path')
const app = express()

// 开放 dist 文件夹（前端打包后的内容）
app.use(express.static(path.join(__dirname, 'dist')))

// 解决前端刷新 404 问题（必加）
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

// 启动端口
const port = 3000
app.listen(port, () => {
  console.log('后端服务已启动:http://localhost:' + port)
})