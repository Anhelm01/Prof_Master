const { db } = require('../config/db');
const { sendSuccess, sendError } = require('../utils/response');
const { formatPlace } = require('./placesController');
const {
  calculateRouteMetrics,
  isValidStatusTransition
} = require('../utils/calculations');

function getRoutePlacesWithDetails(routeId) {
  const rows = db.prepare(`
    SELECT
      rp.id as route_place_id,
      rp.step_order,
      rp.custom_note,
      p.*
    FROM route_places rp
    JOIN places p ON rp.place_id = p.id
    WHERE rp.route_id = ?
    ORDER BY rp.step_order ASC
  `).all(routeId);

  return rows.map(row => {
    const formatted = formatPlace(row);
    formatted.stepOrder = row.step_order;
    formatted.customNote = row.custom_note || '';
    return formatted;
  });
}

function buildFullRouteObject(routeRow) {
  const places = getRoutePlacesWithDetails(routeRow.id);
  const calculations = calculateRouteMetrics(places, {
    maxDurationMinutes: routeRow.max_duration_minutes,
    maxBudget: routeRow.max_budget
  });

  return {
    id: routeRow.id,
    userId: routeRow.user_id,
    title: routeRow.title,
    description: routeRow.description || '',
    maxDurationMinutes: routeRow.max_duration_minutes,
    maxBudget: routeRow.max_budget,
    notes: routeRow.notes || '',
    isPublic: Boolean(routeRow.is_public),
    status: routeRow.status,
    createdAt: routeRow.created_at,
    updatedAt: routeRow.updated_at,
    places,
    calculations
  };
}

function getUserRoutes(req, res) {
  try {
    const userId = req.user.id;
    const { includePublic } = req.query;

    let query = 'SELECT * FROM routes WHERE user_id = ?';
    const params = [userId];

    if (includePublic === 'true') {
      query = 'SELECT * FROM routes WHERE user_id = ? OR is_public = 1';
      params.length = 0;
      params.push(userId);
    }

    query += ' ORDER BY updated_at DESC, id DESC';
    const routes = db.prepare(query).all(...params);

    const fullRoutes = routes.map(buildFullRouteObject);
    return sendSuccess(res, {
      total: fullRoutes.length,
      routes: fullRoutes
    });
  } catch (err) {
    console.error('Ошибка получения маршрутов:', err);
    return sendError(res, 'Ошибка получения списка маршрутов', 500, 'INTERNAL_SERVER_ERROR');
  }
}

function getRouteById(req, res) {
  try {
    const { id } = req.params;
    const route = db.prepare('SELECT * FROM routes WHERE id = ?').get(id);

    if (!route) {
      return sendError(res, `Маршрут с ID «${id}» не найден`, 404, 'ROUTE_NOT_FOUND');
    }

    const isOwner = req.user && req.user.id === route.user_id;
    const isAdmin = req.user && req.user.role === 'admin';
    const isPublic = Boolean(route.is_public);

    if (!isOwner && !isAdmin && !isPublic) {
      return sendError(res, 'Доступ запрещен. Это приватный маршрут другого пользователя', 403, 'FORBIDDEN');
    }

    const fullRoute = buildFullRouteObject(route);
    return sendSuccess(res, fullRoute);
  } catch (err) {
    console.error('Ошибка получения маршрута:', err);
    return sendError(res, 'Внутренняя ошибка сервера', 500, 'INTERNAL_SERVER_ERROR');
  }
}

function createRoute(req, res) {
  try {
    const userId = req.user.id;
    const {
      title,
      description = '',
      max_duration_minutes = 480,
      max_budget = 5000,
      notes = '',
      is_public = 0,
      place_ids = []
    } = req.body;

    const insertRoute = db.prepare(`
      INSERT INTO routes (
        user_id, title, description, max_duration_minutes, max_budget, notes, is_public, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'draft')
    `);

    const result = insertRoute.run(
      userId,
      title,
      description,
      Number(max_duration_minutes) || 480,
      Number(max_budget) || 5000,
      notes,
      is_public ? 1 : 0
    );

    const routeId = Number(result.lastInsertRowid);

    if (Array.isArray(place_ids) && place_ids.length > 0) {
      const insertPlace = db.prepare(`
        INSERT INTO route_places (route_id, place_id, step_order, custom_note)
        VALUES (?, ?, ?, '')
      `);

      place_ids.forEach((placeId, index) => {

        const exists = db.prepare('SELECT id FROM places WHERE id = ?').get(placeId);
        if (exists) {
          insertPlace.run(routeId, placeId, index + 1);
        }
      });
    }

    const createdRoute = db.prepare('SELECT * FROM routes WHERE id = ?').get(routeId);
    const fullRoute = buildFullRouteObject(createdRoute);

    return sendSuccess(res, fullRoute, 201, 'Маршрут успешно создан');
  } catch (err) {
    console.error('Ошибка создания маршрута:', err);
    return sendError(res, 'Внутренняя ошибка сервера при создании маршрута', 500, 'INTERNAL_SERVER_ERROR');
  }
}

function updateRoute(req, res) {
  try {
    const { id } = req.params;
    const route = db.prepare('SELECT * FROM routes WHERE id = ?').get(id);

    if (!route) {
      return sendError(res, `Маршрут с ID «${id}» не найден`, 404, 'ROUTE_NOT_FOUND');
    }

    if (route.user_id !== req.user.id && req.user.role !== 'admin') {
      return sendError(res, 'Вы можете редактировать только собственные маршруты', 403, 'FORBIDDEN');
    }

    const {
      title,
      description,
      max_duration_minutes,
      max_budget,
      notes,
      is_public
    } = req.body;

    const updatedTitle = title !== undefined ? title : route.title;
    const updatedDesc = description !== undefined ? description : route.description;
    const updatedMaxDuration = max_duration_minutes !== undefined ? Number(max_duration_minutes) : route.max_duration_minutes;
    const updatedMaxBudget = max_budget !== undefined ? Number(max_budget) : route.max_budget;
    const updatedNotes = notes !== undefined ? notes : route.notes;
    const updatedIsPublic = is_public !== undefined ? (is_public ? 1 : 0) : route.is_public;

    db.prepare(`
      UPDATE routes SET
        title = ?,
        description = ?,
        max_duration_minutes = ?,
        max_budget = ?,
        notes = ?,
        is_public = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      updatedTitle,
      updatedDesc,
      updatedMaxDuration,
      updatedMaxBudget,
      updatedNotes,
      updatedIsPublic,
      id
    );

    const updated = db.prepare('SELECT * FROM routes WHERE id = ?').get(id);
    return sendSuccess(res, buildFullRouteObject(updated), 200, 'Параметры маршрута обновлены');
  } catch (err) {
    console.error('Ошибка обновления маршрута:', err);
    return sendError(res, 'Внутренняя ошибка сервера', 500, 'INTERNAL_SERVER_ERROR');
  }
}

function deleteRoute(req, res) {
  try {
    const { id } = req.params;
    const route = db.prepare('SELECT * FROM routes WHERE id = ?').get(id);

    if (!route) {
      return sendError(res, `Маршрут с ID «${id}» не найден`, 404, 'ROUTE_NOT_FOUND');
    }

    if (route.user_id !== req.user.id && req.user.role !== 'admin') {
      return sendError(res, 'Вы можете удалять только собственные маршруты', 403, 'FORBIDDEN');
    }

    db.prepare('DELETE FROM routes WHERE id = ?').run(id);
    return sendSuccess(res, { deletedId: Number(id) }, 200, 'Маршрут успешно удален');
  } catch (err) {
    console.error('Ошибка удаления маршрута:', err);
    return sendError(res, 'Внутренняя ошибка сервера', 500, 'INTERNAL_SERVER_ERROR');
  }
}

function addPlaceToRoute(req, res) {
  try {
    const { id } = req.params;
    const route = db.prepare('SELECT * FROM routes WHERE id = ?').get(id);

    if (!route) {
      return sendError(res, `Маршрут с ID «${id}» не найден`, 404, 'ROUTE_NOT_FOUND');
    }

    if (route.user_id !== req.user.id && req.user.role !== 'admin') {
      return sendError(res, 'Вы можете изменять только свои маршруты', 403, 'FORBIDDEN');
    }

    const { place_id, placeId, custom_note = '' } = req.body;
    const targetPlaceId = place_id || placeId;

    if (!targetPlaceId) {
      return sendError(res, 'Не указан ID туристического объекта (place_id)', 400, 'MISSING_PLACE_ID');
    }

    const placeExists = db.prepare('SELECT id FROM places WHERE id = ?').get(targetPlaceId);
    if (!placeExists) {
      return sendError(res, `Объект с ID «${targetPlaceId}» не существует в каталоге`, 404, 'PLACE_NOT_FOUND');
    }

    const maxOrderRow = db.prepare('SELECT MAX(step_order) as maxOrder FROM route_places WHERE route_id = ?').get(id);
    const nextOrder = (maxOrderRow.maxOrder || 0) + 1;

    db.prepare(`
      INSERT INTO route_places (route_id, place_id, step_order, custom_note)
      VALUES (?, ?, ?, ?)
    `).run(id, targetPlaceId, nextOrder, custom_note);

    db.prepare('UPDATE routes SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);

    const updated = db.prepare('SELECT * FROM routes WHERE id = ?').get(id);
    return sendSuccess(res, buildFullRouteObject(updated), 200, 'Объект успешно добавлен в маршрут');
  } catch (err) {
    console.error('Ошибка добавления объекта в маршрут:', err);
    return sendError(res, 'Внутренняя ошибка сервера', 500, 'INTERNAL_SERVER_ERROR');
  }
}

function removePlaceFromRoute(req, res) {
  try {
    const { id, placeId } = req.params;
    const route = db.prepare('SELECT * FROM routes WHERE id = ?').get(id);

    if (!route) {
      return sendError(res, `Маршрут с ID «${id}» не найден`, 404, 'ROUTE_NOT_FOUND');
    }

    if (route.user_id !== req.user.id && req.user.role !== 'admin') {
      return sendError(res, 'Вы можете изменять только свои маршруты', 403, 'FORBIDDEN');
    }

    const existingLink = db.prepare(`
      SELECT id FROM route_places
      WHERE route_id = ? AND place_id = ?
    `).get(id, placeId);

    if (!existingLink) {
      return sendError(res, `Объект «${placeId}» отсутствует в данном маршруте`, 404, 'PLACE_NOT_IN_ROUTE');
    }

    db.prepare('DELETE FROM route_places WHERE route_id = ? AND place_id = ?').run(id, placeId);

    const remaining = db.prepare('SELECT id FROM route_places WHERE route_id = ? ORDER BY step_order ASC').all(id);
    const updateOrder = db.prepare('UPDATE route_places SET step_order = ? WHERE id = ?');
    remaining.forEach((item, index) => {
      updateOrder.run(index + 1, item.id);
    });

    db.prepare('UPDATE routes SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);

    const updated = db.prepare('SELECT * FROM routes WHERE id = ?').get(id);
    return sendSuccess(res, buildFullRouteObject(updated), 200, 'Объект удален из маршрута');
  } catch (err) {
    console.error('Ошибка удаления объекта из маршрута:', err);
    return sendError(res, 'Внутренняя ошибка сервера', 500, 'INTERNAL_SERVER_ERROR');
  }
}

function reorderRoutePlaces(req, res) {
  try {
    const { id } = req.params;
    const route = db.prepare('SELECT * FROM routes WHERE id = ?').get(id);

    if (!route) {
      return sendError(res, `Маршрут с ID «${id}» не найден`, 404, 'ROUTE_NOT_FOUND');
    }

    if (route.user_id !== req.user.id && req.user.role !== 'admin') {
      return sendError(res, 'Вы можете изменять только свои маршруты', 403, 'FORBIDDEN');
    }

    const { place_ids, placeIds } = req.body;
    const orderedIds = place_ids || placeIds;

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return sendError(res, 'Требуется массив идентификаторов мест place_ids', 400, 'INVALID_PLACE_IDS');
    }

    const currentPlaces = db.prepare('SELECT place_id FROM route_places WHERE route_id = ?').all(id);
    const currentPlaceIdSet = new Set(currentPlaces.map(p => p.place_id));

    for (const pid of orderedIds) {
      if (!currentPlaceIdSet.has(pid)) {
        return sendError(res, `Объект «${pid}» не входит в этот маршрут`, 400, 'INVALID_REORDER_ITEM');
      }
    }

    const updateOrder = db.prepare('UPDATE route_places SET step_order = ? WHERE route_id = ? AND place_id = ?');
    orderedIds.forEach((pid, index) => {
      updateOrder.run(index + 1, id, pid);
    });

    db.prepare('UPDATE routes SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);

    const updated = db.prepare('SELECT * FROM routes WHERE id = ?').get(id);
    return sendSuccess(res, buildFullRouteObject(updated), 200, 'Порядок объектов успешно обновлен');
  } catch (err) {
    console.error('Ошибка переупорядочивания маршрута:', err);
    return sendError(res, 'Внутренняя ошибка сервера', 500, 'INTERNAL_SERVER_ERROR');
  }
}

function changeRouteStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const route = db.prepare('SELECT * FROM routes WHERE id = ?').get(id);
    if (!route) {
      return sendError(res, `Маршрут с ID «${id}» не найден`, 404, 'ROUTE_NOT_FOUND');
    }

    if (route.user_id !== req.user.id && req.user.role !== 'admin') {
      return sendError(res, 'Вы можете менять статус только своих маршрутов', 403, 'FORBIDDEN');
    }

    const transitionCheck = isValidStatusTransition(route.status, status);
    if (!transitionCheck.valid) {
      return sendError(res, transitionCheck.message, 422, 'INVALID_STATE_TRANSITION');
    }

    if (status === 'planned') {
      const placesCount = db.prepare('SELECT COUNT(*) as count FROM route_places WHERE route_id = ?').get(id).count;
      if (placesCount === 0) {
        return sendError(res, 'Нельзя перевести в статус «Запланирован» пустой маршрут без объектов', 422, 'EMPTY_ROUTE_NOT_ALLOWED');
      }
    }

    db.prepare('UPDATE routes SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);

    const updated = db.prepare('SELECT * FROM routes WHERE id = ?').get(id);
    return sendSuccess(res, buildFullRouteObject(updated), 200, `Статус маршрута изменен на «${status}»`);
  } catch (err) {
    console.error('Ошибка смены статуса маршрута:', err);
    return sendError(res, 'Внутренняя ошибка сервера', 500, 'INTERNAL_SERVER_ERROR');
  }
}

function calculateAdHoc(req, res) {
  try {
    const { place_ids, placeIds, max_duration_minutes, maxDurationMinutes, max_budget, maxBudget } = req.body || {};
    const ids = place_ids || placeIds || [];

    if (!Array.isArray(ids)) {
      return sendError(res, 'Параметр place_ids должен быть массивом идентификаторов', 400, 'INVALID_INPUT');
    }

    const places = [];
    for (const id of ids) {
      const p = db.prepare('SELECT * FROM places WHERE id = ?').get(id);
      if (p) {
        places.push(formatPlace(p));
      }
    }

    const calculations = calculateRouteMetrics(places, {
      maxDurationMinutes: max_duration_minutes || maxDurationMinutes || 480,
      maxBudget: max_budget || maxBudget || 5000
    });

    return sendSuccess(res, {
      requestedIds: ids,
      resolvedPlaces: places,
      calculations
    }, 200, 'Расчет метрик маршрута успешно выполнен');
  } catch (err) {
    console.error('Ошибка прямого расчета метрик:', err);
    return sendError(res, 'Внутренняя ошибка сервера при расчете', 500, 'INTERNAL_SERVER_ERROR');
  }
}

module.exports = {
  getUserRoutes,
  getRouteById,
  createRoute,
  updateRoute,
  deleteRoute,
  addPlaceToRoute,
  removePlaceFromRoute,
  reorderRoutePlaces,
  changeRouteStatus,
  calculateAdHoc
};
