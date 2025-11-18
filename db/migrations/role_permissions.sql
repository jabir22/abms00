-- ✅ role_permissions: রোল অনুযায়ী পারমিশন তালিকা
CREATE TABLE IF NOT EXISTS role_permissions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    role_id BIGINT UNSIGNED NOT NULL,
    permission_name VARCHAR(100) NOT NULL,
    tenant_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_role_permission (role_id, permission_name),
    INDEX idx_role_id (role_id),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_role_tenant_perm (role_id, tenant_id, permission_name),

    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_name) REFERENCES permissions_catalog(name)
);
-- মাইগ্রেট বিদ্যমান পারমিশন ডেটা roles.permissions JSON থেকে role_permissions টেবিলে