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
    
    // Get user with scout information if applicable
    const { data: user, error } = await database.getDB()
      .from('users')
      .select(`
        *,
        scout:scouts(id, scout_role)
      `)
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (user.lockout_until && new Date() < new Date(user.lockout_until)) {
      return res.status(423).json({ error: 'Account temporarily locked' });
    }

    // Add scout ID to user object for easy access
    if (user.scout) {
      user.scoutId = user.scout.id;
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

module.exports = { 
  authenticateToken: verifyToken, 
  verifyToken, 
  requireRole 
};