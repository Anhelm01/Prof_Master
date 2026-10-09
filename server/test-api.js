const { spawnSync } = require('child_process');

if (process.env.LD_PRELOAD && process.env.LD_PRELOAD.includes('proxychains')) {
  const env = { ...process.env };
  delete env.LD_PRELOAD;
  const res = spawnSync(process.execPath, process.argv.slice(1), {
    env,
    stdio: 'inherit'
  });
  process.exit(res.status || 0);
}

const assert = require('assert');
const http = require('http');
const app = require('./src/app');

let server;
let baseUrl;

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const headers = { ...options.headers };
    let body = options.body;

    if (body && typeof body === 'object') {
      body = JSON.stringify(body);
      headers['Content-Type'] = 'application/json';
    }

    const req = http.request(url, {
      method: options.method || 'GET',
      headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch {
          json = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: json
        });
      });
    });

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function runTests() {
  console.log('--- ЗАПУСК ИНТЕГРАЦИОННЫХ ТЕСТОВ СЕРВЕРА (II ЭТАП) ---');

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      console.log(`✓ Тестовый сервер поднят на ${baseUrl}`);
      resolve();
    });
  });

  try {

    console.log('\n[1] Проверка Health-check:');
    const health = await request('/api/health');
    assert.strictEqual(health.status, 200, 'Health check должен возвращать 200');
    assert.strictEqual(health.data.success, true);
    assert.strictEqual(health.data.data.status, 'ok');
    console.log('✓ Health-check пройден успешно');

    console.log('\n[2] Каталог объектов (Places API):');
    const placesRes = await request('/api/places');
    assert.strictEqual(placesRes.status, 200);
    assert(placesRes.data.data.places.length >= 10, 'В каталоге должно быть не менее 10 объектов');
    console.log(`✓ Каталог вернул ${placesRes.data.data.places.length} объектов`);

    const naturePlaces = await request('/api/places?category=nature');
    assert(naturePlaces.data.data.places.every(p => p.category === 'nature'), 'Все объекты должны иметь категорию nature');
    console.log(`✓ Фильтрация по категории nature вернула ${naturePlaces.data.data.places.length} объектов`);

    const searchRes = await request('/api/places?search=Эрмитаж');
    assert(searchRes.data.data.places.length >= 1, 'Поиск по «Эрмитаж» должен найти объект');
    assert.strictEqual(searchRes.data.data.places[0].id, 'place-01');
    console.log('✓ Живой поиск по названию отработал корректно');

    const sortedRes = await request('/api/places?sort=cost_asc');
    const costs = sortedRes.data.data.places.map(p => p.cost);
    for (let i = 1; i < costs.length; i++) {
      assert(costs[i] >= costs[i - 1], 'Массив должен быть отсортирован по возрастанию цены');
    }
    console.log('✓ Сортировка по стоимости (cost_asc) корректна');

    const singlePlace = await request('/api/places/place-01');
    assert.strictEqual(singlePlace.status, 200);
    assert.strictEqual(singlePlace.data.data.title, 'Эрмитаж');
    assert(Array.isArray(singlePlace.data.data.tags), 'Теги должны быть распарсены в массив');
    console.log('✓ Детальная карточка места place-01 успешно получена');

    const notFoundPlace = await request('/api/places/unknown-999');
    assert.strictEqual(notFoundPlace.status, 404);
    assert.strictEqual(notFoundPlace.data.success, false);
    assert.strictEqual(notFoundPlace.data.error.code, 'PLACE_NOT_FOUND');
    console.log('✓ 404 обработка несуществующего объекта корректна');

    console.log('\n[3] Аутентификация и валидация (Auth API):');
    const testUser = `user_${Date.now()}`;
    const testEmail = `${testUser}@test.com`;

    const badReg = await request('/api/auth/register', {
      method: 'POST',
      body: { username: testUser, email: 'not-an-email', password: '123' }
    });
    assert.strictEqual(badReg.status, 400);
    assert.strictEqual(badReg.data.error.code, 'VALIDATION_ERROR');
    assert(badReg.data.error.details.length >= 2, 'Должны быть ошибки по email и паролю');
    console.log('✓ Валидация некорректных полей регистрации (400) отработала');

    const regRes = await request('/api/auth/register', {
      method: 'POST',
      body: { username: testUser, email: testEmail, password: 'password123' }
    });
    assert.strictEqual(regRes.status, 201);
    assert(regRes.data.data.token, 'Регистрация должна вернуть JWT токен');
    assert.strictEqual(regRes.data.data.user.username, testUser);
    const userToken = regRes.data.data.token;
    console.log('✓ Пользователь успешно зарегистрирован (201 Created)');

    const dupReg = await request('/api/auth/register', {
      method: 'POST',
      body: { username: testUser, email: testEmail, password: 'password123' }
    });
    assert.strictEqual(dupReg.status, 409);
    console.log('✓ Конфликт повторной регистрации (409 Conflict) отработал');

    const loginRes = await request('/api/auth/login', {
      method: 'POST',
      body: { login: testEmail, password: 'password123' }
    });
    assert.strictEqual(loginRes.status, 200);
    assert(loginRes.data.data.token);
    console.log('✓ Успешный вход в систему (200 OK)');

    const badLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { login: testEmail, password: 'wrongpassword' }
    });
    assert.strictEqual(badLogin.status, 401);
    console.log('✓ Отказ при неверном пароле (401 Unauthorized) отработал');

    const noTokenRes = await request('/api/auth/me');
    assert.strictEqual(noTokenRes.status, 401);
    console.log('✓ Доступ к защищенному роуту без токена заблокирован (401)');

    const meRes = await request('/api/auth/me', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert.strictEqual(meRes.status, 200);
    assert.strictEqual(meRes.data.data.username, testUser);
    console.log('✓ Профиль текущего пользователя успешно получен по JWT');

    console.log('\n[4] Серверная бизнес-логика и расчеты (Calculations):');

    const calcNormal = await request('/api/routes/calculate', {
      method: 'POST',
      body: {
        place_ids: ['place-01', 'place-03'],
        max_duration_minutes: 480,
        max_budget: 3000
      }
    });
    assert.strictEqual(calcNormal.status, 200);
    const m1 = calcNormal.data.data.calculations;
    assert.strictEqual(m1.placesCount, 2);
    assert.strictEqual(m1.totalPlacesDurationMinutes, 270);
    assert.strictEqual(m1.transferTimeMinutes, 20);
    assert.strictEqual(m1.totalDurationMinutes, 290);
    assert.strictEqual(m1.totalCost, 500);
    assert.strictEqual(m1.isOverDurationLimit, false);
    assert.strictEqual(m1.timeline.length, 2);
    assert.strictEqual(m1.timeline[0].arrivalTime, '09:00');
    assert.strictEqual(m1.timeline[0].departureTime, '12:00');
    assert.strictEqual(m1.timeline[1].arrivalTime, '12:20');
    console.log('✓ Авторасчет времени, стоимости, трансферов и таймлайна в пределах лимита успешен');

    const calcOver = await request('/api/routes/calculate', {
      method: 'POST',
      body: {
        place_ids: ['place-01', 'place-03'],
        max_duration_minutes: 180,
        max_budget: 300
      }
    });
    const m2 = calcOver.data.data.calculations;
    assert.strictEqual(m2.isOverDurationLimit, true);
    assert.strictEqual(m2.overheadDurationMinutes, 110);
    assert(m2.durationWarning !== null, 'Должно быть предупреждение о превышении длительности');
    assert.strictEqual(m2.isOverBudgetLimit, true);
    assert.strictEqual(m2.overheadBudget, 200);
    assert(m2.optimizationSuggestion !== null, 'Должна быть сформирована рекомендация по оптимизации');
    assert.strictEqual(m2.optimizationSuggestion.suggestedPlaceId, 'place-01', 'Сервер должен предложить убрать самый долгий объект (Эрмитаж)');
    console.log('✓ Обнаружение превышения лимитов времени и бюджета, предупреждения и оптимизация отработали');

    console.log('\n[5] Управление пользовательскими маршрутами (Routes CRUD):');
    const createRouteRes = await request('/api/routes', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: {
        title: 'Мой тестовый уикенд',
        description: 'Классная прогулка',
        max_duration_minutes: 420,
        max_budget: 2000,
        place_ids: ['place-01', 'place-02']
      }
    });
    assert.strictEqual(createRouteRes.status, 201);
    const routeId = createRouteRes.data.data.id;
    assert(routeId > 0);
    assert.strictEqual(createRouteRes.data.data.places.length, 2);
    console.log(`✓ Создан маршрут id=${routeId} с 2 объектами`);

    const addPlaceRes = await request(`/api/routes/${routeId}/places`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: { place_id: 'place-03', custom_note: 'Не забыть зонт' }
    });
    assert.strictEqual(addPlaceRes.status, 200);
    assert.strictEqual(addPlaceRes.data.data.places.length, 3);
    console.log('✓ Объект place-03 успешно добавлен в маршрут (шагов: 3)');

    const reorderRes = await request(`/api/routes/${routeId}/places/reorder`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${userToken}` },
      body: { place_ids: ['place-03', 'place-01', 'place-02'] }
    });
    assert.strictEqual(reorderRes.status, 200);
    const newPlacesOrder = reorderRes.data.data.places.map(p => p.id);
    assert.deepStrictEqual(newPlacesOrder, ['place-03', 'place-01', 'place-02']);
    console.log('✓ Перестановка порядка мест (reorder) прошла успешно');

    const statusRes = await request(`/api/routes/${routeId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${userToken}` },
      body: { status: 'planned' }
    });
    assert.strictEqual(statusRes.status, 200);
    assert.strictEqual(statusRes.data.data.status, 'planned');
    console.log('✓ Переход состояния жизненного цикла draft -> planned успешен');

    const badStatusRes = await request(`/api/routes/${routeId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${userToken}` },
      body: { status: 'non_existent_status' }
    });
    assert.strictEqual(badStatusRes.status, 422);
    console.log('✓ Защита от недопустимого статуса (422 Unprocessable Entity) сработала');

    const removePlaceRes = await request(`/api/routes/${routeId}/places/place-01`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert.strictEqual(removePlaceRes.status, 200);
    assert.strictEqual(removePlaceRes.data.data.places.length, 2);
    console.log('✓ Объект удален из маршрута, оставшиеся шаги перенумерованы');

    const delRouteRes = await request(`/api/routes/${routeId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert.strictEqual(delRouteRes.status, 200);
    console.log('✓ Маршрут успешно удален');

    console.log('\n[6] Ролевой доступ и права администратора (Role-based access):');
    const adminLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { login: 'admin', password: 'admin123' }
    });
    assert.strictEqual(adminLogin.status, 200);
    const adminToken = adminLogin.data.data.token;

    const forbiddenPlace = await request('/api/places', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: {
        title: 'Новый музей',
        category: 'culture',
        duration_minutes: 60,
        cost: 300
      }
    });
    assert.strictEqual(forbiddenPlace.status, 403);
    console.log('✓ Защита от создания объекта без прав администратора (403 Forbidden) сработала');

    const newPlaceId = `test-place-${Date.now()}`;
    const createPlaceRes = await request('/api/places', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        id: newPlaceId,
        title: 'Тестовая смотровая площадка',
        category: 'architecture',
        duration_minutes: 45,
        cost: 200
      }
    });
    assert.strictEqual(createPlaceRes.status, 201);
    console.log('✓ Администратор успешно создал новый объект (201 Created)');

    const deletePlaceRes = await request(`/api/places/${newPlaceId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(deletePlaceRes.status, 200);
    console.log('✓ Администратор успешно удалил объект');

    console.log('\n=======================================================');
    console.log('🎉 ВСЕ ИНТЕГРАЦИОННЫЕ ТЕСТЫ СЕРВЕРА ПРОЙДЕНЫ БЕЗ ОШИБОК!');
    console.log('=======================================================');
  } finally {
    if (server) {
      await new Promise(resolve => server.close(resolve));
    }
  }
}

runTests().catch(err => {
  console.error('\n❌ ОШИБКА В ТЕСТАХ API:', err);
  process.exit(1);
});
