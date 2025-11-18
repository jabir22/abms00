-- ✅ role_versions: রোলের পরিবর্তনের ইতিহাস
CREATE TABLE IF NOT EXISTS role_versions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    role_id BIGINT UNSIGNED NOT NULL,
    version INT UNSIGNED NOT NULL,
    changes TEXT,
    changed_by BIGINT UNSIGNED,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
);
