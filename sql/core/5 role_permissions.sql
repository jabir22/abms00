CREATE TABLE role_permissions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    role_id BIGINT UNSIGNED NOT NULL,
    permission_name VARCHAR(100) NOT NULL,
    tenant_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_role_permission (role_id, permission_name),
    INDEX idx_role_id (role_id),
    INDEX idx_tenant_id (tenant_id),
    CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_role_permissions_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_name) REFERENCES permissions_catalog(name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Migrate existing permissions from roles.permissions JSON to role_permissions table
INSERT IGNORE INTO role_permissions (role_id, permission_name, tenant_id)
SELECT
    r.id AS role_id,
    p.permission_name,
    r.tenant_id
FROM
    roles r
    JOIN JSON_TABLE(
        CASE
            WHEN JSON_VALID(r.permissions) AND JSON_TYPE(r.permissions) = 'ARRAY' THEN r.permissions
            WHEN JSON_VALID(r.permissions) AND JSON_TYPE(r.permissions) = 'STRING' THEN JSON_ARRAY(r.permissions)
            ELSE JSON_ARRAY()
        END,
        '$[*]' COLUMNS (
            permission_name VARCHAR(100) PATH '$'
        )
    ) AS p
WHERE
    r.deleted_at IS NULL;
-- Clean up roles.permissions column after migration
UPDATE roles SET permissions = NULL WHERE permissions IS NOT NULL;
