CREATE TABLE suppliers (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(100),
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  created_by BIGINT,
  updated_by BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  tenant_id BIGINT NOT NULL,
  CONSTRAINT uq_suppliers_tenant_code UNIQUE (tenant_id, code)
);
CREATE INDEX idx_suppliers_tenant ON suppliers(tenant_id);
