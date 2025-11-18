import db from '../config/db.js';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

import { insertOwner } from '../models/owner.model.js';
import { insertRole } from '../models/role.model.js';
import { findUserByPhone, insertUser } from '../models/user.model.js';
import { PERMISSIONS, DEFAULT_ROLE_PERMISSIONS } from '../utils/permissions.js';

// ✅ Login Controller with console logs
import logger from '../utils/logger.js';

export const loginUser = async (req, res) => {
  logger.info("LOGIN STARTED");

  const { phone, password } = req.body;
  logger.info("Login data received", { phone });

  if (!req.headers['x-csrf-token']) {
    logger.warn("Missing CSRF token");
    return res.status(403).json({ success: false, message: 'CSRF টোকেন পাওয়া যায়নি' });
  }

  if (!phone || !password) {
    logger.warn("Missing phone or password");
    return res.status(400).json({ success: false, message: 'ইমেইল এবং পাসওয়ার্ড প্রয়োজন' });
  }

  try {
    logger.info("Checking user in database...");
    const [results] = await db.query('SELECT * FROM users WHERE phone = ? LIMIT 1', [phone]);

    if (results.length === 0) {
      logger.warn("User not found", { phone });
      return res.status(401).json({ success: false, message: 'ইউজার পাওয়া যায়নি' });
    }

    const user = results[0];
    logger.info("User found", { userId: user.id });

    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      logger.warn("Wrong password attempt", { phone });
      return res.status(401).json({ success: false, message: 'পাসওয়ার্ড ভুল হয়েছে' });
    }

    logger.info("Password matched, creating session", { userId: user.id });

    req.session.loggedIn = true;
    req.session.user = {
      id: user.id,
      phone: user.phone,
      name: user.name,
      role_id: user.role_id,
      tenant_id: user.tenant_id,
    };

    logger.info("LOGIN SUCCESS", { userId: user.id });
    return res.json({ success: true, redirect: '/' });

  } catch (err) {
    logger.error("LOGIN ERROR", { error: err });
    return res.status(500).json({ success: false, message: 'সার্ভার সমস্যা হয়েছে' });
  }
};


// ✅ Signup Controller with full logs
export const signupOwner = async (req, res) => {
  console.log('🔰 SIGNUP STARTED');
  console.log('➡️ Signup Data Received:', req.body);

  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      console.log('❌ Required fields missing');
      return res.status(400).json({ error: 'সব ফিল্ড পূরণ করুন' });
    }

    console.log('🔍 Checking if phone already exists...');
    const existing = await findUserByPhone(phone);

    if (existing.length > 0) {
      console.log('❌ Number already used:', phone);
      return res.status(409).json({ error: 'নম্বরটি ইতিমধ্যে ব্যবহার হয়েছে' });
    }

    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);

    const uuid = uuidv4();
    console.log('✅ Generated Owner UUID:', uuid);

    // ✅ Step 1: Create Tenant
    console.log('🏢 Creating tenant...');
    const [tenantResult] = await db.query('INSERT INTO tenants (name) VALUES (?)', [name]);
    const tenant_id = tenantResult.insertId;
    console.log('✅ Tenant created with ID:', tenant_id);

    // ✅ Step 2: Create Owner
    console.log('👤 Inserting owner record...');
    const owner_id = await insertOwner({ uuid, name, email, phone, tenant_id });
    console.log('✅ Owner inserted with ID:', owner_id);

    // ✅ Step 3: Create Owner Role
    console.log('👑 Creating owner role with full permissions...');
    const role_id = await insertRole({
      name: 'Owner',
      slug: 'owner',
      description: 'Business owner with full system access',
      // pass permissions as an array (insertRole will stringify for storage)
      permissions: DEFAULT_ROLE_PERMISSIONS.owner,
      created_by: owner_id,
      tenant_id
    });
    console.log('✅ Role created with ID:', role_id);

    // ✅ Step 4: Create User Account
    console.log('🧑‍💻 Creating user account...');
    const user_id = await insertUser({
      uuid: uuidv4(),
      owner_id,
      role_id,
      name,
      email,
      phone,
      password_hash: hashedPassword,
      tenant_id
    });
    console.log('✅ User created with ID:', user_id);

    // ✅ Auto Login
    console.log('🔓 Auto-login started...');
    req.session.loggedIn = true;
    req.session.user = {
      id: user_id,
      email,
      name,
      role_id,
      tenant_id,
    };

    console.log('✅ SIGNUP COMPLETED SUCCESSFULLY');

    return res.status(201).json({
      success: true,
      message: 'মালিক সাইনআপ সফল হয়েছে!',
      owner_id,
      user_id,
      role_id,
      tenant_id,
      redirect: '/',
    });

  } catch (err) {
    console.log('❌ SIGNUP ERROR:', err);

    return res.status(500).json({
      error: 'সার্ভার সমস্যা হয়েছে',
      details: err.sqlMessage || err.message,
    });
  }
};

// ✅ Logout
export const logoutUser = (req, res) => {
  console.log('🔰 LOGOUT REQUEST');

  req.session.destroy(err => {
    if (err) {
      console.log('❌ Logout error:', err);
    } else {
      console.log('✅ Logout successful');
    }
    res.redirect('/login');
  });
};
