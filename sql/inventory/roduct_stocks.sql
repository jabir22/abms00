CREATE TABLE product_stocks (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  product_variant_id BIGINT NOT NULL,
  location_id INT NULL,
  quantity DECIMAL(20,4) DEFAULT 0,
  reserved_quantity DECIMAL(20,4) DEFAULT 0,
  cost_average DECIMAL(18,4) DEFAULT 0,
  created_by BIGINT,
  updated_by BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  tenant_id BIGINT NOT NULL,
  CONSTRAINT fk_stock_variant FOREIGN KEY (product_variant_id) REFERENCES product_variants(id)
);
CREATE INDEX idx_stock_variant ON product_stocks(product_variant_id);
CREATE INDEX idx_stock_tenant ON product_stocks(tenant_id);
