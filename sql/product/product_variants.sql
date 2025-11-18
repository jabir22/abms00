CREATE TABLE product_variants (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  product_id BIGINT NOT NULL,
  sku VARCHAR(100),
  barcode VARCHAR(100),
  variant_spec JSON DEFAULT NULL,
  price DECIMAL(15,2) DEFAULT 0.00,
  cost DECIMAL(15,2) DEFAULT 0.00,
  created_by BIGINT,
  updated_by BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  tenant_id BIGINT NOT NULL,
  CONSTRAINT fk_variant_product FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT uq_variant_tenant_sku UNIQUE (tenant_id, sku)
);
CREATE INDEX idx_variant_product ON product_variants(product_id);
CREATE INDEX idx_variant_tenant ON product_variants(tenant_id);
