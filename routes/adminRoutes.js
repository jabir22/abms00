import express from 'express';
import { authCheck } from '../middlewares/authCheck.js';
import { checkPermission, checkAnyPermission } from '../middlewares/roleCheck.js';
import db from '../config/db.js';
import * as roleController from '../controllers/roleController.js';
import * as permissions from '../utils/permissions.js';

const router = express.Router();

// User Management UI and API
router.get('/users', authCheck, checkPermission('view_users'), async (req, res) => {
  res.render('admin/users', {
    user: req.session.user,
    page: 'users',
    title: 'User Management'
  });
});

// User Data API
router.get('/users/data', authCheck, checkPermission('view_users'), async (req, res) => {
  try {
    console.log('[users/data] Fetching users for tenant:', req.session.user?.tenant_id, 'role_id:', req.session.user?.role_id);
    
    if (!req.session.user?.tenant_id) {
      console.error('[users/data] No tenant_id in session');
      return res.status(400).json({ success: false, message: 'টেন্যান্ট আইডি পাওয়া যায়নি' });
    }

    // Detect which name columns exist to avoid SQL errors across schema versions
    const dbName = process.env.DB_NAME;
    const [cols] = await db.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME IN ('name_en','name','name_bn')`,
      [dbName]
    );

    const colNames = cols.map(c => c.COLUMN_NAME);
    const hasNameEn = colNames.includes('name_en');
    const hasName = colNames.includes('name');
    const hasNameBn = colNames.includes('name_bn');

    // Build select expressions depending on available columns
    const nameExpr = hasNameEn ? 'u.name_en AS name' : (hasName ? 'u.name AS name' : "COALESCE(JSON_UNQUOTE(JSON_EXTRACT(u.meta, '$.name')), '') AS name");
    const nameBnExpr = hasNameBn ? 'u.name_bn' : "JSON_UNQUOTE(JSON_EXTRACT(u.meta, '$.name_bn')) AS name_bn";

    const sql = `
      SELECT u.id,
             ${nameExpr},
             ${nameBnExpr},
             u.email,
             u.phone,
             u.role_id,
             u.meta,
             r.name AS role_name,
             u.is_active AS status,
             u.created_at
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.tenant_id = ? AND u.deleted_at IS NULL
      ORDER BY u.created_at DESC`;

    const [users] = await db.query(sql, [req.session.user.tenant_id]);

    console.log('[users/data] Found', users.length, 'users');

    const processedUsers = users.map(user => {
      let meta = {};
      try {
        meta = typeof user.meta === 'string' ? JSON.parse(user.meta) : user.meta || {};
      } catch (e) {
        console.error('Error parsing user meta:', e);
        meta = {};
      }

      return {
        id: user.id,
        name: user.name || '',
        email: user.email,
        phone: user.phone || '',
        role_id: user.role_id,
        role_name: user.role_name || '-',
        status: user.status ? 'সক্রিয়' : 'নিষ্ক্রিয়',
        name_bn: user.name_bn || meta.name_bn || '',
        created_at: user.created_at
      };
    });

    res.json({ success: true, users: processedUsers });
  } catch (err) {
    console.error('[users/data] Error:', err.message, err.stack);
    res.status(500).json({
      success: false,
      message: 'ইউজার তথ্য লোড করতে সমস্যা হয়েছে: ' + err.message
    });
  }
});

// Role Management UI - only accessible to users who can manage roles (create, edit, or delete)
router.get('/roles', authCheck, checkAnyPermission('create_role', 'edit_role', 'delete_role'), async (req, res) => {
  res.render('admin/roles', {
    user: req.session.user,
    page: 'roles',
    title: 'Role Management'
  });
});

// Role Management APIs - only accessible to users who can manage roles
router.get('/roles/data', authCheck, checkAnyPermission('create_role', 'edit_role', 'delete_role'), roleController.getRoles);
router.get('/roles/:id', authCheck, checkAnyPermission('create_role', 'edit_role', 'delete_role'), roleController.getRole);
router.post('/roles', authCheck, checkPermission(['create_role']), roleController.createRole);
router.put('/roles/:id', authCheck, checkPermission(['edit_role']), roleController.updateRole);
router.delete('/roles/:id', authCheck, checkPermission(['delete_role']), roleController.deleteRole);
router.post('/roles/:id/force-delete', authCheck, checkPermission(['delete_role']), roleController.forceDeleteRole);

// Get available permissions - only accessible to users who can manage roles
router.get('/permissions', authCheck, checkAnyPermission('create_role', 'edit_role', 'delete_role'), (req, res) => {
  try {
    res.json({
      success: true,
      permissions: permissions.PERMISSIONS,
      groups: permissions.PERMISSION_GROUPS
    });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({
      success: false,
      message: 'পারমিশন লিস্ট লোড করতে সমস্যা হয়েছে'
    });
  }
});

// Admin endpoint: sync role permissions from roles.permissions JSON to role_permissions table
router.post('/sync-role-permissions', authCheck, checkPermission(['create_role']), async (req, res) => {
  try {
    const [roles] = await db.query("SELECT id, permissions, tenant_id, slug FROM roles WHERE deleted_at IS NULL");
    let totalInserted = 0;

    for (const role of roles) {
      let perms = [];
      try {
        if (!role.permissions) perms = [];
        else if (typeof role.permissions === 'string') perms = JSON.parse(role.permissions);
        else if (Array.isArray(role.permissions)) perms = role.permissions;
      } catch (e) {
        console.warn('Could not parse permissions for role', role.id, e.message);
        perms = [];
      }

      if (!perms || perms.length === 0) continue;

      const permNames = perms.map(p => String(p));

      try {
        const catalogValues = permNames.map(p => [p, 'Auto-added by admin sync']);
        await db.query('INSERT IGNORE INTO permissions_catalog (name, description) VALUES ?;', [catalogValues]);
      } catch (e) {
        console.warn('Failed to ensure permissions in catalog for role', role.id, e.message);
      }

      try {
        const permissionValues = permNames.map(p => [role.id, p, role.tenant_id]);
        const [result] = await db.query('INSERT IGNORE INTO role_permissions (role_id, permission_name, tenant_id) VALUES ?;', [permissionValues]);
        totalInserted += result.affectedRows || 0;
      } catch (e) {
        console.error('Failed inserting role_permissions for role', role.id, e.message);
      }
    }

    res.json({ success: true, message: `Synced role permissions`, inserted: totalInserted });
  } catch (err) {
    console.error('Sync endpoint error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});
export default router;