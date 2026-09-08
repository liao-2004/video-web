// 执行权限系统初始化 SQL（支持多语句）
const fs = require('fs')
const path = require('path')
const mysql = require('mysql')

// 创建支持多语句的连接
const db = mysql.createPool({
  host: '127.0.0.1',
  user: 'root',
  password: '123456',
  database: 'my_db_01',
  multipleStatements: true
})

const sql = fs.readFileSync(path.join(__dirname, 'init_permission.sql'), 'utf8')

db.query(sql, (err, results) => {
  if (err) {
    console.error('执行失败:', err.message)
    process.exit(1)
  }
  console.log('SQL 执行成功！')

  // 验证数据
  db.query('SELECT COUNT(*) as cnt FROM bili_role', (err1, r1) => {
    if (!err1) console.log('角色数:', r1[0].cnt)
    db.query('SELECT COUNT(*) as cnt FROM bili_menu', (err2, r2) => {
      if (!err2) console.log('菜单数:', r2[0].cnt)
      db.query('SELECT COUNT(*) as cnt FROM bili_role_menu', (err3, r3) => {
        if (!err3) console.log('角色菜单关联数:', r3[0].cnt)
        process.exit(0)
      })
    })
  })
})
