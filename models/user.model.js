import db from '../config/db.js'; // ✅ সঠিক

export const findUserByPhone = async (phone) => {
  const [rows] = await db.query(
    'SELECT id FROM users WHERE phone = ? LIMIT 1',
    [phone]
  );
  return rows;
};

export const insertUser = async ({
  uuid,
  owner_id,
  role_id,
  name, // This will go into name_en
  email,
  phone,
  password_hash,
  tenant_id,
}) => {
  const [result] = await db.query(
    `INSERT INTO users (uuid, owner_id, role_id, name_en, email, phone, password_hash, tenant_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [uuid, owner_id, role_id, name, email, phone, password_hash, tenant_id]
  );
  return result.insertId;
};
