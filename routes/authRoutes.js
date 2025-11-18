import express from 'express';
import { loginUser, signupOwner, logoutUser } from '../controllers/authController.js';
import { authCheck } from '../middlewares/authCheck.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Pages
router.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/');
    }
    res.render('login/login', { csrfToken: req.csrfToken() });
});

router.get('/signup', (req, res) => {
    if (req.session.user) {
        return res.redirect('/');
    }
    res.render('signup/signup', { csrfToken: req.csrfToken() });
});

// Auth actions
router.post('/login', loginUser);
router.post('/signup', signupOwner);
router.get('/logout', logoutUser);

// Protected dashboard
router.get('/dashboard', authCheck, (req, res) => res.sendFile(path.join(__dirname, '../public/dashboard/dashboard.html')));

export default router;
