// 分片上传处理函数模块
const fs = require('fs')
const path = require('path')

// 分片临时存放根目录
const CHUNK_DIR = path.join(__dirname, '../uploads/chunks')
// 最终文件存放目录
const UPLOAD_DIR = path.join(__dirname, '../uploads')

// 确保目录存在
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

// 安全化文件名：只保留文件名部分，防止路径遍历
function safeFileName(name) {
  return path.basename(name || 'video')
}

// 获取某个 fileHash 已上传的分片索引数组（已排序）
function getUploadedChunks(fileHash) {
  const chunkDir = path.join(CHUNK_DIR, fileHash)
  if (!fs.existsSync(chunkDir)) return []
  const files = fs.readdirSync(chunkDir)
  return files
    .map((f) => Number(f))
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b)
}

// 初始化分片上传：返回已上传分片列表，供前端断点续传
exports.initChunkUpload = (req, res) => {
  const { fileHash, fileName, fileSize } = req.body
  if (!fileHash) return res.cc('fileHash 不能为空')

  const chunkDir = path.join(CHUNK_DIR, fileHash)
  ensureDir(chunkDir)

  const uploadedChunks = getUploadedChunks(fileHash)
  res.send({
    status: 0,
    message: '初始化成功',
    data: {
      fileHash,
      fileName: safeFileName(fileName),
      fileSize: Number(fileSize) || 0,
      uploadedChunks
    }
  })
}

// 上传单个分片
exports.uploadChunk = (req, res) => {
  if (!req.file) return res.cc('请上传分片文件')
  const { fileHash, chunkIndex } = req.body
  if (!fileHash) return res.cc('fileHash 不能为空')
  if (chunkIndex === undefined || chunkIndex === null) return res.cc('chunkIndex 不能为空')

  const chunkDir = path.join(CHUNK_DIR, fileHash)
  ensureDir(chunkDir)

  // 分片以纯数字命名，便于合并时按序读取
  const targetPath = path.join(chunkDir, String(chunkIndex))
  fs.renameSync(req.file.path, targetPath)

  res.send({
    status: 0,
    message: '分片上传成功',
    data: { chunkIndex: Number(chunkIndex) }
  })
}

// 查询上传状态：断网重连后前端调用，获取已上传分片
exports.getChunkStatus = (req, res) => {
  const { fileHash } = req.query
  if (!fileHash) return res.cc('fileHash 不能为空')

  const uploadedChunks = getUploadedChunks(fileHash)
  res.send({
    status: 0,
    message: '查询成功',
    data: { fileHash, uploadedChunks }
  })
}

// 合并所有分片，生成最终视频文件
exports.mergeChunks = (req, res) => {
  const { fileHash, fileName, totalChunks } = req.body
  if (!fileHash) return res.cc('fileHash 不能为空')
  if (!totalChunks) return res.cc('totalChunks 不能为空')

  const chunkDir = path.join(CHUNK_DIR, fileHash)
  if (!fs.existsSync(chunkDir)) return res.cc('分片目录不存在，请重新上传')

  const uploaded = getUploadedChunks(fileHash)
  const total = Number(totalChunks)
  if (uploaded.length !== total) {
    return res.cc(`分片不完整：已上传 ${uploaded.length}/${total}`)
  }

  // 生成最终文件名：保留原扩展名，加时间戳避免重名
  const ext = path.extname(safeFileName(fileName)) || '.mp4'
  const finalName = `video-chunk-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`
  const finalPath = path.join(UPLOAD_DIR, finalName)

  try {
    // 按索引顺序依次追加写入
    const writeStream = fs.createWriteStream(finalPath)
    for (let i = 0; i < total; i++) {
      const chunkPath = path.join(chunkDir, String(i))
      const data = fs.readFileSync(chunkPath)
      writeStream.write(data)
    }
    writeStream.end()

    writeStream.on('finish', () => {
      // 合并成功后清理临时分片目录
      fs.rmSync(chunkDir, { recursive: true, force: true })
      const url = '/uploads/' + finalName
      res.send({ status: 0, message: '合并成功', url })
    })

    writeStream.on('error', (err) => {
      res.cc('合并文件失败：' + err.message)
    })
  } catch (err) {
    res.cc('合并文件失败：' + err.message)
  }
}
