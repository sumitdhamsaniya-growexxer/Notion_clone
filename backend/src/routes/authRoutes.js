// backend/src/routes/authRoutes.js
const express = require('express');
const { body } = require('express-validator');
const { register, login, refresh, logout } = require('../controllers/authController');

const router = express.Router();

const registerValidation = [
  body('email').trim().isEmail().withMessage('Valid email required.').normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .matches(/\d/).withMessage('Password must contain at least 1 number.'),
];

const loginValidation = [
  body('email').trim().isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Password required.'),
];

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/refresh', refresh);
router.post('/logout', logout);

module.exports = router;
