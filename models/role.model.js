import db from '../config/db.js';

export const insertRole = async ({
  name,
  slug,
  description,
  permissions = [],
  created_by,
  tenant_id
}) => {

  if (!tenant_id) throw new Error("tenant_id is required");

  // Defensive: allow permissions to be passed as a JSON string (e.g. from older callers)
  if (typeof permissions === 'string') {
    try {
      const parsed = JSON.parse(permissions);
      if (Array.isArray(parsed)) permissions = parsed;
    } catch (e) {
      // leave as-is (will result in no valid permissions)
      console.warn('insertRole: permissions string could not be parsed, proceeding with original value');
    }
  }

  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    // ✅ Insert role
    const [result] = await connection.query(
      `
        INSERT INTO roles 
        (name, slug, description, permissions, created_by, tenant_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        name,
        slug,
        description,
        JSON.stringify(permissions),
        created_by,
        tenant_id
      ]
    );

    const roleId = result.insertId;

    // ✅ Insert into role_permissions
    if (permissions.length > 0) {
      console.log('🔍 Attempting to insert permissions:', permissions);

      // Double check permissions exist in catalog
      // Ensure permissions is an array of strings
      const permNames = permissions.map(p => String(p));

      // Insert any missing permissions into permissions_catalog (idempotent)
      try {
        const catalogValues = permNames.map(p => [p, 'Auto-added permission']);
        await connection.query(
          'INSERT IGNORE INTO permissions_catalog (name, description) VALUES ?;',
          [catalogValues]
        );
        console.log('✅ Ensured permissions exist in permissions_catalog');
      } catch (e) {
        console.warn('⚠️ Could not insert into permissions_catalog:', e.message);
      }

      const [existingPerms] = await connection.query(
        'SELECT name FROM permissions_catalog WHERE name IN (?)',
        [permNames]
      );

      const validPermissions = existingPerms.map(p => p.name);
      console.log('✅ Valid permissions from catalog:', validPermissions);

      if (validPermissions.length > 0) {
        const permissionValues = validPermissions.map(p => [roleId, p, tenant_id]);

        await connection.query(
          `
            INSERT INTO role_permissions 
            (role_id, permission_name, tenant_id) 
            VALUES ?
          `,
          [permissionValues]
        );
      } else {
        console.warn('⚠️ No valid permissions found in catalog');
      }
    }

    await connection.commit();
    return roleId;

  } catch (err) {
    await connection.rollback();
    console.error("❌ insertRole error:", err);
    throw err;

  } finally {
    connection.release();
  }
};
