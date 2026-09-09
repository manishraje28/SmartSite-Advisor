const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/auth');

// POST /api/auth/register
router.post('/register', authController.register);

// POST /api/auth/login
router.post('/login', authController.login);

// POST /api/auth/google — Google Identity Services ID-token sign-in
router.post('/google', authController.googleLogin);

// GET /api/auth/me - Get current user from token
router.get('/me', protect, authController.getMe);

module.exports = router;
