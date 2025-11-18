CREATE TABLE purchases (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  bill_no VARCHAR(100) NOT NULL,
  supplier_id BIGINT NULL,
  date DATE NOT NULL,
  total_amount DECIMAL(18,2) NOT NULL,
  tax DECIMAL(18,2) DEFAULT 0,
  paid_amount DECIMAL(18,2) DEFAULT 0,
  status ENUM('DRAFT','RECEIVED','CANCELLED') DEFAULT 'DRAFT',
  created_by BIGINT,
  updated_by BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  tenant_id BIGINT NOT NULL,
  CONSTRAINT fk_purchases_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  CONSTRAINT uq_purchases_tenant_billno UNIQUE (tenant_id, bill_no)
);
CREATE INDEX idx_purchases_tenant ON purchases(tenant_id);
