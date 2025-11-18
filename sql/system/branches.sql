CREATE TABLE branches (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(100),
  name VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(50),
  created_by BIGINT,
  updated_by BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  tenant_id BIGINT NOT NULL,
  CONSTRAINT uq_branches_tenant_code UNIQUE (tenant_id, code)
);
CREATE INDEX idx_branches_tenant ON branches(tenant_id);
