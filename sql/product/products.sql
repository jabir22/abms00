CREATE TABLE products (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  sku VARCHAR(100) NOT NULL,
  barcode VARCHAR(100),
  name VARCHAR(255) NOT NULL,
  category_id INT NULL,
  description TEXT,
  unit_id INT NOT NULL,
  has_variants BOOLEAN DEFAULT FALSE,
  attributes JSON DEFAULT NULL,
  created_by BIGINT,
  updated_by BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  tenant_id BIGINT NOT NULL,
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id),
  CONSTRAINT uq_products_tenant_sku UNIQUE (tenant_id, sku)
);
CREATE INDEX idx_products_tenant ON products(tenant_id);
CREATE INDEX idx_products_sku ON products(sku);
