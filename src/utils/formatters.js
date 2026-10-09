export const CATEGORY_NAMES = {
  all: 'Все объекты',
  culture: 'Культура',
  architecture: 'Архитектура',
  nature: 'Природа',
  food: 'Гастрономия',
  activity: 'Активный отдых'
};

export function formatCategory(categoryId) {
  return CATEGORY_NAMES[categoryId] || categoryId || 'Объект';
}

export function formatDuration(minutes) {
  const safeMinutes = Math.max(0, Math.round(Number(minutes) || 0));
  if (safeMinutes < 60) return `${safeMinutes} мин`;
  const h = Math.floor(safeMinutes / 60);
  const m = safeMinutes % 60;
  return m > 0 ? `${h} ч ${m} мин` : `${h} ч`;
}

export function formatCost(cost) {
  const safeCost = Math.max(0, Math.round(Number(cost) || 0));
  if (safeCost === 0) return 'Бесплатно';
  return `${safeCost.toLocaleString('ru-RU')} ₽`;
}

export function formatRating(rating) {
  const safeRating = Number(rating) || 0;
  return safeRating.toFixed(1);
}
