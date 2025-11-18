import db from '../config/db.js';

async function syncRolePermissions() {
  try {
    console.log('Starting role_permissions sync...');

    const [roles] = await db.query("SELECT id, permissions, tenant_id, slug FROM roles WHERE deleted_at IS NULL");
    console.log(`Found ${roles.length} roles`);

    let totalInserted = 0;

    for (const role of roles) {
      let perms = [];
      try {
        if (!role.permissions) {
          perms = [];
        } else if (typeof role.permissions === 'string') {
          perms = JSON.parse(role.permissions);
        } else if (Array.isArray(role.permissions)) {
          perms = role.permissions;
        }
      } catch (e) {
        console.warn('Could not parse permissions for role', role.id, e.message);
        perms = [];
      }

      if (!perms || perms.length === 0) continue;

      const permNames = perms.map(p => String(p));

      // Ensure catalog entries exist
      try {
        const catalogValues = permNames.map(p => [p, 'Auto-added by sync-role-permissions']);
        await db.query('INSERT IGNORE INTO permissions_catalog (name, description) VALUES ?;', [catalogValues]);
      } catch (e) {
        console.warn('Failed to ensure permissions in catalog for role', role.id, e.message);
      }

      // Insert into role_permissions
      try {
        const permissionValues = permNames.map(p => [role.id, p, role.tenant_id]);
        const [result] = await db.query('INSERT IGNORE INTO role_permissions (role_id, permission_name, tenant_id) VALUES ?;', [permissionValues]);
        const inserted = result.affectedRows || 0;
        totalInserted += inserted;
        if (inserted) console.log(`Role ${role.id} (${role.slug}) - inserted ${inserted} permissions`);
      } catch (e) {
        console.error('Failed inserting role_permissions for role', role.id, e.message);
      }
    }

    console.log(`Sync complete. Total inserted: ${totalInserted}`);
    process.exit(0);
  } catch (err) {
    console.error('Sync failed:', err);
    process.exit(1);
  }
}

syncRolePermissions();
