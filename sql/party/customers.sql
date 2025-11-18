CREATE TABLE customers (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(100),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  credit_limit DECIMAL(18,2) DEFAULT 0,
  loyalty_points BIGINT DEFAULT 0,
  created_by BIGINT,
  updated_by BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  tenant_id BIGINT NOT NULL,
  CONSTRAINT uq_customers_tenant_code UNIQUE (tenant_id, code)
);
CREATE INDEX idx_customers_tenant ON customers(tenant_id);
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_customers_email ON customers(email); 
