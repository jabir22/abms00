CREATE TABLE sales_return_items (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  sales_return_id BIGINT NOT NULL,
  product_variant_id BIGINT NOT NULL,
  qty DECIMAL(20,4) NOT NULL,
  unit_price DECIMAL(18,4) NOT NULL,
  refund_amount DECIMAL(18,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by BIGINT,
  tenant_id BIGINT NOT NULL,
  CONSTRAINT fk_sritems_return FOREIGN KEY (sales_return_id) REFERENCES sales_returns(id),
  CONSTRAINT fk_sritems_variant FOREIGN KEY (product_variant_id) REFERENCES product_variants(id)
);
CREATE INDEX idx_sritems_return ON sales_return_items(sales_return_id);
