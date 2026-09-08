// 修复：给普通用户(role_id=2)补上个人中心目录(menu_id=18)的关联
const db = require('./index')

// 先检查是否已存在
db.query('SELECT * FROM bili_role_menu WHERE role_id = 2 AND menu_id = 18', (err, results) => {
  if (err) {
    console.error('查询失败:', err.message)
    process.exit(1)
  }
  if (results.length > 0) {
    console.log('已存在，无需修复')
    process.exit(0)
  }
  // 插入关联
  db.query('INSERT INTO bili_role_menu (role_id, menu_id) VALUES (2, 18)', (err2) => {
    if (err2) {
      console.error('插入失败:', err2.message)
      process.exit(1)
    }
    console.log('修复成功：普通用户已关联个人中心目录(menu_id=18)')
    process.exit(0)
  })
})
