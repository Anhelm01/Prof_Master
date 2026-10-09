const { db } = require('../config/db');
const { sendSuccess, sendError } = require('../utils/response');

function parseTags(tagsStr) {
  if (!tagsStr) return [];
  try {
    return JSON.parse(tagsStr);
  } catch {
    return tagsStr.split(',').map(t => t.trim());
  }
}

function formatPlace(place) {
  if (!place) return null;
  return {
    id: place.id,
    title: place.title,
    shortDesc: place.short_desc,
    fullDesc: place.full_desc,
    category: place.category,
    imageUrl: place.image_url,
    conveyorImageUrl: place.conveyor_image_url || place.image_url,
    durationMinutes: Number(place.duration_minutes),
    cost: Number(place.cost),
    rating: Number(place.rating),
    location: {
      lat: place.lat ? Number(place.lat) : 59.9343,
      lng: place.lng ? Number(place.lng) : 30.3351,
      address: place.address || ''
    },
    tags: parseTags(place.tags),
    openingHours: place.opening_hours || '',
    createdAt: place.created_at
  };
}

function getAllPlaces(req, res) {
  try {
    const { category, search, sort, limit = 50, offset = 0 } = req.query;

    let query = 'SELECT * FROM places WHERE 1=1';
    const params = [];

    if (category && category !== 'all') {
      query += ' AND category = ?';
      params.push(category);
    }

    if (search && search.trim()) {
      const searchPattern = `%${search.trim().toLowerCase()}%`;
      query += ` AND (
        LOWER(title) LIKE ? OR
        LOWER(short_desc) LIKE ? OR
        LOWER(full_desc) LIKE ? OR
        LOWER(address) LIKE ? OR
        LOWER(tags) LIKE ?
      )`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }

    if (sort === 'cost_asc') {
      query += ' ORDER BY cost ASC';
    } else if (sort === 'cost_desc') {
      query += ' ORDER BY cost DESC';
    } else if (sort === 'duration_asc') {
      query += ' ORDER BY duration_minutes ASC';
    } else if (sort === 'duration_desc') {
      query += ' ORDER BY duration_minutes DESC';
    } else if (sort === 'rating_desc') {
      query += ' ORDER BY rating DESC';
    } else {
      query += ' ORDER BY id ASC';
    }

    query += ' LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const rows = db.prepare(query).all(...params);
    const places = rows.map(formatPlace);

    return sendSuccess(res, {
      total: places.length,
      places
    });
  } catch (err) {
    console.error('Ошибка получения списка объектов:', err);
    return sendError(res, 'Ошибка получения каталога объектов', 500, 'INTERNAL_SERVER_ERROR');
  }
}

function getPlaceById(req, res) {
  try {
    const { id } = req.params;
    const place = db.prepare('SELECT * FROM places WHERE id = ?').get(id);

    if (!place) {
      return sendError(res, `Туристический объект с ID «${id}» не найден`, 404, 'PLACE_NOT_FOUND');
    }

    return sendSuccess(res, formatPlace(place));
  } catch (err) {
    console.error('Ошибка получения объекта:', err);
    return sendError(res, 'Внутренняя ошибка сервера', 500, 'INTERNAL_SERVER_ERROR');
  }
}

function createPlace(req, res) {
  try {
    const {
      id: customId,
      title,
      short_desc,
      shortDesc,
      full_desc,
      fullDesc,
      category,
      image_url,
      imageUrl,
      conveyor_image_url,
      conveyorImageUrl,
      duration_minutes,
      durationMinutes,
      cost,
      rating,
      address,
      lat,
      lng,
      tags,
      opening_hours,
      openingHours
    } = req.body;

    const id = customId || `place-${Date.now().toString(36)}`;
    const finalShortDesc = short_desc || shortDesc || title;
    const finalFullDesc = full_desc || fullDesc || finalShortDesc;
    const finalImageUrl = image_url || imageUrl || 'https://images.unsplash.com/photo-1548834925-e48f8a27ae24?w=800&q=80';
    const finalConveyorUrl = conveyor_image_url || conveyorImageUrl || finalImageUrl;
    const finalDuration = Number(duration_minutes || durationMinutes) || 60;
    const finalCost = Number(cost) || 0;
    const finalRating = Number(rating) || 4.5;
    const finalTags = Array.isArray(tags) ? JSON.stringify(tags) : (typeof tags === 'string' ? tags : '[]');
    const finalOpeningHours = opening_hours || openingHours || '10:00 – 18:00';

    const insertStmt = db.prepare(`
      INSERT INTO places (
        id, title, short_desc, full_desc, category, image_url, conveyor_image_url,
        duration_minutes, cost, rating, address, lat, lng, tags, opening_hours
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertStmt.run(
      id,
      title,
      finalShortDesc,
      finalFullDesc,
      category,
      finalImageUrl,
      finalConveyorUrl,
      finalDuration,
      finalCost,
      finalRating,
      address || '',
      lat ? Number(lat) : 59.9343,
      lng ? Number(lng) : 30.3351,
      finalTags,
      finalOpeningHours
    );

    const created = db.prepare('SELECT * FROM places WHERE id = ?').get(id);
    return sendSuccess(res, formatPlace(created), 201, 'Объект успешно добавлен в каталог');
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return sendError(res, 'Объект с таким ID уже существует', 409, 'PLACE_EXISTS');
    }
    console.error('Ошибка создания объекта:', err);
    return sendError(res, 'Внутренняя ошибка создания объекта', 500, 'INTERNAL_SERVER_ERROR');
  }
}

function updatePlace(req, res) {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM places WHERE id = ?').get(id);

    if (!existing) {
      return sendError(res, `Объект с ID «${id}» не найден`, 404, 'PLACE_NOT_FOUND');
    }

    const {
      title,
      short_desc,
      shortDesc,
      full_desc,
      fullDesc,
      category,
      image_url,
      imageUrl,
      duration_minutes,
      durationMinutes,
      cost,
      rating,
      address,
      tags,
      opening_hours,
      openingHours
    } = req.body;

    const updatedTitle = title !== undefined ? title : existing.title;
    const updatedShortDesc = (short_desc || shortDesc) !== undefined ? (short_desc || shortDesc) : existing.short_desc;
    const updatedFullDesc = (full_desc || fullDesc) !== undefined ? (full_desc || fullDesc) : existing.full_desc;
    const updatedCategory = category !== undefined ? category : existing.category;
    const updatedImageUrl = (image_url || imageUrl) !== undefined ? (image_url || imageUrl) : existing.image_url;
    const updatedDuration = (duration_minutes || durationMinutes) !== undefined ? Number(duration_minutes || durationMinutes) : existing.duration_minutes;
    const updatedCost = cost !== undefined ? Number(cost) : existing.cost;
    const updatedRating = rating !== undefined ? Number(rating) : existing.rating;
    const updatedAddress = address !== undefined ? address : existing.address;
    const updatedTags = tags !== undefined
      ? (Array.isArray(tags) ? JSON.stringify(tags) : String(tags))
      : existing.tags;
    const updatedOpeningHours = (opening_hours || openingHours) !== undefined ? (opening_hours || openingHours) : existing.opening_hours;

    db.prepare(`
      UPDATE places SET
        title = ?,
        short_desc = ?,
        full_desc = ?,
        category = ?,
        image_url = ?,
        duration_minutes = ?,
        cost = ?,
        rating = ?,
        address = ?,
        tags = ?,
        opening_hours = ?
      WHERE id = ?
    `).run(
      updatedTitle,
      updatedShortDesc,
      updatedFullDesc,
      updatedCategory,
      updatedImageUrl,
      updatedDuration,
      updatedCost,
      updatedRating,
      updatedAddress,
      updatedTags,
      updatedOpeningHours,
      id
    );

    const updated = db.prepare('SELECT * FROM places WHERE id = ?').get(id);
    return sendSuccess(res, formatPlace(updated), 200, 'Объект успешно обновлен');
  } catch (err) {
    console.error('Ошибка обновления объекта:', err);
    return sendError(res, 'Внутренняя ошибка сервера', 500, 'INTERNAL_SERVER_ERROR');
  }
}

function deletePlace(req, res) {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT id FROM places WHERE id = ?').get(id);

    if (!existing) {
      return sendError(res, `Объект с ID «${id}» не найден`, 404, 'PLACE_NOT_FOUND');
    }

    db.prepare('DELETE FROM places WHERE id = ?').run(id);
    return sendSuccess(res, { deletedId: id }, 200, 'Объект успешно удален');
  } catch (err) {
    console.error('Ошибка удаления объекта:', err);
    return sendError(res, 'Внутренняя ошибка сервера', 500, 'INTERNAL_SERVER_ERROR');
  }
}

module.exports = {
  getAllPlaces,
  getPlaceById,
  createPlace,
  updatePlace,
  deletePlace,
  formatPlace
};
