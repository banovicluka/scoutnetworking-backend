const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const database = require('../config/database');
const { verifyToken } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/security');

const router = express.Router();

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN
  });
  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN
  });
  return { accessToken, refreshToken };
};

// Register
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
  body('role').optional().isIn(['user', 'scout'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, role = 'user' } = req.body;
    const db = database.getDB();

    // Check if user exists
    const [existingUser] = await db.query('SELECT * FROM users WHERE email = $email', { email });
    if (existingUser.result.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS));

    // Create user
    const [result] = await db.query(`
      CREATE users CONTENT {
        email: $email,
        password: $password,
        role: $role,
        createdAt: time::now(),
        updatedAt: time::now()
      }
    `, { email, password: hashedPassword, role });

    const user = result.result[0];
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Store refresh token
    await db.query(`
      UPDATE $userId SET refreshTokens = array::append(refreshTokens, $refreshToken)
    `, { userId: user.id, refreshToken });

    res.status(201).json({
      message: 'User registered successfully',
      user: { id: user.id, email: user.email, role: user.role },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', loginLimiter, [
  body('email').notEmpty(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const db = database.getDB();

    const [result] = await db.query('SELECT * FROM users WHERE email = $email OR username = $email', { email });
    const user = result.result[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if account is locked
    if (user.lockoutUntil && new Date() < new Date(user.lockoutUntil)) {
      return res.status(423).json({ error: 'Account temporarily locked' });
    }

    // Verify password (support both bcrypt and plain text for existing users)
    const isValidPassword = await bcrypt.compare(password, user.password) || password === user.password;
    if (!isValidPassword) {
      // Increment login attempts
      const attempts = (user.loginAttempts || 0) + 1;
      const lockoutUntil = attempts >= parseInt(process.env.MAX_LOGIN_ATTEMPTS) 
        ? new Date(Date.now() + parseInt(process.env.LOCKOUT_TIME) * 60 * 1000)
        : null;

      await db.query(`
        UPDATE $userId SET loginAttempts = $attempts, lockoutUntil = $lockoutUntil
      `, { userId: user.id, attempts, lockoutUntil });

      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Reset login attempts on successful login
    await db.query(`
      UPDATE $userId SET loginAttempts = 0, lockoutUntil = NONE
    `, { userId: user.id });

    const { accessToken, refreshToken } = generateTokens(user.id);

    // Store refresh token
    await db.query(`
      UPDATE $userId SET refreshTokens = array::append(refreshTokens, $refreshToken)
    `, { userId: user.id, refreshToken });

    res.json({
      message: 'Login successful',
      user: { id: user.id, email: user.email, role: user.role },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const db = database.getDB();

    const [result] = await db.query('SELECT * FROM users WHERE id = $userId', { userId: decoded.userId });
    const user = result.result[0];

    if (!user || !user.refreshTokens.includes(refreshToken)) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id);

    // Replace old refresh token with new one
    await db.query(`
      UPDATE $userId SET refreshTokens = array::append(
        array::remove(refreshTokens, $oldToken), $newToken
      )
    `, { userId: user.id, oldToken: refreshToken, newToken: newRefreshToken });

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (error) {
    res.status(403).json({ error: 'Invalid refresh token' });
  }
});

// Logout
router.post('/logout', verifyToken, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const db = database.getDB();

    if (refreshToken) {
      await db.query(`
        UPDATE $userId SET refreshTokens = array::remove(refreshTokens, $refreshToken)
      `, { userId: req.user.id, refreshToken });
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Get current user
router.get('/me', verifyToken, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      createdAt: req.user.createdAt
    }
  });
});

module.exports = router;