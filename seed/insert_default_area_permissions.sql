-- ================= Insert Default Area Permissions =================

-- Admin role permissions for all areas
INSERT INTO area_permissions (area_id, role_id, permission_name, can_create, can_read, can_update, can_delete)
SELECT a.id, r.id, 'area_management', 1, 1, 1, 1
FROM areas a
CROSS JOIN roles r
WHERE r.name = 'admin'
ON DUPLICATE KEY UPDATE 
  can_create = 1, can_read = 1, can_update = 1, can_delete = 1;

-- Area Manager permissions for their areas
INSERT INTO area_permissions (area_id, role_id, permission_name, can_create, can_read, can_update, can_delete)
SELECT a.id, r.id, 'area_management', 1, 1, 1, 0
FROM areas a
CROSS JOIN roles r
WHERE r.name = 'area_manager'
ON DUPLICATE KEY UPDATE 
  can_create = 1, can_read = 1, can_update = 1, can_delete = 0;

-- User permissions (read-only)
INSERT INTO area_permissions (area_id, role_id, permission_name, can_create, can_read, can_update, can_delete)
SELECT a.id, r.id, 'area_management', 0, 1, 0, 0
FROM areas a
CROSS JOIN roles r
WHERE r.name = 'user'
ON DUPLICATE KEY UPDATE 
  can_create = 0, can_read = 1, can_update = 0, can_delete = 0;
