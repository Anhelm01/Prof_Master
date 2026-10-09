const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const placesRoutes = require('./routes/placesRoutes');
const routesRoutes = require('./routes/routesRoutes');
const { sendError, sendSuccess } = require('./utils/response');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  return sendSuccess(res, {
    status: 'ok',
    service: 'Waypoint Tourist Planner API',
    stage: 'II этап конкурса профессионального мастерства',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/places', placesRoutes);
app.use('/api/routes', routesRoutes);

app.use('/api/*', (req, res) => {
  return sendError(
    res,
    `Маршрут API ${req.method} ${req.originalUrl} не найден`,
    404,
    'NOT_FOUND'
  );
});

app.use((err, req, res, next) => {
  console.error('Необработанная ошибка сервера:', err);
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return sendError(res, 'Некорректный JSON в теле запроса', 400, 'INVALID_JSON');
  }
  return sendError(
    res,
    err.message || 'Внутренняя непредвиденная ошибка сервера',
    500,
    'INTERNAL_SERVER_ERROR'
  );
});

module.exports = app;
