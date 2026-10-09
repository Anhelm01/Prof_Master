require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Waypoint Tourist Planner Backend запущен на порту ${PORT}`);
  console.log(`📍 Базовый URL: http://localhost:${PORT}/api`);
  console.log(`🩺 Health-check: http://localhost:${PORT}/api/health`);
  console.log(`=======================================================`);
});

module.exports = server;
