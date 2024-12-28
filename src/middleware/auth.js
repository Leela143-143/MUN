const admin = require('firebase-admin');

const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: decodedToken.role || 'user'
    };
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const requireRole = (roles) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization;
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const decodedToken = await admin.auth().verifyIdToken(token);
      const userRole = decodedToken.role || 'user';

      if (!roles.includes(userRole)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        role: userRole
      };

      next();
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
    }
  };
};

module.exports = {
  verifyToken,
  requireRole
}; 