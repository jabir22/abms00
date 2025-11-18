import express from 'express';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { authCheck } from '../middlewares/authCheck.js';
import { checkPermission, loadPermissions } from '../middlewares/roleCheck.js';
import db from '../config/db.js';

const router = express.Router();

// Get all users (tenant-scoped)
router.get('/', authCheck, checkPermission('view_users'), async (req, res) => {
  try {
    const [users] = await db.query(`
      SELECT u.id, COALESCE(u.name_en, JSON_UNQUOTE(JSON_EXTRACT(u.meta, '$.name')), '') AS name, u.email, u.phone, u.role_id, u.meta, 
        r.name as role_name, u.is_active AS status, u.created_at
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.tenant_id = ? AND u.deleted_at IS NULL
      ORDER BY u.created_at DESC`,
      [req.session.user.tenant_id]
    );

    // Parse meta for each user
    const processedUsers = users.map(user => {
      let meta = {};
      try {
        meta = typeof user.meta === 'string' ? JSON.parse(user.meta) : user.meta || {};
      } catch (e) {
        console.error('Error parsing user meta:', e);
        meta = {};
      }

      return {
        ...user,
        name_bn: meta.name_bn || '',
        meta: undefined // Don't send raw meta to client
      };
    });

    res.json({ success: true, users: processedUsers });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({
      success: false,
      message: 'ইউজার তথ্য লোড করতে সমস্যা হয়েছে'
    });
  }
});

// Alias endpoint for older frontends: /api/users/all -> return users list in `data` field
router.get('/all', authCheck, checkPermission('view_users'), async (req, res) => {
  try {
    const [users] = await db.query(`
      SELECT u.id, COALESCE(u.name_en, JSON_UNQUOTE(JSON_EXTRACT(u.meta, '$.name')), '') AS name, u.email, u.phone, u.role_id, u.meta, 
        r.name as role_name, u.is_active AS status, u.created_at
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.tenant_id = ? AND u.deleted_at IS NULL
      ORDER BY u.created_at DESC`,
      [req.session.user.tenant_id]
    );

    const processedUsers = users.map(user => {
      let meta = {};
      try {
        meta = typeof user.meta === 'string' ? JSON.parse(user.meta) : user.meta || {};
      } catch (e) {
        console.error('Error parsing user meta:', e);
        meta = {};
      }

      return {
        ...user,
        name_bn: meta.name_bn || '',
        meta: undefined
      };
    });

    // Return in `data` to match older API contract
    res.json({ success: true, data: processedUsers });
  } catch (err) {
    console.error('Error fetching users (alias /all):', err);
    res.status(500).json({ success: false, message: 'ইউজার তথ্য লোড করতে সমস্যা হয়েছে' });
  }
});

// Get single user (tenant-scoped)
router.get('/:id', authCheck, checkPermission('view_users'), async (req, res) => {
  try {
    console.log('[userRoutes] GET /users/:id requested id=', req.params.id, 'sessionUser=', req.session?.user?.id);
    const [users] = await db.query(`
      SELECT u.id, COALESCE(u.name_en, JSON_UNQUOTE(JSON_EXTRACT(u.meta, '$.name')), '') AS name, u.email, u.phone, u.role_id, u.meta,
        r.name as role_name, u.is_active AS status
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = ? AND u.tenant_id = ? AND u.deleted_at IS NULL`,
      [req.params.id, req.session.user.tenant_id]
    );

    if (!users.length) {
      return res.status(404).json({
        success: false,
        message: 'ইউজার পাওয়া যায়নি'
      });
    }

    const user = users[0];
    let meta = {};
    try {
      meta = typeof user.meta === 'string' ? JSON.parse(user.meta) : user.meta || {};
    } catch (e) {
      console.error('Error parsing user meta:', e);
      meta = {};
    }

    res.json({
      success: true,
      user: {
        ...user,
        name_bn: meta.name_bn || '',
        meta: undefined
      }
    });
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({
      success: false,
      message: 'ইউজার তথ্য লোড করতে সমস্যা হয়েছে'
    });
  }
});

// Create user
router.post('/', authCheck, checkPermission('create_user'), async (req, res) => {
  let connection;
  try {
    console.log('POST /users - session.user:', req.session?.user, 'csrf:', req.headers['x-csrf-token']);
    console.log('POST /users - body:', req.body);
    const { name, name_bn, email, phone, role_id, password } = req.body;

    // Validation
    if (!name || !email || !password || !role_id) {
      return res.status(400).json({
        success: false,
        message: 'সব তথ্য পূরণ করুন'
      });
    }

    // Check if email exists
    const [existing] = await db.query(
      'SELECT id FROM users WHERE email = ? AND deleted_at IS NULL',
      [email]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'এই ইমেইল দিয়ে ইতিমধ্যে একাউন্ট খোলা আছে'
      });
    }

    // Hash password and verify role belongs to tenant
    const hashedPassword = await bcrypt.hash(password, 10);
    const [roles] = await db.query(
      'SELECT id FROM roles WHERE id = ? AND tenant_id = ?',
      [role_id, req.session.user.tenant_id]
    );

    if (!roles.length) {
      return res.status(400).json({
        success: false,
        message: 'অবৈধ পদবী নির্বাচন করা হয়েছে'
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    // Insert user
    const [result] = await connection.query(
      `INSERT INTO users (uuid, name_en, email, phone, password_hash, role_id, tenant_id, meta)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        randomUUID(),
        name,
        email,
        phone || null,
        hashedPassword,
        role_id,
        req.session.user.tenant_id,
        JSON.stringify({ name_bn })
      ]
    );

    await connection.commit();

    res.json({
      success: true,
      message: 'নতুন ইউজার যোগ করা হয়েছে',
      userId: result.insertId
    });
  } catch (err) {
    console.error('Error creating user:', err);
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackErr) {
        console.error('Error rolling back:', rollbackErr);
      }
    }
    res.status(500).json({
      success: false,
      message: 'ইউজার তৈরি করতে সমস্যা হয়েছে',
      error: err.message
    });
  } finally {
    if (connection) connection.release();
  }
});

// Update user (tenant-scoped)
router.put('/:id', authCheck, checkPermission('edit_user'), async (req, res) => {
  let connection;
  try {
    console.log('PUT /users/:id - session.user:', req.session?.user, 'csrf:', req.headers['x-csrf-token']);
    console.log('PUT /users/:id - params:', req.params, 'body:', req.body);
    const userId = req.params.id;
    const { name, name_bn, email, phone, role_id, password } = req.body;

    // Check if user exists and belongs to same tenant
    const [users] = await db.query(
      'SELECT id FROM users WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL',
      [userId, req.session.user.tenant_id]
    );

    if (!users.length) {
      return res.status(404).json({
        success: false,
        message: 'ইউজার পাওয়া যায়নি'
      });
    }

    // Verify role belongs to tenant
    const [roles] = await db.query(
      'SELECT id FROM roles WHERE id = ? AND tenant_id = ?',
      [role_id, req.session.user.tenant_id]
    );

    if (!roles.length) {
      return res.status(400).json({
        success: false,
        message: 'অবৈধ পদবী নির্বাচন করা হয়েছে'
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    // Update user
    let query = `
      UPDATE users 
      SET name_en = ?, email = ?, phone = ?, role_id = ?, meta = ?
      WHERE id = ? AND tenant_id = ?
    `;
    let params = [
      name,
      email,
      phone || null,
      role_id,
      JSON.stringify({ name_bn }),
      userId,
      req.session.user.tenant_id
    ];

    // If password provided, update it
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query = `
        UPDATE users 
        SET name_en = ?, email = ?, phone = ?, role_id = ?, meta = ?, password_hash = ?
        WHERE id = ? AND tenant_id = ?
      `;
      params = [
        name,
        email,
        phone || null,
        role_id,
        JSON.stringify({ name_bn }),
        hashedPassword,
        userId,
        req.session.user.tenant_id
      ];
    }

    await connection.query(query, params);
    await connection.commit();

    res.json({
      success: true,
      message: 'ইউজার আপডেট করা হয়েছে'
    });
  } catch (err) {
    console.error('Error updating user:', err);
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackErr) {
        console.error('Error rolling back:', rollbackErr);
      }
    }
    res.status(500).json({
      success: false,
      message: 'ইউজার আপডেট করতে সমস্যা হয়েছে',
      error: err.message
    });
  } finally {
    if (connection) connection.release();
  }
});

// Assign role only (tenant-scoped) - lightweight endpoint for role changes
// Requires explicit 'assign_role' permission so only authorized users can change others' roles
router.put('/:id/role', authCheck, checkPermission('assign_role'), async (req, res) => {
  try {
    const userId = req.params.id;
    const { role_id } = req.body;

    if (!role_id) {
      return res.status(400).json({ success: false, message: 'পদবী আইডি সরবরাহ করুন' });
    }

    // Verify user exists in tenant
    const [users] = await db.query(
      'SELECT id FROM users WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL',
      [userId, req.session.user.tenant_id]
    );

    if (!users.length) {
      return res.status(404).json({ success: false, message: 'ইউজার পাওয়া যায়নি' });
    }

    // Verify role belongs to tenant
    const [roles] = await db.query(
      'SELECT id FROM roles WHERE id = ? AND tenant_id = ?',
      [role_id, req.session.user.tenant_id]
    );

    if (!roles.length) {
      return res.status(400).json({ success: false, message: 'অবৈধ পদবী নির্বাচন করা হয়েছে' });
    }

    await db.query('UPDATE users SET role_id = ?, updated_at = NOW() WHERE id = ? AND tenant_id = ?', [role_id, userId, req.session.user.tenant_id]);

    res.json({ success: true, message: 'পদবী আপডেট করা হয়েছে' });
  } catch (err) {
    console.error('Error assigning role:', err);
    res.status(500).json({ success: false, message: 'পদবী বরাদ্দ করতে সমস্যা হয়েছে' });
  }
});

// Return current user's effective permissions (for frontend UI decisions)
router.get('/me/permissions', authCheck, async (req, res) => {
  try {
    if (!req.session?.user?.role_id) return res.json({ success: true, permissions: [] });
    const perms = await loadPermissions(req.session.user.role_id);
    return res.json({ success: true, permissions: perms });
  } catch (err) {
    console.error('Error fetching current user permissions:', err);
    return res.status(500).json({ success: false, message: 'পারমিশন লোড করতে সমস্যা হয়েছে' });
  }
});

// Delete user (soft delete, tenant-scoped)
router.delete('/:id', authCheck, checkPermission('delete_user'), async (req, res) => {
  let connection;
  try {
    const userId = req.params.id;

    // Check if user exists and belongs to same tenant
    const [users] = await db.query(
      'SELECT id FROM users WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL',
      [userId, req.session.user.tenant_id]
    );

    if (!users.length) {
      return res.status(404).json({
        success: false,
        message: 'ইউজার পাওয়া যায়নি'
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    // Soft delete
    await connection.query(
      'UPDATE users SET deleted_at = NOW() WHERE id = ? AND tenant_id = ?',
      [userId, req.session.user.tenant_id]
    );

    await connection.commit();

    res.json({
      success: true,
      message: 'ইউজার মুছে ফেলা হয়েছে'
    });
  } catch (err) {
    console.error('Error deleting user:', err);
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackErr) {
        console.error('Error rolling back:', rollbackErr);
      }
    }
    res.status(500).json({
      success: false,
      message: 'ইউজার মুছে ফেলতে সমস্যা হয়েছে'
    });
  } finally {
    if (connection) connection.release();
  }
});

export default router;
