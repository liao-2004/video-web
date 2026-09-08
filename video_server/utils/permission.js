// 权限校验中间件：检查当前用户是否拥有指定权限标识
const db = require('../db/index')

// 根据用户ID查询其所有权限标识
function getUserPermissions(userId, callback) {
  // 用户 -> 角色 -> 角色菜单关联 -> 菜单权限标识
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

// 中间件工厂：检查是否拥有指定权限（支持多个，满足其一即可）
function checkPermi(...permissions) {
  return (req, res, next) => {
    // 管理员（role=1）拥有所有权限
    if (req.user && req.user.role === 1) {
      return next()
    }

    getUserPermissions(req.user.id, (err, userPerms) => {
      if (err) return res.cc('权限查询失败')
      // 检查是否拥有所需权限中的任意一个
      const hasPermission = permissions.some((p) => userPerms.includes(p))
      if (!hasPermission) {
        return res.cc('没有操作权限', 403)
      }
      next()
    })
  }
}

// 导出工具函数供其他模块使用
module.exports = {
  checkPermi,
  getUserPermissions
}
