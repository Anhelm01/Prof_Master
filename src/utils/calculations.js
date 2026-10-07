/**
 * calculations.js
 * Утилиты для расчета параметров маршрута, временных интервалов и лимитов.
 */

export const DEFAULT_TRANSFER_MINUTES = 20;
export const DEFAULT_MAX_DURATION_MINUTES = 480; // 8 часов
export const DEFAULT_MAX_BUDGET = 5000; // 5000 рублей

/**
 * Рассчитывает сводную статистику маршрута по списку ID и настройкам.
 */
export function calculateRouteStats(allPlaces, routePlaceIds, settings = {}) {
  const maxDurationMinutes = settings.maxDurationMinutes ?? DEFAULT_MAX_DURATION_MINUTES;
  const maxBudget = settings.maxBudget ?? DEFAULT_MAX_BUDGET;

  // Маппинг ID в объекты с сохранением порядка следования
  const placesMap = new Map(allPlaces.map((p) => [p.id, p]));
  const routePlaces = routePlaceIds
    .map((id) => placesMap.get(id))
    .filter(Boolean);

  const placesCount = routePlaces.length;
  const totalVisitMinutes = routePlaces.reduce((sum, p) => sum + (p.durationMinutes || 0), 0);
  const totalTransferMinutes = placesCount > 1 ? (placesCount - 1) * DEFAULT_TRANSFER_MINUTES : 0;
  const totalDurationMinutes = totalVisitMinutes + totalTransferMinutes;
  const totalCost = routePlaces.reduce((sum, p) => sum + (p.cost || 0), 0);

  const isDurationExceeded = totalDurationMinutes > maxDurationMinutes;
  const durationOverheadMinutes = isDurationExceeded ? totalDurationMinutes - maxDurationMinutes : 0;

  const isBudgetExceeded = maxBudget > 0 && totalCost > maxBudget;
  const budgetOverhead = isBudgetExceeded ? totalCost - maxBudget : 0;

  return {
    routePlaces,
    placesCount,
    totalVisitMinutes,
    totalTransferMinutes,
    totalDurationMinutes,
    totalCost,
    maxDurationMinutes,
    maxBudget,
    isDurationExceeded,
    durationOverheadMinutes,
    isBudgetExceeded,
    budgetOverhead,
    durationPercent: maxDurationMinutes > 0
      ? Math.min(100, Math.round((totalDurationMinutes / maxDurationMinutes) * 100))
      : 0
  };
}

/**
 * Форматирует часы и минуты в формат времени "09:30"
 */
function formatTimeHHMM(totalMinutesFromMidnight) {
  const normalized = (totalMinutesFromMidnight % (24 * 60) + (24 * 60)) % (24 * 60);
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Генерирует почасовое расписание дня для маршрута, начиная с указанного времени (по умолч. 09:00).
 */
export function generateTimelineSchedule(routePlaces, startHour = 9, startMinute = 0) {
  let currentMinutes = startHour * 60 + startMinute;
  const schedule = [];

  routePlaces.forEach((place, index) => {
    const visitStart = currentMinutes;
    const visitEnd = visitStart + (place.durationMinutes || 60);

    const item = {
      stepIndex: index + 1,
      place,
      startTimeStr: formatTimeHHMM(visitStart),
      endTimeStr: formatTimeHHMM(visitEnd),
      visitStartMinutes: visitStart,
      visitEndMinutes: visitEnd,
      durationMinutes: place.durationMinutes || 60,
      transferToNextMinutes: 0,
      transferStartStr: '',
      transferEndStr: ''
    };

    currentMinutes = visitEnd;

    // Если есть следующий пункт, добавляем трансфер
    if (index < routePlaces.length - 1) {
      item.transferToNextMinutes = DEFAULT_TRANSFER_MINUTES;
      item.transferStartStr = formatTimeHHMM(currentMinutes);
      currentMinutes += DEFAULT_TRANSFER_MINUTES;
      item.transferEndStr = formatTimeHHMM(currentMinutes);
    }

    schedule.push(item);
  });

  return schedule;
}
