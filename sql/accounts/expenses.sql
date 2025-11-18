CREATE TABLE expenses (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  expense_no VARCHAR(100),
  category VARCHAR(100),
  amount DECIMAL(18,2) NOT NULL,
  date DATE,
  note TEXT,
  created_by BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  tenant_id BIGINT NOT NULL
);
CREATE INDEX idx_expenses_tenant ON expenses(tenant_id);
