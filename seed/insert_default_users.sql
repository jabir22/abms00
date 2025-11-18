-- ✅ Default ইউজার ইনসার্ট (পাসওয়ার্ড hash করতে backend ব্যবহার করুন)
INSERT IGNORE INTO users (tenant_id, name, email, password_hash)
SELECT id, 'Owner User', 'owner@example.com', '$2b$10$hashedpassword' FROM tenants
UNION ALL
SELECT id, 'Admin User', 'admin@example.com', '$2b$10$hashedpassword' FROM tenants
UNION ALL
SELECT id, 'Manager User', 'manager@example.com', '$2b$10$hashedpassword' FROM tenants
UNION ALL
SELECT id, 'Normal User', 'user@example.com', '$2b$10$hashedpassword' FROM tenants;
