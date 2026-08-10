import jwt from 'jsonwebtoken';

export function verifyAdminSession(req) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return false;

    const token = authHeader.replace('Bearer ', '');
    if (!token) return false;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    return decoded.authenticated === true && 
           decoded.twoFactorVerified === true;
  } catch (error) {
    return false;
  }
}

export function requireAdminAuth(handler) {
  return async (req, res) => {
    const isValid = verifyAdminSession(req);
    if (!isValid) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    return handler(req, res);
  };
}