
const db = require('../db/index')

exports.getRoleList = (req, res) => {
  const { pagenum = 1, pagesize = 10, role_name, status } = req.query
  const offset = (Number(pagenum) - 1) * Number(pagesize)
  const conditions = []
  const params = []
  if (role_name) {
    conditions.push('role_name LIKE ?')
    params.push(`%${role_name}%`)
  }
  if (status !== undefined && status !== '') {
    conditions.push('status = ?')
    params.push(status)
  }
  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''
  const listSql = `SELECT * FROM bili_role ${where} ORDER BY sort LIMIT ?, ?`
  const totalSql = `SELECT COUNT(*) as total FROM bili_role ${where}`

  db.query(listSql, [...params, offset, Number(pagesize)], (err, results) => {
    if (err) return res.cc(err)
    db.query(totalSql, params, (err2, totalRes) => {
      if (err2) return res.cc(err2)
      res.send({ status: 0, data: results, total: totalRes[0].total })
    })
  })
}

exports.getAllRoles = (req, res) => {
  const sql = 'SELECT id, role_name, role_key FROM bili_role WHERE status = 1 ORDER BY sort'
  db.query(sql, (err, results) => {
    if (err) return res.cc(err)
    res.send({ status: 0, data: results })
  })
}

exports.getRoleById = (req, res) => {
  const sql = 'SELECT * FROM bili_role WHERE id = ?'
  db.query(sql, req.query.id, (err, results) => {
    if (err) return res.cc(err)
    if (results.length !== 1) return res.cc('角色不存在')
    const menuSql = 'SELECT menu_id FROM bili_role_menu WHERE role_id = ?'
    db.query(menuSql, req.query.id, (err2, menuResults) => {
      if (err2) return res.cc(err2)
      const menuIds = menuResults.map((r) => r.menu_id)
      res.send({ status: 0, data: { ...results[0], menuIds } })
    })
  })
}

exports.addRole = (req, res) => {
  const { role_name, role_key, sort = 0, status = 1, remark = '' } = req.body
  if (!role_name || !role_key) return res.cc('角色名称和权限字符不能为空')

  const checkSql = 'SELECT id FROM bili_role WHERE role_name = ?'
  db.query(checkSql, role_name, (err, results) => {
    if (err) return res.cc(err)
    if (results.length > 0) return res.cc('角色名称已存在')

    const sql = 'INSERT INTO bili_role (role_name, role_key, sort, status, remark) VALUES (?, ?, ?, ?, ?)'
    db.query(sql, [role_name, role_key, sort, status, remark], (err2, results2) => {
      if (err2) return res.cc(err2)
      if (results2.affectedRows !== 1) return res.cc('新增角色失败')
      res.cc('新增角色成功', 0)
    })
  })
}

exports.updateRole = (req, res) => {
  const { id, role_name, role_key, sort, status, remark } = req.body
  if (!id) return res.cc('角色ID不能为空')

  const sql = 'UPDATE bili_role SET role_name = ?, role_key = ?, sort = ?, status = ?, remark = ? WHERE id = ?'
  db.query(sql, [role_name, role_key, sort, status, remark, id], (err, results) => {
    if (err) return res.cc(err)
    if (results.affectedRows !== 1) return res.cc('编辑角色失败')
    res.cc('编辑角色成功', 0)
  })
}

exports.deleteRole = (req, res) => {
  const id = req.query.id
  if (id === 1) return res.cc('管理员角色不可删除')

  const checkSql = 'SELECT COUNT(*) as cnt FROM bilibili_user WHERE role = ?'
  db.query(checkSql, id, (err, results) => {
    if (err) return res.cc(err)
    if (results[0].cnt > 0) return res.cc('该角色下还有用户，无法删除')

    const delSql = 'DELETE FROM bili_role WHERE id = ?'
    db.query(delSql, id, (err2, results2) => {
      if (err2) return res.cc(err2)
      if (results2.affectedRows !== 1) return res.cc('删除角色失败')
      const delRelSql = 'DELETE FROM bili_role_menu WHERE role_id = ?'
      db.query(delRelSql, id, () => {
        res.cc('删除角色成功', 0)
      })
    })
  })
}

exports.assignMenus = (req, res) => {
  const { role_id, menu_ids } = req.body
  if (!role_id || !Array.isArray(menu_ids)) return res.cc('参数错误')

  const delSql = 'DELETE FROM bili_role_menu WHERE role_id = ?'
  db.query(delSql, role_id, (err) => {
    if (err) return res.cc(err)
    if (menu_ids.length === 0) {
      return res.cc('分配菜单成功', 0)
    }
    const values = menu_ids.map((mid) => `(${role_id}, ${mid})`).join(', ')
    const insertSql = `INSERT INTO bili_role_menu (role_id, menu_id) VALUES ${values}`
    db.query(insertSql, (err2) => {
      if (err2) return res.cc(err2)
      res.cc('分配菜单成功', 0)
    })
  })
}
