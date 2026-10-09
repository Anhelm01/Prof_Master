const jwt = require('jsonwebtoken');
const { sendError } = require('../utils/response');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_tourist_planner_jwt_key_2026_waypoint';

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(
      res,
      'Токен авторизации отсутствует или имеет неверный формат (ожидается Bearer <token>)',
      401,
      'UNAUTHORIZED'
    );
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 'Срок действия токена истек', 401, 'TOKEN_EXPIRED');
    }
    return sendError(res, 'Недействительный токен авторизации', 401, 'INVALID_TOKEN');
  }
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch {

    }
  }
  return next();
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return sendError(
        res,
        `Недостаточно прав. Требуется роль «${role}»`,
        403,
        'FORBIDDEN'
      );
    }
    return next();
  };
}

module.exports = {
  verifyToken,
  optionalAuth,
  requireRole,
  JWT_SECRET
};
