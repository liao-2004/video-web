
const db = require('../db/index')


function getUserPermissions(userId, callback) {
  const sql = `
    SELECT DISTINCT m.perms
    FROM bilibili_user u
    JOIN bili_role r ON r.id = u.role
    JOIN bili_role_menu rm ON rm.role_id = r.id
    JOIN bili_menu m ON m.id = rm.menu_id
    WHERE u.id = ? AND m.perms IS NOT NULL AND m.perms != ''
  `
  db.query(sql, userId, (err, results) => {
    if (err) return callback(err)
    const perms = results.map((r) => r.perms).filter(Boolean)
    callback(null, perms)
  })
}

function checkPermi(...permissions) {
  return (req, res, next) => {
    if (req.user && req.user.role === 1) {
      return next()
    }

    getUserPermissions(req.user.id, (err, userPerms) => {
      if (err) return res.cc('权限查询失败')
      const hasPermission = permissions.some((p) => userPerms.includes(p))
      if (!hasPermission) {
        return res.cc('没有操作权限', 403)
      }
      next()
    })
  }
}

module.exports = {
  checkPermi,
  getUserPermissions
}
