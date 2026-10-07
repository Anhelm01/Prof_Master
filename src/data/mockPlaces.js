/**
 * mockPlaces.js
 * База данных туристических объектов (HD-фото с Unsplash).
 * Каждый объект имеет conveyorImage для конвейера главной страницы.
 */

const PLACES = [
  {
    id: 'place-01',
    title: 'Эрмитаж',
    shortDesc: 'Один из крупнейших и старейших музеев мира с коллекцией из 3 миллионов экспонатов.',
    fullDesc: 'Государственный Эрмитаж — один из крупнейших и старейших художественных и культурно-исторических музеев мира. Его коллекция насчитывает около 3 миллионов произведений искусства и памятников мировой культуры.',
    category: 'culture',
    imageUrl: 'https://images.unsplash.com/photo-1548834925-e48f8a27ae24?w=800&q=80',
    conveyorImageUrl: 'https://images.unsplash.com/photo-1548834925-e48f8a27ae24?w=1400&q=90',
    durationMinutes: 180,
    cost: 500,
    rating: 4.9,
    location: { lat: 59.9398, lng: 30.3146, address: 'Дворцовая пл., 2' },
    tags: ['ЮНЕСКО', 'Мировое искусство', 'Барокко'],
    openingHours: '10:30 – 18:00'
  },
  {
    id: 'place-02',
    title: 'Петропавловская крепость',
    shortDesc: 'Историческое ядро Санкт-Петербурга и первое сооружение города.',
    fullDesc: 'Петропавловская крепость — крепость в Санкт-Петербурге, расположенная на Заячьем острове. Историческое ядро города, заложенное Петром I в 1703 году.',
    category: 'architecture',
    imageUrl: 'https://images.unsplash.com/photo-1556610961-2fecc5927173?w=800&q=80',
    conveyorImageUrl: 'https://images.unsplash.com/photo-1556610961-2fecc5927173?w=1400&q=90',
    durationMinutes: 120,
    cost: 650,
    rating: 4.7,
    location: { lat: 59.9500, lng: 30.3167, address: 'Петропавловская крепость, 3' },
    tags: ['История', 'Петр I', 'Панорама'],
    openingHours: '10:00 – 18:00'
  },
  {
    id: 'place-03',
    title: 'Летний сад',
    shortDesc: 'Старейший парк Санкт-Петербурга с мраморными скульптурами и фонтанами.',
    fullDesc: 'Летний сад — парковый ансамбль, памятник садово-паркового искусства первой трети XVIII века. Старейший сад Санкт-Петербурга с коллекцией мраморных скульптур итальянских мастеров.',
    category: 'nature',
    imageUrl: 'https://images.unsplash.com/photo-1560969184-10fe8719e620?w=800&q=80',
    conveyorImageUrl: 'https://images.unsplash.com/photo-1560969184-10fe8719e620?w=1400&q=90',
    durationMinutes: 90,
    cost: 0,
    rating: 4.6,
    location: { lat: 59.9453, lng: 30.3354, address: 'наб. Кутузова, 2' },
    tags: ['Бесплатно', 'Скульптуры', 'Отдых'],
    openingHours: '10:00 – 20:00'
  },
  {
    id: 'place-04',
    title: 'Русский музей',
    shortDesc: 'Крупнейшее собрание русского изобразительного искусства в мире.',
    fullDesc: 'Государственный Русский музей — крупнейший в мире музей русского искусства. Коллекция насчитывает более 400 тысяч экспонатов, от древнерусских икон до авангарда.',
    category: 'culture',
    imageUrl: 'https://images.unsplash.com/photo-1580996267827-0acdb7bca975?w=800&q=80',
    conveyorImageUrl: 'https://images.unsplash.com/photo-1580996267827-0acdb7bca975?w=1400&q=90',
    durationMinutes: 150,
    cost: 450,
    rating: 4.8,
    location: { lat: 59.9386, lng: 30.3323, address: 'ул. Инженерная, 4' },
    tags: ['Русское искусство', 'Иконы', 'Авангард'],
    openingHours: '10:00 – 18:00'
  },
  {
    id: 'place-05',
    title: 'Гастрономический тур по Невскому',
    shortDesc: 'Дегустация петербургской кухни: от пышек до устриц на главном проспекте.',
    fullDesc: 'Уникальный гастрономический маршрут по Невскому проспекту — от знаменитой пышечной на Конюшенной до устричных баров и крафтовых кофеен. Познакомьтесь с петербургской кухней.',
    category: 'food',
    imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
    conveyorImageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1400&q=90',
    durationMinutes: 120,
    cost: 2500,
    rating: 4.5,
    location: { lat: 59.9343, lng: 30.3351, address: 'Невский проспект' },
    tags: ['Дегустация', 'Невский', 'Гурман'],
    openingHours: '11:00 – 22:00'
  },
  {
    id: 'place-06',
    title: 'Исаакиевский собор',
    shortDesc: 'Величественный кафедральный собор с колоннадой и панорамой на весь город.',
    fullDesc: 'Исаакиевский собор — крупнейший православный храм Санкт-Петербурга. С высоты колоннады открывается захватывающая панорама на весь исторический центр города.',
    category: 'architecture',
    imageUrl: 'https://images.unsplash.com/photo-1553708881-112abc53fe54?w=800&q=80',
    conveyorImageUrl: 'https://images.unsplash.com/photo-1553708881-112abc53fe54?w=1400&q=90',
    durationMinutes: 90,
    cost: 400,
    rating: 4.8,
    location: { lat: 59.9339, lng: 30.3063, address: 'Исаакиевская пл., 4' },
    tags: ['Панорама', 'Колоннада', 'Классицизм'],
    openingHours: '10:00 – 18:00'
  },
  {
    id: 'place-07',
    title: 'Парк Елагин остров',
    shortDesc: 'Зеленый оазис посреди города — лесопарк на острове с дворцом и белками.',
    fullDesc: 'Центральный парк культуры и отдыха имени С.М. Кирова на Елагином острове — уникальный природный ландшафтный парк с Елагиноостровским дворцом, белками и потрясающими закатами.',
    category: 'nature',
    imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80',
    conveyorImageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1400&q=90',
    durationMinutes: 120,
    cost: 100,
    rating: 4.7,
    location: { lat: 59.9794, lng: 30.2594, address: 'Елагин остров, 4' },
    tags: ['Закат', 'Природа', 'Прогулка'],
    openingHours: '06:00 – 23:00'
  },
  {
    id: 'place-08',
    title: 'Экскурсия на каяках по каналам',
    shortDesc: 'Активный тур по рекам и каналам Петербурга на каяках с гидом.',
    fullDesc: 'Откройте Петербург с воды! Экскурсия на каяках по рекам Мойке, Фонтанке и каналу Грибоедова. Вы увидите город с необычного ракурса и получите отличную физическую нагрузку.',
    category: 'activity',
    imageUrl: 'https://images.unsplash.com/photo-1472745433479-4556f22e32c2?w=800&q=80',
    conveyorImageUrl: 'https://images.unsplash.com/photo-1472745433479-4556f22e32c2?w=1400&q=90',
    durationMinutes: 150,
    cost: 3000,
    rating: 4.9,
    location: { lat: 59.9296, lng: 30.3180, address: 'наб. реки Мойки' },
    tags: ['Активный', 'С гидом', 'Каяк'],
    openingHours: '09:00 – 20:00'
  }
];

export default PLACES;

/**
 * Категории для фильтрации
 */
export const CATEGORIES = [
  { id: 'all', label: 'Все объекты', icon: 'Globe' },
  { id: 'culture', label: 'Музеи и культура', icon: 'Palette' },
  { id: 'architecture', label: 'Архитектура', icon: 'Landmark' },
  { id: 'nature', label: 'Природа и парки', icon: 'TreePine' },
  { id: 'food', label: 'Гастрономия', icon: 'UtensilsCrossed' },
  { id: 'activity', label: 'Активные экскурсии', icon: 'Bike' }
];

/**
 * Готовые пресеты маршрутов для быстрой демонстрации
 */
export const ROUTE_PRESETS = [
  {
    id: 'cultural',
    title: 'Культурный максимум',
    emoji: '🏛️',
    description: 'Эрмитаж, Русский музей и Исаакиевский собор за один день',
    placeIds: ['place-01', 'place-04', 'place-06']
  },
  {
    id: 'nature',
    title: 'Эко-день на природе',
    emoji: '🌿',
    description: 'Летний сад, Елагин остров и каяки по каналам',
    placeIds: ['place-03', 'place-07', 'place-08']
  },
  {
    id: 'gastro',
    title: 'Гастрономический экспресс',
    emoji: '🍽️',
    description: 'Гастро-тур по Невскому, Летний сад и Петропавловская крепость',
    placeIds: ['place-05', 'place-03', 'place-02']
  }
];
