CREATE TABLE sales_returns (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  return_no VARCHAR(100) NOT NULL,
  sale_id BIGINT NULL,
  customer_id BIGINT NULL,
  date DATE NOT NULL,
  total_refund DECIMAL(18,2) NOT NULL,
  status ENUM('DRAFT','COMPLETED','CANCELLED') DEFAULT 'DRAFT',
  created_by BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  tenant_id BIGINT NOT NULL,
  CONSTRAINT fk_returns_sale FOREIGN KEY (sale_id) REFERENCES sales(id),
  CONSTRAINT fk_returns_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
  CONSTRAINT uq_salesreturns_tenant_returnno UNIQUE (tenant_id, return_no)
);
CREATE INDEX idx_salesreturns_tenant ON sales_returns(tenant_id);
