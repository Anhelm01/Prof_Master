const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dbDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const dbPath = process.env.DB_PATH || path.join(dbDir, 'tourist_planner.sqlite');

let db;
try {
  db = new DatabaseSync(dbPath);

  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA journal_mode = WAL;');

  db.function('lower', (str) => (str !== null && str !== undefined ? String(str).toLowerCase() : ''));
  db.function('lower_utf8', (str) => (str !== null && str !== undefined ? String(str).toLowerCase() : ''));
} catch (err) {
  console.error('Ошибка инициализации SQLite:', err);
  throw err;
}

function initDatabase() {

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS places (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      short_desc TEXT NOT NULL,
      full_desc TEXT NOT NULL,
      category TEXT NOT NULL,
      image_url TEXT NOT NULL,
      conveyor_image_url TEXT,
      duration_minutes INTEGER NOT NULL DEFAULT 60,
      cost REAL NOT NULL DEFAULT 0,
      rating REAL NOT NULL DEFAULT 4.5,
      address TEXT,
      lat REAL,
      lng REAL,
      tags TEXT,
      opening_hours TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS routes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      max_duration_minutes INTEGER NOT NULL DEFAULT 480,
      max_budget REAL NOT NULL DEFAULT 5000,
      notes TEXT,
      is_public INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'draft',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS route_places (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      route_id INTEGER NOT NULL,
      place_id TEXT NOT NULL,
      step_order INTEGER NOT NULL,
      custom_note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (route_id) REFERENCES routes (id) ON DELETE CASCADE,
      FOREIGN KEY (place_id) REFERENCES places (id) ON DELETE CASCADE
    );
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_places_category ON places (category);
    CREATE INDEX IF NOT EXISTS idx_routes_user_id ON routes (user_id);
    CREATE INDEX IF NOT EXISTS idx_route_places_route ON route_places (route_id, step_order);
  `);

  seedDefaultData();
}

function seedDefaultData() {

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    const adminPass = bcrypt.hashSync('admin123', 10);
    const userPass = bcrypt.hashSync('user123', 10);

    const insertUser = db.prepare(`
      INSERT INTO users (username, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `);

    insertUser.run('admin', 'admin@waypoint.local', adminPass, 'admin');
    insertUser.run('traveler', 'traveler@waypoint.local', userPass, 'user');
  }

  const placeCount = db.prepare('SELECT COUNT(*) as count FROM places').get().count;
  if (placeCount === 0) {
    const initialPlaces = [
      {
        id: 'place-01',
        title: 'Эрмитаж',
        short_desc: 'Один из крупнейших и старейших музеев мира с коллекцией из 3 миллионов экспонатов.',
        full_desc: 'Государственный Эрмитаж — один из крупнейших и старейших художественных и культурно-исторических музеев мира. Его коллекция насчитывает около 3 миллионов произведений искусства и памятников мировой культуры.',
        category: 'culture',
        image_url: 'https://images.unsplash.com/photo-1548834925-e48f8a27ae24?w=800&q=80',
        conveyor_image_url: 'https://images.unsplash.com/photo-1548834925-e48f8a27ae24?w=1400&q=90',
        duration_minutes: 180,
        cost: 500,
        rating: 4.9,
        address: 'Дворцовая пл., 2',
        lat: 59.9398,
        lng: 30.3146,
        tags: JSON.stringify(['ЮНЕСКО', 'Мировое искусство', 'Барокко']),
        opening_hours: '10:30 – 18:00'
      },
      {
        id: 'place-02',
        title: 'Петропавловская крепость',
        short_desc: 'Историческое ядро Санкт-Петербурга и первое сооружение города.',
        full_desc: 'Петропавловская крепость — крепость в Санкт-Петербурге, расположенная на Заячьем острове. Историческое ядро города, заложенное Петром I в 1703 году.',
        category: 'architecture',
        image_url: 'https://images.unsplash.com/photo-1556610961-2fecc5927173?w=800&q=80',
        conveyor_image_url: 'https://images.unsplash.com/photo-1556610961-2fecc5927173?w=1400&q=90',
        duration_minutes: 120,
        cost: 650,
        rating: 4.7,
        address: 'Петропавловская крепость, 3',
        lat: 59.9500,
        lng: 30.3167,
        tags: JSON.stringify(['История', 'Петр I', 'Панорама']),
        opening_hours: '10:00 – 18:00'
      },
      {
        id: 'place-03',
        title: 'Летний сад',
        short_desc: 'Старейший парк Санкт-Петербурга с мраморными скульптурами и фонтанами.',
        full_desc: 'Летний сад — парковый ансамбль, памятник садово-паркового искусства первой трети XVIII века. Старейший сад Санкт-Петербурга с коллекцией мраморных скульптур итальянских мастеров.',
        category: 'nature',
        image_url: 'https://images.unsplash.com/photo-1560969184-10fe8719e620?w=800&q=80',
        conveyor_image_url: 'https://images.unsplash.com/photo-1560969184-10fe8719e620?w=1400&q=90',
        duration_minutes: 90,
        cost: 0,
        rating: 4.6,
        address: 'наб. Кутузова, 2',
        lat: 59.9453,
        lng: 30.3354,
        tags: JSON.stringify(['Бесплатно', 'Скульптуры', 'Отдых']),
        opening_hours: '10:00 – 20:00'
      },
      {
        id: 'place-04',
        title: 'Русский музей',
        short_desc: 'Крупнейшее собрание русского изобразительного искусства в мире.',
        full_desc: 'Государственный Русский музей — крупнейший в мире музей русского искусства. Коллекция насчитывает более 400 тысяч экспонатов, от древнерусских икон до авангарда.',
        category: 'culture',
        image_url: 'https://images.unsplash.com/photo-1580996267827-0acdb7bca975?w=800&q=80',
        conveyor_image_url: 'https://images.unsplash.com/photo-1580996267827-0acdb7bca975?w=1400&q=90',
        duration_minutes: 150,
        cost: 450,
        rating: 4.8,
        address: 'ул. Инженерная, 4',
        lat: 59.9386,
        lng: 30.3323,
        tags: JSON.stringify(['Русское искусство', 'Иконы', 'Авангард']),
        opening_hours: '10:00 – 18:00'
      },
      {
        id: 'place-05',
        title: 'Гастрономический тур по Невскому',
        short_desc: 'Дегустация петербургской кухни: от пышек до устриц на главном проспекте.',
        full_desc: 'Уникальный гастрономический маршрут по Невскому проспекту — от знаменитой пышечной на Конюшенной до устричных баров и крафтовых кофеен. Познакомьтесь с петербургской кухней.',
        category: 'food',
        image_url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
        conveyor_image_url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1400&q=90',
        duration_minutes: 120,
        cost: 2500,
        rating: 4.5,
        address: 'Невский проспект',
        lat: 59.9343,
        lng: 30.3351,
        tags: JSON.stringify(['Дегустация', 'Невский', 'Гурман']),
        opening_hours: '11:00 – 22:00'
      },
      {
        id: 'place-06',
        title: 'Исаакиевский собор',
        short_desc: 'Величественный кафедральный собор с колоннадой и панорамой на весь город.',
        full_desc: 'Исаакиевский собор — крупнейший православный храм Санкт-Петербурга. С высоты колоннады открывается захватывающая панорама на весь исторический центр города.',
        category: 'architecture',
        image_url: 'https://images.unsplash.com/photo-1553708881-112abc53fe54?w=800&q=80',
        conveyor_image_url: 'https://images.unsplash.com/photo-1553708881-112abc53fe54?w=1400&q=90',
        duration_minutes: 90,
        cost: 400,
        rating: 4.8,
        address: 'Исаакиевская пл., 4',
        lat: 59.9339,
        lng: 30.3063,
        tags: JSON.stringify(['Панорама', 'Колоннада', 'Классицизм']),
        opening_hours: '10:00 – 18:00'
      },
      {
        id: 'place-07',
        title: 'Парк Елагин остров',
        short_desc: 'Зеленый оазис для прогулок, пикников и катания на лодках.',
        full_desc: 'Центральный парк культуры и отдыха имени С. М. Кирова на Елагином острове. Живописный дворцово-парковый ансамбль с каналами, прудами и вековыми дубами.',
        category: 'nature',
        image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
        conveyor_image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=90',
        duration_minutes: 150,
        cost: 150,
        rating: 4.7,
        address: 'Елагин остров, 4',
        lat: 59.9791,
        lng: 30.2568,
        tags: JSON.stringify(['Парк', 'Лодки', 'Природа']),
        opening_hours: '06:00 – 23:00'
      },
      {
        id: 'place-08',
        title: 'Каякинг по рекам и каналам',
        short_desc: 'Водная прогулка на байдарках с видом на гранитные набережные и мосты.',
        full_desc: 'Уникальная возможность увидеть Петербург с уровня воды. Маршрут проходит по Мойке, Фонтанке и Крюкову каналу мимо знаковых достопримечательностей.',
        category: 'activity',
        image_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
        conveyor_image_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1400&q=90',
        duration_minutes: 120,
        cost: 1800,
        rating: 4.9,
        address: 'наб. реки Мойки, 12',
        lat: 59.9416,
        lng: 30.3204,
        tags: JSON.stringify(['Каякинг', 'Вода', 'Спорт']),
        opening_hours: '08:00 – 21:00'
      },
      {
        id: 'place-09',
        title: 'Севкабель Порт',
        short_desc: 'Культурно-деловое пространство на берегу Финского залива с выставками и стритфудом.',
        full_desc: 'Общественное пространство на Васильевском острове. Набережная с видом на залив, индустриальная эстетика, выставки современного искусства и рестораны.',
        category: 'culture',
        image_url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80',
        conveyor_image_url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1400&q=90',
        duration_minutes: 120,
        cost: 0,
        rating: 4.6,
        address: 'Кожевенная линия, 40',
        lat: 59.9242,
        lng: 30.2407,
        tags: JSON.stringify(['Залив', 'Стритфуд', 'Арт']),
        opening_hours: '10:00 – 23:00'
      },
      {
        id: 'place-10',
        title: 'Веломаршрут по набережным',
        short_desc: 'Живописная велопрогулка вдоль Невы от стрелки В.О. до Смольного.',
        full_desc: 'Протяженный маршрут по гранитным набережным города. Отличный способ охватить все главные мосты и архитектурные панорамы за одну поездку.',
        category: 'activity',
        image_url: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&q=80',
        conveyor_image_url: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=1400&q=90',
        duration_minutes: 90,
        cost: 500,
        rating: 4.7,
        address: 'Университетская наб., 1',
        lat: 59.9406,
        lng: 30.3045,
        tags: JSON.stringify(['Велосипед', 'Спорт', 'Панорама']),
        opening_hours: 'Круглосуточно'
      }
    ];

    const insertPlace = db.prepare(`
      INSERT INTO places (
        id, title, short_desc, full_desc, category, image_url, conveyor_image_url,
        duration_minutes, cost, rating, address, lat, lng, tags, opening_hours
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const p of initialPlaces) {
      insertPlace.run(
        p.id, p.title, p.short_desc, p.full_desc, p.category, p.image_url, p.conveyor_image_url,
        p.duration_minutes, p.cost, p.rating, p.address, p.lat, p.lng, p.tags, p.opening_hours
      );
    }
  }

  const routeCount = db.prepare('SELECT COUNT(*) as count FROM routes').get().count;
  if (routeCount === 0) {
    const user = db.prepare('SELECT id FROM users WHERE username = ?').get('traveler');
    if (user) {
      const insertRoute = db.prepare(`
        INSERT INTO routes (user_id, title, description, max_duration_minutes, max_budget, notes, is_public, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const routeResult = insertRoute.run(
        user.id,
        'Культурный день в Петербурге',
        'Классический ознакомительный маршрут по ключевым музеям и паркам.',
        480,
        3000,
        'Взять с собой студенческий билет для скидки в Эрмитаже',
        1,
        'planned'
      );
      const routeId = routeResult.lastInsertRowid;

      const insertRoutePlace = db.prepare(`
        INSERT INTO route_places (route_id, place_id, step_order, custom_note)
        VALUES (?, ?, ?, ?)
      `);
      insertRoutePlace.run(routeId, 'place-01', 1, 'Встреча у Зимнего дворца');
      insertRoutePlace.run(routeId, 'place-03', 2, 'Прогулка и кофе в парке');
      insertRoutePlace.run(routeId, 'place-06', 3, 'Подъем на колоннаду собора');
    }
  }
}

initDatabase();

module.exports = {
  db,
  initDatabase,
  seedDefaultData
};
