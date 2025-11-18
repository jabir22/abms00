CREATE TABLE settings (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  key_name VARCHAR(255) NOT NULL,
  value JSON,
  description TEXT,
  tenant_id BIGINT NOT NULL,
  created_by BIGINT,
  updated_by BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_settings_tenant_key UNIQUE (tenant_id, key_name)
);
