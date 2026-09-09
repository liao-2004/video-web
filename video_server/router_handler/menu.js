
const db = require('../db/index')


exports.getMenuTree = (req, res) => {
  const sql = 'SELECT * FROM bili_menu ORDER BY sort, id'
  db.query(sql, (err, results) => {
    if (err) return res.cc(err)
    // 构建树形结构
    const tree = buildTree(results)
    res.send({ status: 0, data: tree })
  })
}

exports.getUserMenuTree = (req, res) => {
  const userId = req.user.id
  const sql = `
    SELECT DISTINCT m.*
    FROM bili_menu m
    JOIN bili_role_menu rm ON rm.menu_id = m.id
    JOIN bilibili_user u ON u.role = rm.role_id
    WHERE u.id = ? AND m.visible = 1 AND m.menu_type IN ('M', 'C')
    ORDER BY m.sort, m.id
  `
  db.query(sql, userId, (err, results) => {
    if (err) return res.cc(err)

    const allMenus = [...results]
    const menuIdSet = new Set(results.map((m) => m.id))
    const parentIdsToFetch = results
      .map((m) => m.parent_id)
      .filter((id) => id !== 0 && !menuIdSet.has(id))

    function fetchParents(ids, done) {
      if (ids.length === 0) return done()
      const placeholders = ids.map(() => '?').join(',')
      const pSql = `SELECT * FROM bili_menu WHERE id IN (${placeholders}) AND visible = 1`
      db.query(pSql, ids, (err2, parents) => {
        if (err2) return done()
        const nextIds = []
        parents.forEach((p) => {
          if (!menuIdSet.has(p.id)) {
            menuIdSet.add(p.id)
            allMenus.push(p)
            if (p.parent_id !== 0 && !menuIdSet.has(p.parent_id)) {
              nextIds.push(p.parent_id)
            }
          }
        })
        fetchParents(nextIds, done)
      })
    }

    fetchParents(parentIdsToFetch, () => {
      const tree = buildTree(allMenus)
      res.send({ status: 0, data: tree })
    })
  })
}

exports.getMenuById = (req, res) => {
  const sql = 'SELECT * FROM bili_menu WHERE id = ?'
  db.query(sql, req.query.id, (err, results) => {
    if (err) return res.cc(err)
    if (results.length !== 1) return res.cc('菜单不存在')
    res.send({ status: 0, data: results[0] })
  })
}

exports.addMenu = (req, res) => {
  const menu = req.body
  const sql = 'INSERT INTO bili_menu SET ?'
  db.query(sql, menu, (err, results) => {
    if (err) return res.cc(err)
    if (results.affectedRows !== 1) return res.cc('新增菜单失败')
    res.cc('新增菜单成功', 0)
  })
}

exports.updateMenu = (req, res) => {
  const { id, ...menu } = req.body
  const sql = 'UPDATE bili_menu SET ? WHERE id = ?'
  db.query(sql, [menu, id], (err, results) => {
    if (err) return res.cc(err)
    if (results.affectedRows !== 1) return res.cc('编辑菜单失败')
    res.cc('编辑菜单成功', 0)
  })
}


exports.deleteMenu = (req, res) => {
  const id = req.query.id
  const checkSql = 'SELECT COUNT(*) as cnt FROM bili_menu WHERE parent_id = ?'
  db.query(checkSql, id, (err, results) => {
    if (err) return res.cc(err)
    if (results[0].cnt > 0) return res.cc('存在子菜单，无法删除')
    const delSql = 'DELETE FROM bili_menu WHERE id = ?'
    db.query(delSql, id, (err2, results2) => {
      if (err2) return res.cc(err2)
      if (results2.affectedRows !== 1) return res.cc('删除菜单失败')
      const delRelSql = 'DELETE FROM bili_role_menu WHERE menu_id = ?'
      db.query(delRelSql, id, () => {
        res.cc('删除菜单成功', 0)
      })
    })
  })
}

function buildTree(menus) {
  const map = {}
  const roots = []
  menus.forEach((m) => {
    map[m.id] = { ...m, children: [] }
  })
  menus.forEach((m) => {
    const node = map[m.id]
    if (m.parent_id === 0 || !map[m.parent_id]) {
      roots.push(node)
    } else {
      map[m.parent_id].children.push(node)
    }
  })
  function clean(node) {
    if (node.children.length === 0) {
      delete node.children
    } else {
      node.children.forEach(clean)
    }
  }
  roots.forEach(clean)
  return roots
}
