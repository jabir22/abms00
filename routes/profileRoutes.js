// routes/profileRoutes.js
import express from 'express';
import mysql from 'mysql2/promise';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { authCheck } from '../middlewares/authCheck.js'; // Login protection
import { checkRole, checkPermission, loadPermissions } from '../middlewares/roleCheck.js';

const router = express.Router();

import db from '../config/db.js';
import Area from '../models/area.model.js';

// Multer setup for profile photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'public/uploads/users/photos';
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Redirect /profile to logged-in user's profile
router.get('/', authCheck, (req, res) => {
  const userId = req.session.user.id;
  res.redirect(`/profile/${userId}`);
});

// GET profile page (tenant-scoped access)
router.get('/:id', authCheck, async (req, res) => {
  const userId = parseInt(req.params.id);
  res.locals.page = 'profile';

  try {
    // Load target user including tenant_id
    const [rows] = await db.query(
      `SELECT u.id, COALESCE(u.name_en, JSON_UNQUOTE(JSON_EXTRACT(u.meta, '$.name')), '') AS name, u.email, u.phone, u.role_id, u.meta, r.name as role_name, u.tenant_id, u.created_at, u.last_login_at 
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.id 
       WHERE u.id = ? AND u.deleted_at IS NULL`,
      [userId]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const targetUser = rows[0];

    // Always allow viewing own profile
    if (userId !== req.session.user.id) {
      // Enforce tenant isolation: only allow access to users within same tenant
      if (req.session.user.tenant_id !== targetUser.tenant_id) {
        // Render a friendly 403 page for tenant mismatch when viewing via browser
        return res.status(403).render('errors/403', { message: 'Access denied: tenant mismatch' });
      }

      // Load current user's role and permissions to determine if they can view others
      // Prefer loading from role_permissions table via loadPermissions for consistency
      const perms = await loadPermissions(req.session.user.role_id);
      // Load role slug to allow owner/admin bypass
      const [roleRows] = await db.query('SELECT slug FROM roles WHERE id = ?', [req.session.user.role_id]);
      const userRole = roleRows[0]?.slug;

      // owner and admin within the same tenant can view other users
      if (userRole === 'owner' || userRole === 'admin') {
        // allowed
      } else {
        if (!Array.isArray(perms) || !perms.includes('view_profile')) {
          return res.status(403).render('errors/403', { message: 'Access denied: insufficient permissions' });
        }
      }
    }

    let meta = {};
    try {
      meta = typeof targetUser.meta === 'string' ? JSON.parse(targetUser.meta) : targetUser.meta || {};
    } catch (e) {
      console.error('Error parsing user meta:', e);
      meta = {};
    }

    // Use csurf-provided token for forms
    const csrfToken = req.csrfToken();

    // Load areas assigned to this user so the UI can show quick context
    let assignedAreas = [];
    try {
      assignedAreas = await Area.getUserAreas(userId);
    } catch (areaErr) {
      console.error('Error loading assigned areas for user profile:', areaErr);
      assignedAreas = [];
    }

    // Load and group target user's permissions (group by prefix)
    let targetPermissions = [];
    let groupedPermissions = [];
    try {
      if (targetUser.role_id) {
        const perms = await loadPermissions(targetUser.role_id);
        targetPermissions = Array.isArray(perms) ? perms : [];

        // group by prefix before first '.', ':', or '_'
        const groups = {};
        targetPermissions.forEach(p => {
          const parts = String(p).split(/[:._]/);
          const key = parts[0] || 'other';
          if (!groups[key]) groups[key] = [];
          groups[key].push(p);
        });

        groupedPermissions = Object.keys(groups).map(k => ({ group: k, perms: groups[k] }));
        // sort groups alphabetically
        groupedPermissions.sort((a, b) => a.group.localeCompare(b.group));
      }
    } catch (permErr) {
      console.error('Error loading target user permissions:', permErr);
      targetPermissions = [];
      groupedPermissions = [];
    }

    res.render('profile/profile', {
      user: {
        id: targetUser.id,
        name_en: meta.name_en || targetUser.name,
        name_bn: meta.name_bn || '',
        father_name: meta.father_name || '',
        mother_name: meta.mother_name || '',
        dob: meta.dob || '',
        gender: meta.gender || '',
        email: targetUser.email,
        phone: targetUser.phone || '',
        role: targetUser.role_name || '(পদবি নির্ধারিত নয়)',
        role_id: targetUser.role_id,
        profile_photo: meta.profile_photo || '/profile/default.png',
        permanent_address: meta.permanent_address || '',
        current_address: meta.current_address || '',
        created_at: targetUser.created_at || null,
        last_login_at: targetUser.last_login_at || null
      },
      assignedAreas,
      targetPermissions,
      groupedPermissions,
      csrfToken,
      page: 'profile',
      title: 'Profile'
    });
  } catch (error) {
    console.error('Error loading profile:', error);
    res.status(500).json({ success: false, message: 'Error loading profile. Please try again.' });
  }
});

// POST update profile info
// Require 'edit_profile' permission to update profiles (prevents view-only roles from editing)
router.post('/update/:id', authCheck, checkPermission('edit_profile'), async (req, res) => {
  console.log('POST /profile/update/' + req.params.id + ' - user:', req.session?.user, 'body:', req.body);

  const userId = parseInt(req.params.id);
  if (userId !== req.session.user.id) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  let connection;
  try {
    const {
      name_en, name_bn, father_name, mother_name, dob,
      gender, email, phone, role, permanent_address, current_address
    } = req.body;

    connection = await db.getConnection();
    await connection.beginTransaction();

    const [rows] = await connection.query(
      'SELECT meta FROM users WHERE id=? AND deleted_at IS NULL',
      [userId]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let meta = {};
    try {
      meta = typeof rows[0].meta === 'string' ? JSON.parse(rows[0].meta) : rows[0].meta || {};
    } catch (e) {
      console.error('Error parsing existing meta:', e);
      meta = {};
    }

    // Merge new data, preserving existing fields
    meta = {
      ...meta,
      name_en, name_bn, father_name, mother_name, dob,
      gender, role, permanent_address, current_address
    };

    await connection.query(
      'UPDATE users SET email=?, phone=?, meta=? WHERE id=? AND deleted_at IS NULL',
      [email, phone, JSON.stringify(meta), userId]
    );

    await connection.commit();

    // Update session
    if (req.session && req.session.user) {
      req.session.user.email = email || req.session.user.email;
      req.session.user.name = meta.name_en || meta.name_bn || req.session.user.name;
      req.session.user.phone = phone || req.session.user.phone;
      if (meta.profile_photo) req.session.user.profile_photo = meta.profile_photo;
    }

    console.log('Profile updated successfully for user:', userId);
    res.json({
      success: true,
      message: 'প্রোফাইল সফলভাবে আপডেট হয়েছে',
      user: meta
    });
  } catch (error) {
    console.error('Profile update error:', error);
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Error rolling back transaction:', rollbackError);
      }
    }
    res.status(500).json({
      success: false,
      message: 'প্রোফাইল আপডেট করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।'
    });
  } finally {
    if (connection) connection.release();
  }
});

// POST update password
// Require 'edit_profile' permission to change passwords
router.post('/update-password/:id', authCheck, checkPermission('edit_profile'), async (req, res) => {
  const userId = parseInt(req.params.id);
  if (userId !== req.session.user.id)
    return res.status(403).json({ success: false, message: 'Access denied' });

  // CSRF is validated by csurf middleware global handler; no manual check needed here

  const { password } = req.body;
  if (!password || password.length < 6)
    return res.status(400).json({ success: false, message: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে' });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      'UPDATE users SET password_hash=? WHERE id=? AND tenant_id=? AND deleted_at IS NULL',
      [hashedPassword, userId, req.session.user.tenant_id]
    );

    // Update session if needed
    if (req.session && req.session.user) req.session.user.password_hash = hashedPassword;

    res.json({ success: true, message: 'পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে' });
  } catch (err) {
    console.error('Password update error:', err);
    res.status(500).json({ success: false, message: 'পাসওয়ার্ড পরিবর্তন করতে সমস্যা হয়েছে' });
  }
});

// GET available roles
router.get('/roles/list', authCheck, async (req, res) => {
  try {
    const [roles] = await db.query(
      'SELECT id, name FROM roles WHERE tenant_id = ? AND deleted_at IS NULL ORDER BY name',
      [req.session.user.tenant_id]
    );

    console.log('Fetched roles for tenant:', req.session.user.tenant_id, 'count:', roles.length);
    res.json({ success: true, roles });
  } catch (err) {
    console.error('Error fetching roles:', err);
    res.status(500).json({
      success: false,
      message: 'পদবী তালিকা লোড করতে সমস্যা হয়েছে'
    });
  }
});

// POST profile photo upload
// Require 'edit_profile' permission to upload/change profile photo
router.post('/upload-photo/:id', authCheck, checkPermission('edit_profile'), upload.single('profile_photo'), async (req, res) => {
  console.log('POST /profile/upload-photo/' + req.params.id + ' - user:', req.session?.user);

  const userId = parseInt(req.params.id);
  if (userId !== req.session.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'কোন ছবি আপলোড করা হয়নি'
    });
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({
      success: false,
      message: 'অনুগ্রহ করে শুধুমাত্র JPG, PNG, বা GIF ফরম্যাটের ছবি আপলোড করুন'
    });
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (req.file.size > maxSize) {
    return res.status(400).json({
      success: false,
      message: 'ছবির সাইজ ৫ মেগাবাইটের বেশি হতে পারবে না'
    });
  }

  const photoPath = '/uploads/users/photos/' + req.file.filename;
  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [rows] = await connection.query(
      'SELECT meta FROM users WHERE id=? AND deleted_at IS NULL',
      [userId]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let meta = {};
    try {
      meta = typeof rows[0].meta === 'string' ? JSON.parse(rows[0].meta) : rows[0].meta || {};
    } catch (e) {
      console.error('Error parsing existing meta:', e);
      meta = {};
    }

    // Store old photo path to delete later if needed
    const oldPhoto = meta.profile_photo;
    meta.profile_photo = photoPath;

    await connection.query(
      'UPDATE users SET meta=? WHERE id=?',
      [JSON.stringify(meta), userId]
    );

    await connection.commit();

    // Update session
    if (req.session && req.session.user) {
      req.session.user.profile_photo = photoPath;
    }

    // Try to delete old photo file if it exists and isn't the default
    if (oldPhoto && oldPhoto !== '/profile/default.png') {
      const oldPhotoPath = path.join('public', oldPhoto);
      try {
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath);
          console.log('Deleted old profile photo:', oldPhotoPath);
        }
      } catch (e) {
        console.error('Error deleting old photo:', e);
      }
    }

    console.log('Profile photo updated for user:', userId);
    res.json({
      success: true,
      message: 'প্রোফাইল ছবি সফলভাবে আপলোড হয়েছে',
      profile_photo: photoPath
    });
  } catch (error) {
    console.error('Error uploading profile photo:', error);
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Error rolling back transaction:', rollbackError);
      }
    }
    res.status(500).json({
      success: false,
      message: 'ছবি আপলোড করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।'
    });
  } finally {
    if (connection) connection.release();
  }
});

export default router;
