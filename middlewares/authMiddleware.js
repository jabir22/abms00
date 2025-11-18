// authMiddleware.js

// যেকোনো রুটে লগইন চেক করার middleware
export function requireLogin(req, res, next) {
  // পাবলিক রুটগুলো যেগুলো login ছাড়া দেখা যাবে
  const publicPaths = ['/login', '/signup', '/logout', '/css', '/js', '/images'];

  if (publicPaths.some(path => req.path.startsWith(path))) {
    return next();
  }

  // সেশন আছে কিনা চেক করো
  if (req.session && req.session.user) {
    return next();
  }

  // না থাকলে login পেজে পাঠাও
  return res.redirect('/login');
}

// globalAuth আগের মতোই থাকবে চাইলে
export function globalAuth(req, res, next) {
  const publicPaths = ['/login', '/signup', '/logout', '/css', '/js', '/images'];

  if (publicPaths.some(path => req.path.startsWith(path))) {
    return next();
  }

  if (req.session && req.session.user) {
    return next();
  }

  return res.redirect('/login');
}
