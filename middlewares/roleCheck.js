// roleCheck.js - Role & Permission based middleware
import db from '../config/db.js';

// helper: decide whether request expects JSON (API/AJAX) or HTML
function wantsJson(req) {
  const accept = (req.headers && req.headers.accept) || '';
  const xRequested = req.headers && (req.headers['x-requested-with'] || req.headers['X-Requested-With']);
  const contentType = req.headers && (req.headers['content-type'] || '');
  return req.xhr || xRequested === 'XMLHttpRequest' || accept.includes('application/json') || contentType.includes('application/json');
}

// helper: unified forbidden responder
function respondForbidden(req, res, message = 'অনুমতি নেই') {
  if (wantsJson(req)) {
    return res.status(403).json({ success: false, message });
  }
  // Render friendly 403 page with optional redirect to referrer or home
  const redirectUrl = (req && (req.get('referer') || req.get('referrer'))) || '/';
  try {
    return res.status(403).render('errors/403', { message, redirectUrl, page: 'error', title: 'অনুমতি নেই' });
  } catch (e) {
    // Fallback to JSON if render fails
    console.error('Failed to render 403 view:', e);
    return res.status(403).json({ success: false, message });
  }
}

// কোন রোলের জন্য পারমিশন লিস্ট লোড করে
export async function loadPermissions(role_id) {
  if (!role_id) return [];

  try {
    // ✅ Load permissions from role_permissions table (new way)
    const [rows] = await db.query(
      'SELECT permission_name FROM role_permissions WHERE role_id = ?',
      [role_id]
    );

    if (!rows.length) {
      console.warn('No permissions found for role_id:', role_id);
      return [];
    }

    return rows.map(r => r.permission_name);
  } catch (err) {
    console.error('Error loading permissions from role_permissions table:', err);
    return [];
  }
}

// রোল চেক মিডলওয়্যার
export const checkRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.session?.user?.role_id) {
        return respondForbidden(req, res, 'অনুমতি নেই');
      }

      // রোল আইডি দিয়ে রোল ডেটা লোড করি
      const [roles] = await db.query(
        'SELECT slug FROM roles WHERE id = ?',
        [req.session.user.role_id]
      );

      if (!roles.length) {
        return respondForbidden(req, res, 'ভুল রোল আইডি');
      }

      const userRole = roles[0].slug;

      // চেক করি ইউজারের রোল অনুমোদিত কিনা
      if (allowedRoles.includes(userRole)) {
        next();
      } else {
        return respondForbidden(req, res, 'এই পেজ দেখার অনুমতি নেই');
      }
    } catch (err) {
      console.error('Role check error:', err);
      res.status(500).json({
        success: false,
        message: 'রোল চেক করতে সমস্যা হয়েছে'
      });
    }
  };
};

// পারমিশন চেক মিডলওয়্যার 
export const checkPermission = (...requiredPermissions) => {
  return async (req, res, next) => {
    try {
      if (!req.session?.user?.role_id) {
        console.warn('Permission denied: no role_id in session', { sessionUser: req.session?.user });
        return respondForbidden(req, res, 'অনুমতি নেই');
      }

      // Check if owner role - owner bypasses all permission checks
      try {
        const [roles] = await db.query(
          'SELECT slug FROM roles WHERE id = ?',
          [req.session.user.role_id]
        );

        if (roles && roles.length > 0 && roles[0]?.slug === 'owner') {
          console.log('Owner role detected, bypassing permission check');
          return next();
        }
      } catch (roleErr) {
        console.error('Error checking role:', roleErr);
        // Continue to permission check even if role lookup fails
      }

      // ইউজারের রোলের পারমিশন লোড করি
      const userPermissions = await loadPermissions(req.session.user.role_id);

      // Normalize requiredPermissions: accept either multiple args or a single array
      const perms = (requiredPermissions.length === 1 && Array.isArray(requiredPermissions[0]))
        ? requiredPermissions[0]
        : requiredPermissions;

      console.log('checkPermission - required:', perms, 'userPermissions:', userPermissions, 'role_id:', req.session.user.role_id);

      // চেক করি সব রিকোয়ার্ড পারমিশন আছে কিনা (AND)
      const hasAllPermissions = perms.every(permission => userPermissions.includes(permission));

      if (hasAllPermissions) {
        return next();
      }

      console.warn('Permission missing', { requiredPermissions: perms, userPermissions, role_id: req.session.user.role_id });
      return respondForbidden(req, res, 'এই কাজের অনুমতি নেই');
    } catch (err) {
      console.error('Permission check error:', err);
      res.status(500).json({
        success: false,
        message: 'পারমিশন চেক করতে সমস্যা হয়েছে'
      });
    }
  };
};

// Allow if user has ANY of the provided permissions (OR)
export const checkAnyPermission = (...requiredPermissions) => {
  return async (req, res, next) => {
    try {
      if (!req.session?.user?.role_id) return respondForbidden(req, res, 'অনুমতি নেই');

      // owner bypass
      try {
        const [roles] = await db.query('SELECT slug FROM roles WHERE id = ?', [req.session.user.role_id]);
        if (roles && roles.length > 0 && roles[0]?.slug === 'owner') return next();
      } catch (e) { console.error('Error checking role in checkAnyPermission', e); }

      const userPermissions = await loadPermissions(req.session.user.role_id);

      const perms = (requiredPermissions.length === 1 && Array.isArray(requiredPermissions[0]))
        ? requiredPermissions[0]
        : requiredPermissions;

      const hasAny = perms.some(permission => userPermissions.includes(permission));
      if (hasAny) return next();

      console.warn('Permission missing (any)', { requiredPermissions: perms, userPermissions, role_id: req.session.user.role_id });
      return respondForbidden(req, res, 'এই কাজের অনুমতি নেই');
    } catch (err) {
      console.error('checkAnyPermission error:', err);
      res.status(500).json({ success: false, message: 'পারমিশন চেক করতে সমস্যা হয়েছে' });
    }
  };
};