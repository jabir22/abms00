import db from '../config/db.js';

async function listRoles() {
  try {
    const [rows] = await db.query(`
            SELECT r.id, r.name AS role_name, r.slug, r.description,
              r.created_by AS created_by_id, u.name_en AS created_by_name,
             r.tenant_id, t.name AS tenant_name, r.created_at
      FROM roles r
      LEFT JOIN users u ON r.created_by = u.id
      LEFT JOIN tenants t ON r.tenant_id = t.id
      ORDER BY r.id DESC
    `);

    if (!rows.length) {
      console.log('No roles found');
      process.exit(0);
    }

    console.table(rows);
    process.exit(0);
  } catch (err) {
    console.error('Error listing roles:', err.message || err);
    process.exit(1);
  }
}

listRoles();
