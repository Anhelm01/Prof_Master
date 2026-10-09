const { sendError } = require('../utils/response');

const VALID_CATEGORIES = ['culture', 'architecture', 'nature', 'food', 'activity'];

function validateRegister(req, res, next) {
  const { username, email, password } = req.body || {};
  const details = [];

  if (!username || typeof username !== 'string' || username.trim().length < 3) {
    details.push({
      field: 'username',
      message: 'Имя пользователя должно содержать не менее 3 символов'
    });
  }

  const emailRegex = new RegExp('^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$');
  if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
    details.push({
      field: 'email',
      message: 'Укажите корректный email адрес (например, user@example.com)'
    });
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    details.push({
      field: 'password',
      message: 'Пароль должен содержать не менее 6 символов'
    });
  }

  if (details.length > 0) {
    return sendError(
      res,
      'Ошибка валидации входящих данных регистрации',
      400,
      'VALIDATION_ERROR',
      details
    );
  }

  req.body.username = username.trim();
  req.body.email = email.trim().toLowerCase();
  return next();
}

function validateLogin(req, res, next) {
  const { login, email, username, password } = req.body || {};
  const userIdentifier = login || email || username;
  const details = [];

  if (!userIdentifier || typeof userIdentifier !== 'string' || !userIdentifier.trim()) {
    details.push({
      field: 'login',
      message: 'Укажите email или имя пользователя'
    });
  }

  if (!password || typeof password !== 'string' || !password) {
    details.push({
      field: 'password',
      message: 'Укажите пароль'
    });
  }

  if (details.length > 0) {
    return sendError(
      res,
      'Не заполнены обязательные поля для входа',
      400,
      'VALIDATION_ERROR',
      details
    );
  }

  req.body.login = userIdentifier.trim();
  return next();
}

function validatePlace(req, res, next) {
  const { title, category, duration_minutes, cost } = req.body || {};
  const details = [];

  if (!title || typeof title !== 'string' || !title.trim()) {
    details.push({ field: 'title', message: 'Название объекта обязательно для заполнения' });
  }

  if (!category || !VALID_CATEGORIES.includes(category)) {
    details.push({
      field: 'category',
      message: `Категория должна быть одной из: ${VALID_CATEGORIES.join(', ')}`
    });
  }

  if (duration_minutes !== undefined && (isNaN(Number(duration_minutes)) || Number(duration_minutes) <= 0)) {
    details.push({
      field: 'duration_minutes',
      message: 'Длительность посещения должна быть положительным числом минут'
    });
  }

  if (cost !== undefined && (isNaN(Number(cost)) || Number(cost) < 0)) {
    details.push({
      field: 'cost',
      message: 'Стоимость должна быть неотрицательным числом'
    });
  }

  if (details.length > 0) {
    return sendError(
      res,
      'Ошибка валидации параметров объекта',
      400,
      'VALIDATION_ERROR',
      details
    );
  }

  return next();
}

function validateRoute(req, res, next) {
  const { title, max_duration_minutes, max_budget } = req.body || {};
  const details = [];

  if (!title || typeof title !== 'string' || !title.trim()) {
    details.push({ field: 'title', message: 'Название маршрута обязательно для заполнения' });
  }

  if (max_duration_minutes !== undefined && (isNaN(Number(max_duration_minutes)) || Number(max_duration_minutes) <= 0)) {
    details.push({
      field: 'max_duration_minutes',
      message: 'Максимальная продолжительность должна быть положительным числом минут'
    });
  }

  if (max_budget !== undefined && (isNaN(Number(max_budget)) || Number(max_budget) < 0)) {
    details.push({
      field: 'max_budget',
      message: 'Бюджет должен быть неотрицательным числом'
    });
  }

  if (details.length > 0) {
    return sendError(
      res,
      'Ошибка валидации параметров маршрута',
      400,
      'VALIDATION_ERROR',
      details
    );
  }

  return next();
}

module.exports = {
  validateRegister,
  validateLogin,
  validatePlace,
  validateRoute,
  VALID_CATEGORIES
};
