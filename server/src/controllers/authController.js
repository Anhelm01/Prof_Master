const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/db');
const { sendSuccess, sendError } = require('../utils/response');
const { JWT_SECRET } = require('../middleware/auth');

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function register(req, res) {
  try {
    const { username, email, password } = req.body;

    const existingUser = db.prepare(`
      SELECT username, email FROM users
      WHERE username = ? OR email = ?
    `).get(username, email);

    if (existingUser) {
      if (existingUser.username === username) {
        return sendError(res, `Пользователь с именем «${username}» уже существует`, 409, 'USERNAME_TAKEN');
      }
      return sendError(res, `Пользователь с email «${email}» уже зарегистрирован`, 409, 'EMAIL_TAKEN');
    }

    const saltRounds = 10;
    const password_hash = bcrypt.hashSync(password, saltRounds);

    const insertStmt = db.prepare(`
      INSERT INTO users (username, email, password_hash, role)
      VALUES (?, ?, ?, 'user')
    `);

    const result = insertStmt.run(username, email, password_hash);
    const userId = Number(result.lastInsertRowid);

    const payload = {
      id: userId,
      username,
      email,
      role: 'user'
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return sendSuccess(
      res,
      {
        token,
        user: payload
      },
      201,
      'Пользователь успешно зарегистрирован'
    );
  } catch (err) {
    console.error('Ошибка при регистрации:', err);
    return sendError(res, 'Внутренняя ошибка сервера при регистрации', 500, 'INTERNAL_SERVER_ERROR');
  }
}

function login(req, res) {
  try {
    const { login, password } = req.body;

    const user = db.prepare(`
      SELECT id, username, email, password_hash, role
      FROM users
      WHERE username = ? OR email = ?
    `).get(login, login.toLowerCase());

    if (!user) {
      return sendError(res, 'Неверное имя пользователя или пароль', 401, 'INVALID_CREDENTIALS');
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return sendError(res, 'Неверное имя пользователя или пароль', 401, 'INVALID_CREDENTIALS');
    }

    const payload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return sendSuccess(
      res,
      {
        token,
        user: payload
      },
      200,
      'Авторизация успешна'
    );
  } catch (err) {
    console.error('Ошибка при авторизации:', err);
    return sendError(res, 'Внутренняя ошибка сервера при авторизации', 500, 'INTERNAL_SERVER_ERROR');
  }
}

function getMe(req, res) {
  try {
    const user = db.prepare(`
      SELECT id, username, email, role, created_at
      FROM users
      WHERE id = ?
    `).get(req.user.id);

    if (!user) {
      return sendError(res, 'Пользователь не найден', 404, 'USER_NOT_FOUND');
    }

    return sendSuccess(res, user);
  } catch (err) {
    console.error('Ошибка получения профиля:', err);
    return sendError(res, 'Внутренняя ошибка сервера', 500, 'INTERNAL_SERVER_ERROR');
  }
}

module.exports = {
  register,
  login,
  getMe
};
