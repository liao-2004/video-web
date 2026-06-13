// 文章的处理函数模块
const path = require('path')
const db = require('../db/index')

// 统一的视频列表查询：根据筛选条件动态拼装【参数化】SQL，避免 SQL 注入与逻辑重复
// extraWhere/extraParams 供管理端按作者过滤使用
function queryVideoList({ pagenum, pagesize, cate_id, state, extraWhere, extraParams }, callback) {
  const offset = (Number(pagenum) - 1) * Number(pagesize)
  const conditions = ['v.is_delete = 0']
  const params = []

  if (cate_id) {
    conditions.push('v.cate_id = ?')
    params.push(cate_id)
  }
  if (state) {
    conditions.push('v.state = ?')
    params.push(state)
  }
  if (extraWhere) {
    conditions.push(extraWhere)
    params.push(...extraParams)
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`
  const listSql =
    'SELECT v.*, u.username, u.nickname ' +
    'FROM bili_videos v LEFT JOIN bilibili_user u ON v.author_id = u.id ' +
    `${whereClause} ORDER BY v.pub_date DESC LIMIT ?, ?`
  const totalSql = `SELECT COUNT(*) AS total FROM bili_videos v ${whereClause}`

  db.query(listSql, [...params, offset, Number(pagesize)], (err, results) => {
    if (err) return callback(err)
    db.query(totalSql, params, (err2, totalRes) => {
      if (err2) return callback(err2)
      callback(null, { data: results, total: totalRes[0].total })
    })
  })
}

// 上传视频文件的处理函数：保存到 uploads 目录，返回可访问的相对地址
exports.uploadVideo = (req, res) => {
  if (!req.file) return res.cc('请选择视频文件！')
  // 用正斜杠拼接，保证 Windows/Linux 下地址一致
  const url = '/uploads/' + req.file.filename
  res.send({ status: 0, message: '上传成功', url })
}

// 发布文章的处理函数
exports.addArticle = (req, res) => {
  if (!req.file || req.file.fieldname !== 'cover_img') return res.cc('文章封面是必选参数！')

  // 处理文章的信息对象：标题、内容、发布状态、所属分类的 Id 来自 req.body
  const articleInfo = {
    ...req.body,
    cover_img: path.join('/uploads', req.file.filename), // 文章封面的存放路径
    video_url: req.body.video_url || '', // 视频文件地址（上传到 uploads 后的相对路径）
    pub_date: new Date(), // 文章的发布时间
    author_id: req.user.id, // 文章作者的 Id
    is_delete: 0 // 文章状态
  }

  const sql = `insert into bili_videos set ?`
  db.query(sql, articleInfo, (err, results) => {
    if (err) return res.cc(err)
    if (results.affectedRows !== 1) return res.cc('发布新文章失败！')
    res.cc('发布文章成功！', 0)
  })
}

// 获取文章列表函数（C 端：展示所有作者的视频）
exports.getVideoList = (req, res) => {
  queryVideoList(req.query, (err, result) => {
    if (err) return res.cc(err)
    res.send({ status: 0, ...result })
  })
}

// 获取视频管理列表（管理端：管理员看全部，普通用户只看自己的）
exports.getVideoManageList = (req, res) => {
  const options = { ...req.query }
  if (req.user.role != 1) {
    options.extraWhere = 'v.author_id = ?'
    options.extraParams = [req.user.id]
  }
  queryVideoList(options, (err, result) => {
    if (err) return res.cc(err)
    res.send({ status: 0, ...result })
  })
}

exports.getVideoInfo = (req, res) => {
  const sql = 'select * from bili_videos where id=?'
  db.query(sql, req.query.id, (err, results) => {
    if (err) return res.cc(err)
    res.send({
      status: 0,
      data: results
    })
  })
}

exports.putVideoInfo = (req, res) => {
  if (!req.file || req.file.fieldname !== 'cover_img') return res.cc('文章封面是必选参数！')
  const articleInfo = {
    ...req.body,
    cover_img: path.join('/uploads', req.file.filename)
  }

  const sql = `UPDATE bili_videos
              SET
                title = ?,
                content = ?,
                cover_img=?,
                video_url=?,
                pub_date=?,
                state = ?,
                cate_id = ?
              WHERE id = ?;`
  const videoInfo = [
    articleInfo.title,
    articleInfo.content,
    articleInfo.cover_img,
    articleInfo.video_url || '',
    new Date(),
    articleInfo.state,
    articleInfo.cate_id,
    articleInfo.id
  ]
  db.query(sql, videoInfo, (err, results) => {
    if (err) return res.cc(err)
    if (results.affectedRows !== 1) return res.cc('修改新文章失败！')
    res.cc('修改文章成功！', 0)
  })
}

exports.deleteVideoInfo = (req, res) => {
  const sql = 'UPDATE bili_videos SET is_delete = 1 WHERE id = ?;'
  db.query(sql, req.query.id, (err, results) => {
    if (err) return res.cc(err)
    if (results.affectedRows !== 1) return res.cc('删除文章失败！')
    res.send({ status: 0 })
  })
}
