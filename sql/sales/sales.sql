CREATE TABLE sales (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  invoice_no VARCHAR(100) NOT NULL,
  customer_id BIGINT NULL,
  date DATE NOT NULL,
  total_amount DECIMAL(18,2) NOT NULL,
  discount DECIMAL(18,2) DEFAULT 0,
  tax DECIMAL(18,2) DEFAULT 0,
  paid_amount DECIMAL(18,2) DEFAULT 0,
  status ENUM('DRAFT','POSTED','CANCELLED') DEFAULT 'DRAFT',
  created_by BIGINT,
  updated_by BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  tenant_id BIGINT NOT NULL,
  CONSTRAINT fk_sales_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
  CONSTRAINT uq_sales_tenant_invoice UNIQUE (tenant_id, invoice_no)
);
CREATE INDEX idx_sales_tenant ON sales(tenant_id);
CREATE INDEX idx_sales_date ON sales(date);
