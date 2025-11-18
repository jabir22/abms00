-- ✅ owner রোল: সব পারমিশন
INSERT IGNORE INTO role_permissions (role_id, permission_name, tenant_id)
SELECT r.id, p.name, r.tenant_id
FROM roles r
JOIN permissions_catalog p
WHERE r.name = 'owner';

-- ✅ admin রোল: নির্দিষ্ট পারমিশন
INSERT IGNORE INTO role_permissions (role_id, permission_name, tenant_id)
SELECT r.id, p.name, r.tenant_id
FROM roles r
JOIN permissions_catalog p
WHERE r.name = 'admin'
  AND p.name IN (
    'view_profile','edit_profile','view_all_profiles',
    'create_user','edit_user','view_users',
    'view_reports','manage_content','view_logs'
  );

-- ✅ manager রোল: সীমিত পারমিশন
INSERT IGNORE INTO role_permissions (role_id, permission_name, tenant_id)
SELECT r.id, p.name, r.tenant_id
FROM roles r
JOIN permissions_catalog p
WHERE r.name = 'manager'
  AND p.name IN (
    'view_profile','edit_profile','view_users',
    'view_reports','manage_content'
  );

-- ✅ user রোল: শুধুমাত্র নিজের প্রোফাইল
INSERT IGNORE INTO role_permissions (role_id, permission_name, tenant_id)
SELECT r.id, p.name, r.tenant_id
FROM roles r
JOIN permissions_catalog p
WHERE r.name = 'user'
  AND p.name IN ('view_profile','edit_profile');
