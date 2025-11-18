-- ================= Areas Table =================
CREATE TABLE IF NOT EXISTS areas (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tenant_id BIGINT UNSIGNED DEFAULT NULL,
  name_bn VARCHAR(255) NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  description_bn TEXT,
  description_en TEXT,
  code VARCHAR(50) DEFAULT NULL,
  region VARCHAR(255) DEFAULT NULL,
  parent_id BIGINT UNSIGNED DEFAULT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_by BIGINT UNSIGNED DEFAULT NULL,
  updated_by BIGINT UNSIGNED DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_area_name_bn (tenant_id, name_bn),
  UNIQUE KEY uq_area_name_en (tenant_id, name_en),
  UNIQUE KEY uq_area_code (tenant_id, code),
  INDEX idx_area_active (is_active),
  INDEX idx_parent_id (parent_id),
  FOREIGN KEY (parent_id) REFERENCES areas(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================= User Areas Assignment Table =================
CREATE TABLE IF NOT EXISTS user_areas (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  area_id BIGINT UNSIGNED NOT NULL,
  assigned_by BIGINT UNSIGNED DEFAULT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_area (user_id, area_id),
  INDEX idx_user_areas (user_id),
  INDEX idx_area_users (area_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================= Area Permissions Table =================
CREATE TABLE IF NOT EXISTS area_permissions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  area_id BIGINT UNSIGNED NOT NULL,
  role_id BIGINT UNSIGNED NOT NULL,
  permission_name VARCHAR(255) NOT NULL,
  can_create TINYINT(1) DEFAULT 0,
  can_read TINYINT(1) DEFAULT 1,
  can_update TINYINT(1) DEFAULT 0,
  can_delete TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_area_role_perm (area_id, role_id, permission_name),
  INDEX idx_area_role (area_id, role_id),
  FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================= Insert Default Areas =================
INSERT INTO areas (name_bn, name_en, description_bn, description_en, code, region, is_active, created_by) VALUES
('ঢাকা', 'Dhaka', 'ঢাকা অঞ্চল', 'Dhaka Region', 'DHA', 'Central', 1, 1),
('চট্টগ্রাম', 'Chittagong', 'চট্টগ্রাম অঞ্চল', 'Chittagong Region', 'CHI', 'East', 1, 1),
('সিলেট', 'Sylhet', 'সিলেট অঞ্চল', 'Sylhet Region', 'SYL', 'North-East', 1, 1),
('রাজশাহী', 'Rajshahi', 'রাজশাহী অঞ্চল', 'Rajshahi Region', 'RAJ', 'North', 1, 1),
('খুলনা', 'Khulna', 'খুলনা অঞ্চল', 'Khulna Region', 'KHU', 'South-West', 1, 1),
('বরিশাল', 'Barisal', 'বরিশাল অঞ্চল', 'Barisal Region', 'BAR', 'South', 1, 1);
