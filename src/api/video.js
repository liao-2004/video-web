import request from '@/utils/request'

// 视频文件：上传到后端 uploads 目录，返回保存后的相对地址 url
// file: 原生 File 对象；onProgress: 上传进度回调 (0~100)
export const videoUploadService = (file, onProgress) => {
  const fd = new FormData()
  fd.append('video', file)
  return request.post('/my/video/upload', fd, {
    timeout: 0, // 视频较大，不限制超时
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }
  })
}
// 分类：获取视频分类
export const artGetChannelsService = () => request.get('/my/cate/cates')
// 分类：添加视频分类
export const artAddChannelService = (data) => request.post('/my/cate/add', data)
// 分类：编辑视频分类
export const artEditChannelService = (data) =>
  request.put('/my/cate/info', data)
// 分类：删除视频分类
export const artDelChannelService = (id) =>
  request.delete('/my/cate/del', {
    params: { id }
  })

// 视频：获取视频列表
export const artGetListService = (params) =>
  request.get('/my/video/list', {
    params
  })
  // 视频：获取视频管理列表
export const artGetListManageService = (params) =>
  request.get('/my/video/listManage', {
    params
  })

// 视频：添加视频
// 注意：data需要是一个formData格式的对象
export const artPublishService = (data) => request.post('/my/video/add', data)

// 视频：获取视频详情
export const artGetDetailService = (id) =>
  request.get('/my/video/info', {
    params: { id }
  })

// 视频：编辑视频接口
export const artEditService = (data) => request.put('/my/video/info', data)

// 视频：删除视频接口
export const artDelService = (id) =>
  request.delete('/my/video/info', { params: { id } })

// ==================== 分片上传（大文件 + 断点续传）====================

// 1. 初始化分片上传，返回已上传的分片索引（用于断点续传）
export const chunkInitService = (data) =>
  request.post('/my/video/chunk/init', data)

// 2. 上传单个分片
// chunk: Blob 分片; fileHash: 文件唯一标识; chunkIndex: 分片索引
// onProgress: 当前分片上传进度回调 (0~100)
export const chunkUploadService = (chunk, fileHash, chunkIndex, onProgress) => {
  const fd = new FormData()
  fd.append('chunk', chunk)
  fd.append('fileHash', fileHash)
  fd.append('chunkIndex', chunkIndex)
  return request.post('/my/video/chunk/upload', fd, {
    timeout: 0,
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }
  })
}

// 3. 查询上传状态（断网重连后调用，获取已上传分片）
export const chunkStatusService = (fileHash) =>
  request.get('/my/video/chunk/status', { params: { fileHash } })

// 4. 合并所有分片，返回最终文件地址
export const chunkMergeService = (data) =>
  request.post('/my/video/chunk/merge', data)
