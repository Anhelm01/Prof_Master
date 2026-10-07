/**
 * formatters.js
 * Утилиты форматирования для отображения времени, валюты, категорий и рейтинга.
 */

export const CATEGORY_NAMES = {
  all: 'Все объекты',
  culture: 'Культура',
  architecture: 'Архитектура',
  nature: 'Природа',
  food: 'Гастрономия',
  activity: 'Активный отдых'
};

/**
 * Возвращает аккуратное локализованное название категории на русском языке.
 */
export function formatCategory(categoryId) {
  return CATEGORY_NAMES[categoryId] || categoryId || 'Объект';
}

/**
 * Форматирует минуты в строку "X ч Y мин" или "X мин"
 */
export function formatDuration(minutes) {
  const safeMinutes = Math.max(0, Math.round(Number(minutes) || 0));
  if (safeMinutes < 60) return `${safeMinutes} мин`;
  const h = Math.floor(safeMinutes / 60);
  const m = safeMinutes % 60;
  return m > 0 ? `${h} ч ${m} мин` : `${h} ч`;
}

/**
 * Форматирует стоимость в рубли
 */
export function formatCost(cost) {
  const safeCost = Math.max(0, Math.round(Number(cost) || 0));
  if (safeCost === 0) return 'Бесплатно';
  return `${safeCost.toLocaleString('ru-RU')} ₽`;
}

/**
 * Форматирует рейтинг
 */
export function formatRating(rating) {
  const safeRating = Number(rating) || 0;
  return safeRating.toFixed(1);
}
