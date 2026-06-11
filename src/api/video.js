import request from '@/utils/request'
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
