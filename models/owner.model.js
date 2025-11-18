import db from '../config/db.js';

// // Ensure owners table exists
// async function ensureOwnersTable() {
//   try {
//     await db.query(`
//       CREATE TABLE IF NOT EXISTS owners (
//         id INT PRIMARY KEY AUTO_INCREMENT,
//         uuid VARCHAR(36) NOT NULL UNIQUE,
//         name VARCHAR(255) NOT NULL,
//         email VARCHAR(255) NOT NULL UNIQUE,
//         phone VARCHAR(20),
//         tenant_id BIGINT NOT NULL,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
//         deleted_at TIMESTAMP NULL,
//         KEY idx_tenant (tenant_id),
//         KEY idx_email (email)
//       ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
//     `);
//   } catch (err) {
//     console.error('Error creating owners table:', err);
//     throw err;
//   }
// }

export const insertOwner = async ({ uuid, name, email, phone, tenant_id }) => {
  // // Ensure table exists before inserting
  // await ensureOwnersTable();
  async function ensureOwnersTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS owners (
      id INT PRIMARY KEY AUTO_INCREMENT,
      uuid VARCHAR(36) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      phone VARCHAR(20),
      tenant_id BIGINT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
}
  const [result] = await db.query(
    `INSERT INTO owners (uuid, name, email, phone, tenant_id)
     VALUES (?, ?, ?, ?, ?)`,
    [uuid, name, email, phone, tenant_id]
  );
  return result.insertId;
};
