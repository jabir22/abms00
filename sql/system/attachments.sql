CREATE TABLE attachments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  entity_type VARCHAR(100),
  entity_id BIGINT,
  file_name VARCHAR(255),
  file_meta JSON,
  storage_path VARCHAR(500),
  uploaded_by BIGINT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  tenant_id BIGINT NOT NULL
);
CREATE INDEX idx_attachments_entity ON attachments(entity_type, entity_id);
