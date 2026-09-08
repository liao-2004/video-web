// 验证表是否创建成功
const db = require('./index')

db.query('SHOW TABLES LIKE "bili_%"', (err, results) => {
  if (err) {
    console.error('查询失败:', err.message)
  } else {
    console.log('bili_ 开头的表:')
    results.forEach((r) => console.log(' -', Object.values(r)[0]))
  }
  db.query('SELECT COUNT(*) as cnt FROM bili_menu', (err2, results2) => {
    if (err2) {
      console.log('bili_menu 表不存在或查询失败')
    } else {
      console.log('bili_menu 记录数:', results2[0].cnt)
    }
    db.query('SELECT COUNT(*) as cnt FROM bili_role', (err3, results3) => {
      if (err3) {
        console.log('bili_role 表不存在或查询失败')
      } else {
        console.log('bili_role 记录数:', results3[0].cnt)
      }
      process.exit(0)
    })
  })
})
