import express from 'express';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { requireLogin } from '../middlewares/authMiddleware.js';

const router = express.Router();
const __dirname = dirname(fileURLToPath(import.meta.url));

router.get('/', requireLogin, (req, res) => {
  res.render('dashboard/dashboard', {
    user: req.session.user,
    page: 'dashboard',
    title: 'Dashboard'
  });
});

export default router;
