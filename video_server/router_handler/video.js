// 文章的处理函数模块
const path = require('path')
const db = require('../db/index')
const { brotliDecompress } = require('zlib')

// 发布文章的处理函数
exports.addArticle = (req, res) => {
  if (!req.file || req.file.fieldname !== 'cover_img') return res.cc('文章封面是必选参数！')

  // TODO：证明数据都是合法的，可以进行后续业务逻辑的处理
  // 处理文章的信息对象
  const articleInfo = {
    // 标题、内容、发布状态、所属分类的Id
    ...req.body,
    // 文章封面的存放路径
    cover_img: path.join('/uploads', req.file.filename),
    // 文章的发布时间
    pub_date: new Date(),
    // 文章作者的Id
    author_id: req.user.id,
    //文章状态
    is_delete:0
  }

  const sql = `insert into bili_videos set ?`
  db.query(sql, articleInfo, (err, results) => {
    if (err) return res.cc(err)
    if (results.affectedRows !== 1) return res.cc('发布新文章失败！')
    res.cc('发布文章成功！', 0)
  })
}

//获取文章列表函数
exports.getVideoList = (req, res) => {
  console.log(req.query.cate_id)
  const { pagenum, pagesize, cate_id, state } = req.query
  const index=(Number(pagenum)-1)*Number(pagesize)
  let sql = 'SELECT v.*, u.username,nickname FROM bili_videos v LEFT JOIN bilibili_user u ON v.author_id = u.id WHERE v.cate_id=? and state=? ORDER BY v.pub_date DESC LIMIT ?, ?'
  let sql_total = 'SELECT COUNT(*) AS total FROM bili_videos WHERE cate_id = ? AND state = ?'
  let data=[cate_id, state,index, Number(pagesize)]
  let data_total=[cate_id, state]
  if(cate_id.length==0&&state.length==0){
    sql = 'SELECT v.*, u.username,nickname FROM bili_videos v LEFT JOIN bilibili_user u ON v.author_id = u.id ORDER BY v.pub_date DESC LIMIT ?, ?'
    sql_total = 'SELECT COUNT(*) AS total FROM bili_videos'
    data=[index, Number(pagesize)]
    data_total=[]
  }else if(cate_id.length!=0){
    sql = 'SELECT v.*, u.username,nickname FROM bili_videos v LEFT JOIN bilibili_user u ON v.author_id = u.id WHERE v.cate_id=? ORDER BY v.pub_date DESC LIMIT ?, ?'
    sql_total = 'SELECT COUNT(*) AS total FROM bili_videos WHERE cate_id = ?'
    data=[cate_id, index, Number(pagesize)]
    data_total=[cate_id]
  }else if(state.length!=0){
    sql = 'SELECT v.*, u.username,nickname FROM bili_videos v LEFT JOIN bilibili_user u ON v.author_id = u.id WHERE v.state=? ORDER BY v.pub_date DESC LIMIT ?, ?'
    sql_total = 'SELECT COUNT(*) AS total FROM bili_videos WHERE state = ?'
    data=[state, index, Number(pagesize)]
    data_total=[state]
  }
  
  db.query(sql,data, (err1, results) => {
    db.query(sql_total,data_total,(err2,results_total)=>{ 
      if(err1||err2){
        req.cc(err1||err2)
      }
      res.send({
        status: 0,
        data: results,
        total:results_total[0].total
      })
    })
    
  })

}

exports.getVideoManageList = (req, res) => {
  const { pagenum, pagesize, cate_id, state } = req.query
  const index=(Number(pagenum)-1)*Number(pagesize)
  let sql = 'SELECT v.*, u.username,nickname FROM bili_videos v LEFT JOIN bilibili_user u ON v.author_id = u.id WHERE v.cate_id=? and state=? ORDER BY v.pub_date DESC LIMIT ?, ?'
  let sql_total = 'SELECT COUNT(*) AS total FROM bili_videos WHERE cate_id = ? AND state = ?'
  if(req.user.role!=1){
    sql = `SELECT v.*, u.username,nickname FROM bili_videos v LEFT JOIN bilibili_user u ON v.author_id = u.id WHERE v.cate_id=? and v. state=? and u.username='${req.user.username}' ORDER BY v.pub_date DESC LIMIT ?, ?`
    sql_total = `SELECT COUNT(*) AS total FROM bili_videos WHERE cate_id = ? AND state = ? and author_id=${req.user.id} `
    
  }
  let data=[cate_id, state,index, Number(pagesize)]
  let data_total=[cate_id, state]
  if(cate_id.length==0&&state.length==0){
    sql = 'SELECT v.*, u.username,nickname FROM bili_videos v LEFT JOIN bilibili_user u ON v.author_id = u.id ORDER BY v.pub_date DESC LIMIT ?, ?'
    sql_total = 'SELECT COUNT(*) AS total FROM bili_videos'
    if(req.user.role!=1){
      sql = `SELECT v.*, u.username,nickname FROM bili_videos v LEFT JOIN bilibili_user u ON v.author_id = u.id where u.username='${req.user.username}'  ORDER BY v.pub_date DESC LIMIT ?, ?`
      sql_total = `SELECT COUNT(*) AS total FROM bili_videos where author_id=${req.user.id}`
    }
    data=[index, Number(pagesize)]
    data_total=[]
  }else if(cate_id.length!=0){
    sql = 'SELECT v.*, u.username,nickname FROM bili_videos v LEFT JOIN bilibili_user u ON v.author_id = u.id WHERE v.cate_id=? ORDER BY v.pub_date DESC LIMIT ?, ?'
    sql_total = 'SELECT COUNT(*) AS total FROM bili_videos WHERE cate_id = ?'
    if(req.user.role!=1){
      sql = `SELECT v.*, u.username,nickname FROM bili_videos v LEFT JOIN bilibili_user u ON v.author_id = u.id WHERE v.cate_id=? and u.username='${req.user.username}' ORDER BY v.pub_date DESC LIMIT ?, ?`
    sql_total = `SELECT COUNT(*) AS total FROM bili_videos WHERE cate_id = ? and author_id=${req.user.id}`
    }
    data=[cate_id, index, Number(pagesize)]
    data_total=[cate_id]
  }else if(state.length!=0){
    sql = 'SELECT v.*, u.username,nickname FROM bili_videos v LEFT JOIN bilibili_user u ON v.author_id = u.id WHERE v.state=? ORDER BY v.pub_date DESC LIMIT ?, ?'
    sql_total = 'SELECT COUNT(*) AS total FROM bili_videos WHERE state = ?'
    if(req.user.role!=1){
      sql = `SELECT v.*, u.username,nickname FROM bili_videos v LEFT JOIN bilibili_user u ON v.author_id = u.id WHERE v.state=? and u.username='${req.user.username}' ORDER BY v.pub_date DESC LIMIT ?, ?`
      sql_total = `SELECT COUNT(*) AS total FROM bili_videos WHERE state = ? and author_id=${req.user.id}`
    }
    data=[state, index, Number(pagesize)]
    data_total=[state]
  }
  
  db.query(sql,data, (err, results) => {
    db.query(sql_total,data_total,(err,results_total)=>{ 
      
      res.send({
        status: 0,
        data: results,
        total:results_total[0].total
      })
    })
  })

}

exports.getVideoInfo=(req,res)=>{
  const id=(req.query.id)
  const sql='select * from bili_videos where id=?'
  db.query(sql,id,(err,results)=>{
    res.send({
      status:0,
      data:results
    })
  })
}
exports.putVideoInfo=(req,res)=>{
  if (!req.file || req.file.fieldname !== 'cover_img') return res.cc('文章封面是必选参数！')
  const articleInfo = {
    ...req.body,
    cover_img: path.join('/uploads', req.file.filename),
  }
  
  const sql = `UPDATE bili_videos 
              SET 
                title = ?,
                content = ?,
                cover_img=?,
                pub_date=?,
                state = ?,
                cate_id = ?
              WHERE id = ?;`
  const videoInfo=[articleInfo.title,articleInfo.content,articleInfo.cover_img,new Date(),articleInfo.state,articleInfo.cate_id,articleInfo.id]
  db.query(sql, videoInfo, (err, results) => {
    if (err) return res.cc(err)
    if (results.affectedRows !== 1) return res.cc('修改新文章失败！')
    res.cc('修改文章成功！', 0)
  })
}
exports.deleteVideoInfo=(req,res)=>{
 const sql_data=req.query.id
 const sql='UPDATE bili_videos SET is_delete = 1 WHERE id = ?;'
 db.query(sql,sql_data,(err,results)=>{
  res.send({
    status:0
  })
 })
}