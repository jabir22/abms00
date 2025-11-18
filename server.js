import dotenv from 'dotenv';
import express from 'express';
import session from 'express-session';
import path from 'path';
import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { loadPermissions } from './middlewares/roleCheck.js';
import productRoutes from './routes/productRoutes.js';
import salesRoutes from './routes/salesRoutes.js';
import purchaseRoutes from './routes/purchaseRoutes.js';
import accountsRoutes from './routes/accountsRoutes.js';
import areaRoutes from './routes/areaRoutes.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import cors from 'cors';
import { routeResolver } from './middlewares/routeResolver.js';
import csrf from 'csurf';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session config
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60,
    },
  })
);

// -------------------------
// CSRF Setup (SAFE VERSION)
// -------------------------
const csrfProtection = csrf({ cookie: false });

// CSRF only on POST/PUT/PATCH/DELETE
app.use((req, res, next) => {
  const needsProtection = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);

  if (needsProtection) {
    return csrfProtection(req, res, next);
  }

  next();
});

// Add csrfToken for views only when available
app.use((req, res, next) => {
  try {
    if (req.csrfToken) {
      res.locals.csrfToken = req.csrfToken();
    }
  } catch (e) {
    res.locals.csrfToken = null;
  }
  next();
});

// -------------------------
// User + Permissions
// -------------------------
app.use(async (req, res, next) => {
  res.locals.user = req.session?.user || null;
  req.user = req.session?.user || null;

  if (req.session?.user?.role_id) {
    try {
      const perms = await loadPermissions(req.session.user.role_id);
      res.locals.userPermissions = Array.isArray(perms) ? perms : [];
    } catch (e) {
      console.error('Failed to load permissions:', e);
      res.locals.userPermissions = [];
    }
  } else {
    res.locals.userPermissions = [];
  }

  next();
});

// CORS
app.use(cors());

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// -------------------------
// Routes
// -------------------------
app.use('/', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/profile', profileRoutes);
app.use('/admin', adminRoutes);
app.use('/users', userRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/admin/areas', areaRoutes);
app.use('/api/areas', areaRoutes);

// Login middleware
const requireLogin = (req, res, next) => {
  if (!req.session.user) return res.redirect('/login');
  next();
};

// Root route
app.get('/', requireLogin, (req, res) => {
  res.render('dashboard/dashboard', {
    user: req.session.user,
    page: 'dashboard',
    title: 'Dashboard',
  });
});

// Route Resolver
app.use(routeResolver);

// -------------------------
// Error Handler
// -------------------------
app.use((err, req, res, next) => {
  console.error('Server Error:', err);

  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({
      success: false,
      message: 'সেশন এক্সপায়ার হয়েছে। পেজ রিফ্রেশ করে আবার চেষ্টা করুন।',
    });
  }

  res.status(500).json({
    success: false,
    message: 'সার্ভার সমস্যা হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।',
  });
});

// Catch-all
app.use((req, res) => res.redirect('/login'));

// -------------------------
// Start server
// -------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  saveUninitialized: false,
  cookie: { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 1000 * 60 * 60 }
}));

// CSRF protection
app.use(csrf());
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});

// Expose current user and their permissions to all views so templates can
// conditionally show/hide UI elements (e.g. Admin menu) without extra AJAX.
app.use(async (req, res, next) => {
  res.locals.user = req.session?.user || null;
  // make session user available as req.user for controllers/middlewares
  req.user = req.session?.user || null;
  if (req.session?.user?.role_id) {
    try {
      const perms = await loadPermissions(req.session.user.role_id);
      res.locals.userPermissions = Array.isArray(perms) ? perms : [];
    } catch (e) {
      console.error('Failed to load permissions for view locals:', e);
      res.locals.userPermissions = [];
    }
  } else {
    res.locals.userPermissions = [];
  }
  next();
});

// CORS
app.use(cors());

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// API Routes
app.use('/', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/profile', profileRoutes);
app.use('/admin', adminRoutes);
app.use('/users', userRoutes);
// Also mount user routes under /api/users for API-compatible endpoints
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/admin/areas', areaRoutes);
app.use('/api/areas', areaRoutes);

// Login middleware
const requireLogin = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
};

// Root route
app.get("/", requireLogin, (req, res) => {
  res.render('dashboard/dashboard', { user: req.session.user, page: 'dashboard', title: 'Dashboard' });
});

// Register routeResolver AFTER routes and root route
app.use(routeResolver);

// Error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({
      success: false,
      message: 'সেশন এক্সপায়ার হয়েছে। পেজ রিফ্রেশ করে আবার চেষ্টা করুন।'
    });
  }
  res.status(500).json({
    success: false,
    message: 'সার্ভার সমস্যা হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।'
  });
});

// Catch-all redirect
app.use((req, res) => res.redirect('/login'));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
