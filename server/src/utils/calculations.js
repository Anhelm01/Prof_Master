const TRANSFER_MINUTES_BETWEEN_STOPS = 20;
const DAY_START_HOUR = 9;

function formatDurationRu(minutes) {
  if (!minutes || minutes <= 0) return '0 мин';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0 && mins > 0) return `${hrs} ч ${mins} мин`;
  if (hrs > 0) return `${hrs} ч`;
  return `${mins} мин`;
}

function minutesToTimeStr(totalMinutes) {
  const norm = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(norm / 60);
  const mins = norm % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

function calculateRouteMetrics(places = [], options = {}) {
  const maxDurationMinutes = Number(options.maxDurationMinutes) || 480;
  const maxBudget = Number(options.maxBudget) || 5000;

  if (!Array.isArray(places) || places.length === 0) {
    return {
      placesCount: 0,
      totalPlacesDurationMinutes: 0,
      transferTimeMinutes: 0,
      totalDurationMinutes: 0,
      totalDurationFormatted: '0 мин',
      totalCost: 0,
      totalCostFormatted: '0 ₽',
      maxDurationMinutes,
      maxBudget,
      isOverDurationLimit: false,
      overheadDurationMinutes: 0,
      overheadDurationFormatted: null,
      durationWarning: null,
      isOverBudgetLimit: false,
      overheadBudget: 0,
      budgetWarning: null,
      timeline: [],
      optimizationSuggestion: null
    };
  }

  const totalPlacesDurationMinutes = places.reduce(
    (sum, p) => sum + (Number(p.duration_minutes || p.durationMinutes) || 0),
    0
  );

  const transferTimeMinutes = places.length > 1
    ? (places.length - 1) * TRANSFER_MINUTES_BETWEEN_STOPS
    : 0;

  const totalDurationMinutes = totalPlacesDurationMinutes + transferTimeMinutes;

  const totalCost = places.reduce(
    (sum, p) => sum + (Number(p.cost) || 0),
    0
  );

  const isOverDurationLimit = totalDurationMinutes > maxDurationMinutes;
  const overheadDurationMinutes = Math.max(0, totalDurationMinutes - maxDurationMinutes);
  let durationWarning = null;
  if (isOverDurationLimit) {
    durationWarning = `Внимание: маршрут превышает дневной лимит (${formatDurationRu(maxDurationMinutes)}) на ${formatDurationRu(overheadDurationMinutes)}. Рекомендуется оптимизировать порядок или исключить объекты.`;
  }

  const isOverBudgetLimit = maxBudget > 0 && totalCost > maxBudget;
  const overheadBudget = Math.max(0, totalCost - maxBudget);
  let budgetWarning = null;
  if (isOverBudgetLimit) {
    budgetWarning = `Превышение бюджета на ${overheadBudget.toLocaleString('ru-RU')} ₽ (план: ${maxBudget.toLocaleString('ru-RU')} ₽, факт: ${totalCost.toLocaleString('ru-RU')} ₽).`;
  }

  let currentMinuteCursor = DAY_START_HOUR * 60;
  const timeline = places.map((place, index) => {
    const duration = Number(place.duration_minutes || place.durationMinutes) || 60;
    const arrivalTime = minutesToTimeStr(currentMinuteCursor);
    const departureTime = minutesToTimeStr(currentMinuteCursor + duration);
    currentMinuteCursor += duration;

    let transfer = null;
    if (index < places.length - 1) {
      const transferStart = departureTime;
      const transferEnd = minutesToTimeStr(currentMinuteCursor + TRANSFER_MINUTES_BETWEEN_STOPS);
      transfer = {
        durationMinutes: TRANSFER_MINUTES_BETWEEN_STOPS,
        fromTime: transferStart,
        toTime: transferEnd,
        description: `Переезд к объекту «${places[index + 1].title}» (20 мин)`
      };
      currentMinuteCursor += TRANSFER_MINUTES_BETWEEN_STOPS;
    }

    return {
      stepOrder: index + 1,
      placeId: place.id,
      title: place.title,
      category: place.category,
      durationMinutes: duration,
      durationFormatted: formatDurationRu(duration),
      cost: Number(place.cost) || 0,
      arrivalTime,
      departureTime,
      transfer
    };
  });

  let optimizationSuggestion = null;
  if (isOverDurationLimit && places.length > 1) {

    let longestPlace = places[0];
    let maxDur = Number(longestPlace.duration_minutes || longestPlace.durationMinutes) || 0;

    for (let i = 1; i < places.length; i++) {
      const d = Number(places[i].duration_minutes || places[i].durationMinutes) || 0;
      if (d > maxDur) {
        maxDur = d;
        longestPlace = places[i];
      }
    }

    const projectedPlacesCount = places.length - 1;
    const projectedTransfers = projectedPlacesCount > 1
      ? (projectedPlacesCount - 1) * TRANSFER_MINUTES_BETWEEN_STOPS
      : 0;
    const projectedDuration = (totalPlacesDurationMinutes - maxDur) + projectedTransfers;
    const projectedOverhead = Math.max(0, projectedDuration - maxDurationMinutes);

    optimizationSuggestion = {
      recommendedAction: 'REMOVE_LONGEST_PLACE',
      suggestedPlaceId: longestPlace.id,
      suggestedPlaceTitle: longestPlace.title,
      savedDurationMinutes: maxDur + (places.length > 1 ? TRANSFER_MINUTES_BETWEEN_STOPS : 0),
      projectedTotalDurationMinutes: projectedDuration,
      projectedDurationFormatted: formatDurationRu(projectedDuration),
      resolvesOverhead: projectedOverhead === 0,
      message: `Исключение «${longestPlace.title}» сэкономит ${formatDurationRu(maxDur)} визита + переезд. Новая продолжительность: ${formatDurationRu(projectedDuration)}.`
    };
  }

  return {
    placesCount: places.length,
    totalPlacesDurationMinutes,
    transferTimeMinutes,
    totalDurationMinutes,
    totalDurationFormatted: formatDurationRu(totalDurationMinutes),
    totalCost,
    totalCostFormatted: `${totalCost.toLocaleString('ru-RU')} ₽`,
    maxDurationMinutes,
    maxBudget,
    isOverDurationLimit,
    overheadDurationMinutes,
    overheadDurationFormatted: overheadDurationMinutes > 0 ? formatDurationRu(overheadDurationMinutes) : null,
    durationWarning,
    isOverBudgetLimit,
    overheadBudget,
    budgetWarning,
    timeline,
    optimizationSuggestion
  };
}

const VALID_STATUSES = ['draft', 'planned', 'completed'];
const ALLOWED_TRANSITIONS = {
  draft: ['planned'],
  planned: ['draft', 'completed'],
  completed: ['planned', 'draft']
};

function isValidStatusTransition(currentStatus, newStatus) {
  if (!VALID_STATUSES.includes(newStatus)) {
    return { valid: false, message: `Недопустимый статус «${newStatus}». Разрешены: ${VALID_STATUSES.join(', ')}` };
  }
  if (currentStatus === newStatus) {
    return { valid: true };
  }
  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(newStatus)) {
    return {
      valid: false,
      message: `Переход статуса из «${currentStatus}» в «${newStatus}» запрещен бизнес-правилами. Разрешено: ${allowed.join(', ') || 'нет переходов'}`
    };
  }
  return { valid: true };
}

module.exports = {
  TRANSFER_MINUTES_BETWEEN_STOPS,
  DAY_START_HOUR,
  formatDurationRu,
  minutesToTimeStr,
  calculateRouteMetrics,
  isValidStatusTransition,
  VALID_STATUSES
};
