-- ✅ ইউজারদের রোল অ্যাসাইন
INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON u.tenant_id = r.tenant_id
WHERE 
    (u.name LIKE 'Owner%' AND r.name = 'owner') OR
    (u.name LIKE 'Admin%' AND r.name = 'admin') OR
    (u.name LIKE 'Manager%' AND r.name = 'manager') OR
    (u.name LIKE 'Normal%' AND r.name = 'user');
