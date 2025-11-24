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

// Login - Production-ready authentication endpoint
router.post('/login', loginLimiter, [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .matches(/^[a-zA-Z0-9._-]+$/)
    .withMessage('Username must be 3-50 characters and contain only letters, numbers, dots, underscores, or hyphens'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
], async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Input validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Invalid input', 
        details: errors.array().map(err => err.msg)
      });
    }

    const { username, password } = req.body;
    const supabase = database.getDB();

    // Query user by username
    const { data: user, error: queryError } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    // Constant-time response to prevent username enumeration
    if (queryError || !user) {
      // Simulate password hashing time even for non-existent users
      await bcrypt.hash('dummy', parseInt(process.env.BCRYPT_ROUNDS));
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Check account lockout
    if (user.lockout_until && new Date() < new Date(user.lockout_until)) {
      const lockoutRemaining = Math.ceil((new Date(user.lockout_until) - new Date()) / 1000 / 60);
      return res.status(423).json({ 
        error: 'Account temporarily locked', 
        lockoutMinutes: lockoutRemaining 
      });
    }

    // Verify password with constant-time comparison
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      // Increment failed attempts
      const attempts = (user.login_attempts || 0) + 1;
      const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS);
      const lockoutTime = parseInt(process.env.LOCKOUT_TIME);
      
      let lockoutUntil = null;
      if (attempts >= maxAttempts) {
        lockoutUntil = new Date(Date.now() + lockoutTime * 60 * 1000).toISOString();
      }

      await supabase
        .from('users')
        .update({
          login_attempts: attempts,
          lockout_until: lockoutUntil,
          last_failed_login: new Date().toISOString()
        })
        .eq('id', user.id);

      // Log security event
      console.warn(`Failed login attempt for user: ${username}, attempts: ${attempts}, IP: ${req.ip}`);
      
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Successful login - reset attempts and generate tokens
    await supabase
      .from('users')
      .update({
        login_attempts: 0,
        lockout_until: null,
        last_login: new Date().toISOString()
      })
      .eq('id', user.id);

    const { accessToken, refreshToken } = generateTokens(user.id);

    // Store refresh token in separate table
    await supabase
      .from('refresh_tokens')
      .insert({
        user_id: user.id,
        token: refreshToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });

    // Log successful login
    console.log(`Successful login for user: ${username}, IP: ${req.ip}`);

    // Response with minimal user data
    res.json({
      success: true,
      message: 'Authentication successful',
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      },
      accessToken,
      refreshToken,
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN
    });

  } catch (error) {
    console.error('Authentication error:', error);
    
    // Ensure consistent response time
    const elapsed = Date.now() - startTime;
    const minResponseTime = 100; // Minimum 100ms response time
    if (elapsed < minResponseTime) {
      await new Promise(resolve => setTimeout(resolve, minResponseTime - elapsed));
    }
    
    res.status(500).json({ error: 'Authentication service unavailable' });
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