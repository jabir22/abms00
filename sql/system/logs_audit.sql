CREATE TABLE logs_audit (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  entity_type VARCHAR(100),
  entity_id BIGINT,
  action VARCHAR(50),
  changes JSON,
  performed_by BIGINT,
  performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  tenant_id BIGINT NOT NULL
);
CREATE INDEX idx_logs_tenant ON logs_audit(tenant_id);
CREATE INDEX idx_logs_entity ON logs_audit(entity_type, entity_id);
