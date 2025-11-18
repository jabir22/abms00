CREATE TABLE sale_items (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  sale_id BIGINT NOT NULL,
  product_variant_id BIGINT NOT NULL,
  qty DECIMAL(20,4) NOT NULL,
  unit_price DECIMAL(18,4) NOT NULL,
  discount DECIMAL(18,4) DEFAULT 0,
  tax DECIMAL(18,4) DEFAULT 0,
  line_total DECIMAL(18,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by BIGINT,
  tenant_id BIGINT NOT NULL,
  CONSTRAINT fk_saleitems_sale FOREIGN KEY (sale_id) REFERENCES sales(id),
  CONSTRAINT fk_saleitems_variant FOREIGN KEY (product_variant_id) REFERENCES product_variants(id)
);
CREATE INDEX idx_saleitems_sale ON sale_items(sale_id);
