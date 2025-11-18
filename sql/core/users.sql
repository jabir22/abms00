CREATE TABLE users (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    uuid CHAR(36) NOT NULL UNIQUE,
    tenant_id BIGINT UNSIGNED NOT NULL,
    owner_id BIGINT UNSIGNED NULL,
    role_id BIGINT UNSIGNED NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    name_bn VARCHAR(255) DEFAULT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(30) DEFAULT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at DATETIME NULL,
    meta JSON DEFAULT NULL CHECK (JSON_VALID(meta)),
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_users_owner FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT uq_users_tenant_email UNIQUE (tenant_id, email),
    CONSTRAINT uq_users_tenant_phone UNIQUE (tenant_id, phone)
);
-- Indexes for performance
CREATE INDEX idx_users_tenant ON users (tenant_id);
CREATE INDEX idx_users_owner ON users (owner_id);
CREATE INDEX idx_users_role ON users (role_id);
CREATE INDEX idx_users_deleted_at ON users (deleted_at);
CREATE INDEX idx_users_last_login_at ON users (last_login_at);
CREATE INDEX idx_users_name_en ON users (name_en);
CREATE INDEX idx_users_name_bn ON users (name_bn);
CREATE INDEX idx_users_email ON users (email);