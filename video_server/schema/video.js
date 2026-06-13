const joi = require('joi')

// 分别定义 标题、分类Id、内容、发布状态、视频地址的校验规则
const title = joi.string().required()
const cate_id = joi.number().integer().min(1).required()
const content = joi.string().required().allow('')
const state = joi.string().valid('已发布', '草稿').required()
// 视频地址：上传到后端 uploads 目录后返回的相对路径（如 /uploads/video-xxx.mp4），可为空
const video_url = joi.string().allow('').optional()

// 验证规则对象 - 发布文章
exports.add_article_schema = {
  body: {
    title,
    cate_id,
    content,
    state,
    video_url,
  },
}
