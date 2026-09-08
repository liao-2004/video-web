-- ============================================================
-- 若依风格权限系统：角色表、菜单表、角色菜单关联表
-- ============================================================

-- 1. 角色表
DROP TABLE IF EXISTS bili_role;
CREATE TABLE bili_role (
  id INT NOT NULL AUTO_INCREMENT COMMENT '角色ID',
  role_name VARCHAR(30) NOT NULL COMMENT '角色名称',
  role_key VARCHAR(100) NOT NULL COMMENT '角色权限字符串',
  sort INT DEFAULT 0 COMMENT '显示顺序',
  status TINYINT DEFAULT 1 COMMENT '状态（0停用 1正常）',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  remark VARCHAR(500) DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色信息表';

-- 2. 菜单权限表
DROP TABLE IF EXISTS bili_menu;
CREATE TABLE bili_menu (
  id INT NOT NULL AUTO_INCREMENT COMMENT '菜单ID',
  parent_id INT DEFAULT 0 COMMENT '父菜单ID',
  menu_name VARCHAR(50) NOT NULL COMMENT '菜单名称',
  path VARCHAR(200) DEFAULT '' COMMENT '路由地址',
  component VARCHAR(255) DEFAULT NULL COMMENT '组件路径',
  perms VARCHAR(100) DEFAULT NULL COMMENT '权限标识',
  menu_type CHAR(1) DEFAULT '' COMMENT '菜单类型（M目录 C菜单 F按钮）',
  icon VARCHAR(100) DEFAULT '#' COMMENT '菜单图标',
  sort INT DEFAULT 0 COMMENT '显示顺序',
  visible TINYINT DEFAULT 1 COMMENT '是否显示（0隐藏 1显示）',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  remark VARCHAR(500) DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='菜单权限表';

-- 3. 角色菜单关联表
DROP TABLE IF EXISTS bili_role_menu;
CREATE TABLE bili_role_menu (
  role_id INT NOT NULL COMMENT '角色ID',
  menu_id INT NOT NULL COMMENT '菜单ID',
  PRIMARY KEY (role_id, menu_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色和菜单关联表';

-- ============================================================
-- 初始化数据
-- ============================================================

-- 角色
INSERT INTO bili_role (id, role_name, role_key, sort, status, remark) VALUES
(1, '管理员', 'admin', 1, 1, '超级管理员，拥有所有权限'),
(2, '普通用户', 'user', 2, 1, '普通用户，仅有视频相关权限');

-- 菜单/权限
-- 视频相关
INSERT INTO bili_menu (id, parent_id, menu_name, path, component, perms, menu_type, icon, sort, visible) VALUES
(1, 0, '视频中心', '/video/userVideo', 'video/userVideo', 'video:list', 'C', 'HomeFilled', 1, 1),
(2, 0, '视频管理', '/video/manage', 'video/VideoManage', 'video:manage', 'C', 'Promotion', 2, 1),
(3, 2, '视频新增', '', '', 'video:add', 'F', '#', 1, 1),
(4, 2, '视频编辑', '', '', 'video:edit', 'F', '#', 2, 1),
(5, 2, '视频删除', '', '', 'video:delete', 'F', '#', 3, 1),
(6, 0, '视频分类', '/video/channel', 'video/VideoChannel', 'video:channel', 'C', 'Management', 3, 1),
(7, 0, '分片上传', '/video/chunk-upload', 'video/ChunkUploadPage', 'video:chunk', 'C', 'Upload', 4, 1),
-- 系统管理
(8, 0, '系统管理', '/system', NULL, '', 'M', 'Setting', 5, 1),
(9, 8, '角色管理', '/system/role', 'system/RoleManage', 'system:role', 'C', 'UserFilled', 1, 1),
(10, 9, '角色新增', '', '', 'system:role:add', 'F', '#', 1, 1),
(11, 9, '角色编辑', '', '', 'system:role:edit', 'F', '#', 2, 1),
(12, 9, '角色删除', '', '', 'system:role:delete', 'F', '#', 3, 1),
(13, 9, '角色分配菜单', '', '', 'system:role:menu', 'F', '#', 4, 1),
(14, 8, '菜单管理', '/system/menu', 'system/MenuManage', 'system:menu', 'C', 'Menu', 2, 1),
(15, 14, '菜单新增', '', '', 'system:menu:add', 'F', '#', 1, 1),
(16, 14, '菜单编辑', '', '', 'system:menu:edit', 'F', '#', 2, 1),
(17, 14, '菜单删除', '', '', 'system:menu:delete', 'F', '#', 3, 1),
-- 个人中心（按钮级权限，菜单仍由前端个人中心渲染）
(18, 0, '个人中心', '/user', NULL, '', 'M', 'UserFilled', 6, 1),
(19, 18, '基本资料', '/user/profile', 'user/UserProfile', 'system:user:profile', 'C', 'User', 1, 1),
(20, 18, '更换头像', '/update/avatar', 'user/UserAvatar', 'system:user:avatar', 'C', 'Crop', 2, 1),
(21, 18, '重置密码', '/update/password', 'user/UserPassword', 'system:user:password', 'C', 'EditPen', 3, 1);

-- 角色菜单关联：管理员拥有所有权限
INSERT INTO bili_role_menu (role_id, menu_id)
SELECT 1, id FROM bili_menu;

-- 普通用户：视频相关权限 + 个人中心（含子菜单）
INSERT INTO bili_role_menu (role_id, menu_id) VALUES
(2, 1), (2, 2), (2, 3), (2, 4), (2, 5), (2, 6), (2, 7),
(2, 18), (2, 19), (2, 20), (2, 21);
