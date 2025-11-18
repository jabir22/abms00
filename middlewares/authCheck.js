export const authCheck = (req, res, next) => {
  if (req.session?.loggedIn && req.session?.user) return next();

  // If request expects JSON (fetch/AJAX), return 401 JSON instead of redirecting to login page
  const acceptsJson = req.xhr || (req.headers['accept'] && req.headers['accept'].includes('application/json')) || req.headers['x-requested-with'] === 'XMLHttpRequest';
  if (acceptsJson) {
    return res.status(401).json({ success: false, message: 'সেশন মেয়াদ উত্তীর্ণ বা অনুপযুক্ত অনুমতি' });
  }

  // Default: redirect browser to login page
  return res.redirect('/login');
};
