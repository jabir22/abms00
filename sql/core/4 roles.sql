CREATE TABLE roles (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSON DEFAULT NULL,
    created_by BIGINT UNSIGNED,
    updated_by BIGINT UNSIGNED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    tenant_id BIGINT UNSIGNED NOT NULL,
    CONSTRAINT uq_roles_tenant_slug UNIQUE (tenant_id, slug),
    CONSTRAINT fk_roles_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);
CREATE INDEX idx_roles_tenant ON roles(tenant_id);
CREATE INDEX idx_roles_name ON roles(name);
CREATE INDEX idx_roles_slug ON roles(slug);