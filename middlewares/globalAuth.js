export function globalAuth(req, res, next) {
  const publicPaths = [
    '/login',
    '/signup',
    '/logout',
    '/css/',
    '/js/',
    '/images/',
    '/assets/',
    '/fonts/',
    '/favicon.ico',
    '/uploads/',
    '/api/public/'
  ];

  // ✅ পাবলিক রুট চেক করা (যেগুলো login ছাড়া দেখা যাবে)
  if (publicPaths.some(path => req.originalUrl.startsWith(path))) {
    return next();
  }

  // ✅ সেশন চেক (consistent key: loggedIn)
  if (req.session && req.session.loggedIn) {
    return next();
  }

  // ❌ না থাকলে login পেজে পাঠাও
  return res.redirect('/login');
}
