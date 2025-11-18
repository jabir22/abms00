CREATE TABLE purchase_items (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  purchase_id BIGINT NOT NULL,
  product_variant_id BIGINT NOT NULL,
  qty DECIMAL(20,4) NOT NULL,
  unit_cost DECIMAL(18,4) NOT NULL,
  line_total DECIMAL(18,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by BIGINT,
  tenant_id BIGINT NOT NULL,
  CONSTRAINT fk_pitems_purchase FOREIGN KEY (purchase_id) REFERENCES purchases(id),
  CONSTRAINT fk_pitems_variant FOREIGN KEY (product_variant_id) REFERENCES product_variants(id)
);
CREATE INDEX idx_pitems_purchase ON purchase_items(purchase_id);
