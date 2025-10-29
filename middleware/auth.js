const jwt = require('jsonwebtoken');
const database = require('../config/database');

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const db = database.getDB();
    
    const [user] = await db.select(`users:${decoded.userId}`);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (user.lockoutUntil && new Date() < new Date(user.lockoutUntil)) {
      return res.status(423).json({ error: 'Account temporarily locked' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(403).json({ error: 'Invalid token' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

module.exports = { verifyToken, requireRole };