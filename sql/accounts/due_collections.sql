CREATE TABLE due_collections (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  collection_no VARCHAR(100),
  customer_id BIGINT,
  amount DECIMAL(18,2) NOT NULL,
  collected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by BIGINT,
  tenant_id BIGINT NOT NULL,
  CONSTRAINT fk_duecoll_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
);
CREATE INDEX idx_duecoll_customer ON due_collections(customer_id);
