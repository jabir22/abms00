-- ✅ প্রতিটি টেন্যান্টের জন্য ডিফল্ট রোল ইনসার্ট
INSERT IGNORE INTO roles (tenant_id, name)
SELECT id, 'owner' FROM tenants
UNION ALL
SELECT id, 'admin' FROM tenants
UNION ALL
SELECT id, 'manager' FROM tenants
UNION ALL
SELECT id, 'user' FROM tenants;
