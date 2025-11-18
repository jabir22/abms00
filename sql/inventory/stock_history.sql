CREATE TABLE product_stock_history (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  product_variant_id BIGINT NOT NULL,
  change DECIMAL(20,4) NOT NULL,
  balance DECIMAL(20,4) NOT NULL,
  reference_type VARCHAR(50),
  reference_id BIGINT,
  method ENUM('IN','OUT') NOT NULL,
  cost DECIMAL(18,4) DEFAULT 0,
  note TEXT,
  created_by BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  tenant_id BIGINT NOT NULL,
  CONSTRAINT fk_stockhist_variant FOREIGN KEY (product_variant_id) REFERENCES product_variants(id)
);
CREATE INDEX idx_stockhist_variant ON product_stock_history(product_variant_id);
CREATE INDEX idx_stockhist_tenant ON product_stock_history(tenant_id);
