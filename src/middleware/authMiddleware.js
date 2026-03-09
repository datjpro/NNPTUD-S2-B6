const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/auth');
const User = require('../../models/User');

async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access token is required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    const user = await User.findOne({
      _id: payload.sub,
      deletedAt: null
    }).populate('role');

    if (!user) {
      return res.status(401).json({ message: 'User not found or deleted' });
    }

    if (!user.status) {
      return res.status(403).json({ message: 'User account is disabled' });
    }

    req.user = {
      sub: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role ? user.role.name : null
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication is required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to access this resource' });
    }

    next();
  };
}

function authorizeAdminOrReadAll(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication is required' });
  }

  if (req.user.role === 'admin') {
    return next();
  }

  if (req.user.role === 'mod' && req.method === 'GET') {
    return next();
  }

  return res.status(403).json({ message: 'You do not have permission to access this resource' });
}

module.exports = {
  authenticateToken,
  authorizeRoles,
  authorizeAdminOrReadAll
};
