CREATE TABLE payments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  payment_no VARCHAR(100) NOT NULL,
  pay_type ENUM('SALE','PURCHASE','EXPENSE','COLLECTION') NOT NULL,
  reference_id BIGINT NULL,
  amount DECIMAL(18,2) NOT NULL,
  method VARCHAR(50),
  account VARCHAR(100),
  paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by BIGINT,
  tenant_id BIGINT NOT NULL,
  CONSTRAINT uq_payments_tenant_no UNIQUE (tenant_id, payment_no)
);
CREATE INDEX idx_payments_tenant ON payments(tenant_id);
CREATE INDEX idx_payments_reference ON payments(reference_id);
