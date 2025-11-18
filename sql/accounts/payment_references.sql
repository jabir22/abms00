CREATE TABLE payment_references (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  payment_id BIGINT NOT NULL,
  reference_type VARCHAR(50),
  reference_no VARCHAR(100),
  amount DECIMAL(18,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  tenant_id BIGINT NOT NULL,
  CONSTRAINT fk_pref_payment FOREIGN KEY (payment_id) REFERENCES payments(id)
);
CREATE INDEX idx_pref_payment ON payment_references(payment_id);
