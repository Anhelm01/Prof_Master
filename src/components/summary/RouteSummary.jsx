import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Printer,
  Copy,
  Check,
  TrendingDown,
  ArrowRight,
  Sliders,
  MapPin,
  Car,
  Trash2
} from 'lucide-react';
import { useRoute } from '../../context/RouteContext.jsx';
import { formatDuration, formatCost, formatCategory } from '../../utils/formatters.js';
import './RouteSummary.css';

export default function RouteSummary() {
  const {
    stats,
    timelineSchedule,
    settings,
    updateSettings,
    removeFromRoute,
    setActiveScreen
  } = useRoute();

  const [copied, setCopied] = useState(false);

  // Самый длительный объект в маршруте (для умной рекомендации при превышении)
  const longestPlace = useMemo(() => {
    if (!stats.routePlaces.length) return null;
    return [...stats.routePlaces].sort((a, b) => b.durationMinutes - a.durationMinutes)[0];
  }, [stats.routePlaces]);

  // Копирование программы в буфер
  const handleCopyItinerary = () => {
    if (timelineSchedule.length === 0) return;

    let text = `🧭 ПРОГРАММА ТУРИСТИЧЕСКОГО МАРШРУТА «WAYPOINT»\n`;
    text += `=========================================\n`;
    text += `Общая продолжительность: ${formatDuration(stats.totalDurationMinutes)}\n`;
    text += `Общая стоимость: ${formatCost(stats.totalCost)}\n`;
    text += `Количество объектов: ${stats.placesCount}\n`;
    text += `Дневной лимит: ${formatDuration(settings.maxDurationMinutes)}\n\n`;
    text += `РАСПИСАНИЕ ДНЯ:\n`;

    timelineSchedule.forEach((item) => {
      text += `\n[${item.startTimeStr} - ${item.endTimeStr}] Шаг ${item.stepIndex}: ${item.place.title}\n`;
      text += `   • Категория: ${formatCategory(item.place.category)}\n`;
      text += `   • Время визита: ${formatDuration(item.durationMinutes)} | Стоимость: ${formatCost(item.place.cost)}\n`;
      text += `   • Адрес: ${item.place.location?.address || '—'}\n`;
      if (item.transferToNextMinutes > 0) {
        text += `   🚗 [${item.transferStartStr} - ${item.transferEndStr}] Трансфер к следующей точке (~20 мин)\n`;
      }
    });

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <section className="summary-page" id="summary">
      <div className="summary-container">
        {/* Шапка страницы */}
        <div className="summary-header">
          <div className="summary-header__tag">АНАЛИТИКА И КОНТРОЛЬ ЛИМИТОВ</div>
          <h1 className="summary-header__title">Сводка маршрута и аудит времени</h1>
          <p className="summary-header__sub">
            Автоматический расчет суммарных затрат времени, входных билетов и строгий контроль соответствия установленному дневному лимиту.
          </p>
        </div>

        {/* ПРЕВЫШЕНИЕ ЛИМИТА — ОБЯЗАТЕЛЬНЫЙ ЯРКИЙ АЛЕРТ */}
        {stats.isDurationExceeded ? (
          <div className="summary-alert summary-alert--danger" role="alert">
            <div className="summary-alert__icon-wrap">
              <AlertTriangle size={28} className="summary-alert__icon" />
            </div>
            <div className="summary-alert__content">
              <div className="summary-alert__badge">ПРЕВЫШЕНИЕ ДНЕВНОГО ЛИМИТА</div>
              <h3 className="summary-alert__title">
                Маршрут превышает допустимое время на {formatDuration(stats.durationOverheadMinutes)}!
              </h3>
              <p className="summary-alert__desc">
                Суммарное расчетное время составляет <strong>{formatDuration(stats.totalDurationMinutes)}</strong>, а установленный вами максимальный лимит — <strong>{formatDuration(settings.maxDurationMinutes)}</strong>.
              </p>
              {longestPlace && (
                <div className="summary-alert__advice">
                  <div className="summary-alert__advice-content">
                    <TrendingDown size={16} />
                    <span>
                      <strong>Рекомендация по оптимизации:</strong> Исключите самый длительный объект <em>«{longestPlace.title}»</em> ({formatDuration(longestPlace.durationMinutes)}), чтобы уложиться в расписание.
                    </span>
                  </div>
                  <button
                    className="summary-alert__advice-btn"
                    onClick={() => removeFromRoute(longestPlace.id)}
                    title="Исключить этот объект из маршрута в один клик"
                  >
                    <Trash2 size={14} />
                    <span>Исключить «{longestPlace.title}»</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : stats.placesCount > 0 ? (
          <div className="summary-alert summary-alert--success">
            <div className="summary-alert__icon-wrap">
              <CheckCircle2 size={28} className="summary-alert__icon" />
            </div>
            <div className="summary-alert__content">
              <div className="summary-alert__badge">БАЛАНС СОБЛЮДЕН</div>
              <h3 className="summary-alert__title">
                Маршрут идеально укладывается в установленный лимит!
              </h3>
              <p className="summary-alert__desc">
                Общее время <strong>{formatDuration(stats.totalDurationMinutes)}</strong> из допустимых <strong>{formatDuration(settings.maxDurationMinutes)}</strong>. Запас времени на непредвиденные паузы: <strong>{formatDuration(settings.maxDurationMinutes - stats.totalDurationMinutes)}</strong>.
              </p>
            </div>
          </div>
        ) : null}

        {/* Превышение бюджета (если задано) */}
        {stats.isBudgetExceeded && (
          <div className="summary-alert summary-alert--warning">
            <div className="summary-alert__icon-wrap">
              <AlertTriangle size={24} />
            </div>
            <div className="summary-alert__content">
              <h4 className="summary-alert__title">
                Превышение заданного бюджета на {formatCost(stats.budgetOverhead)}!
              </h4>
              <p className="summary-alert__desc">
                Суммарная стоимость билетов: {formatCost(stats.totalCost)} при лимите {formatCost(settings.maxBudget)}.
              </p>
            </div>
          </div>
        )}

        {/* Карточки ключевых показателей */}
        <div className="summary-metrics-grid">
          <div className="metric-card">
            <div className="metric-card__header">
              <span className="metric-card__label">Общая длительность</span>
              <Clock size={20} className="metric-card__icon" />
            </div>
            <div className={`metric-card__val ${stats.isDurationExceeded ? 'metric-card__val--danger' : ''}`}>
              {formatDuration(stats.totalDurationMinutes)}
            </div>
            <div className="metric-card__sub">
              {stats.placesCount > 0 ? (
                <>Включая {formatDuration(stats.totalTransferMinutes)} на трансфер</>
              ) : (
                'Маршрут пуст'
              )}
            </div>
            <div className="metric-progress">
              <div
                className={`metric-progress__fill ${stats.isDurationExceeded ? 'metric-progress__fill--danger' : ''}`}
                style={{ width: `${Math.min(100, (stats.totalDurationMinutes / settings.maxDurationMinutes) * 100)}%` }}
              />
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-card__header">
              <span className="metric-card__label">Общая стоимость</span>
              <span className="metric-card__icon-text">₽</span>
            </div>
            <div className="metric-card__val">
              {formatCost(stats.totalCost)}
            </div>
            <div className="metric-card__sub">
              Сумма билетов и платных активностей
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-card__header">
              <span className="metric-card__label">Локаций в плане</span>
              <MapPin size={20} className="metric-card__icon" />
            </div>
            <div className="metric-card__val">
              {stats.placesCount}
            </div>
            <div className="metric-card__sub">
              {stats.placesCount > 0 ? 'Готовы к посещению' : 'Добавьте из каталога'}
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-card__header">
              <span className="metric-card__label">Время в пути</span>
              <Car size={20} className="metric-card__icon" />
            </div>
            <div className="metric-card__val">
              {formatDuration(stats.totalTransferMinutes)}
            </div>
            <div className="metric-card__sub">
              {stats.placesCount > 1 ? `${stats.placesCount - 1} переезда по 20 мин` : 'Без переездов'}
            </div>
          </div>
        </div>

        {/* Панель настройки дневных лимитов */}
        <div className="summary-settings-card">
          <div className="summary-settings__header">
            <Sliders size={20} className="summary-settings__icon" />
            <div>
              <h3 className="summary-settings__title">Настройка персональных лимитов</h3>
              <p className="summary-settings__desc">
                Укажите, сколько часов в день вы готовы потратить на экскурсии, и установите бюджет поездки.
              </p>
            </div>
          </div>

          <div className="summary-settings__controls">
            {/* Слайдер времени */}
            <div className="settings-field">
              <div className="settings-field__top">
                <label htmlFor="limit-slider" className="settings-field__label">
                  Максимальное время на день:
                </label>
                <span className="settings-field__val">
                  {formatDuration(settings.maxDurationMinutes)}
                </span>
              </div>
              <input
                id="limit-slider"
                type="range"
                min="120"
                max="840"
                step="30"
                value={settings.maxDurationMinutes}
                onChange={(e) => updateSettings({ maxDurationMinutes: Number(e.target.value) })}
                className="settings-slider"
              />
              <div className="settings-slider__scale">
                <span>2ч</span>
                <span>4ч</span>
                <span>6ч</span>
                <span>8ч (стандарт)</span>
                <span>10ч</span>
                <span>12ч</span>
                <span>14ч</span>
              </div>

              {/* Быстрые кнопки пресетов лимита */}
              <div className="settings-quick-btns">
                {[240, 360, 480, 600].map((mins) => (
                  <button
                    key={mins}
                    className={`settings-quick-btn ${settings.maxDurationMinutes === mins ? 'settings-quick-btn--active' : ''}`}
                    onClick={() => updateSettings({ maxDurationMinutes: mins })}
                  >
                    {mins / 60} часов
                  </button>
                ))}
              </div>
            </div>

            {/* Бюджет */}
            <div className="settings-field">
              <div className="settings-field__top">
                <label className="settings-field__label">
                  Лимит бюджета (₽):
                </label>
                <span className="settings-field__val">
                  {settings.maxBudget > 0 ? formatCost(settings.maxBudget) : 'Без ограничений'}
                </span>
              </div>
              <div className="settings-quick-btns">
                {[3000, 5000, 8000, 15000, 0].map((budget) => (
                  <button
                    key={budget}
                    className={`settings-quick-btn ${settings.maxBudget === budget ? 'settings-quick-btn--active' : ''}`}
                    onClick={() => updateSettings({ maxBudget: budget })}
                  >
                    {budget === 0 ? 'Без лимита' : `${budget.toLocaleString('ru-RU')} ₽`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Распечатка / Готовый маршрутный лист */}
        <div className="summary-print-sheet">
          <div className="summary-print-sheet__header">
            <div>
              <h3 className="summary-print-sheet__title">Маршрутный лист экспедиции</h3>
              <p className="summary-print-sheet__sub">
                Готовое расписание для туриста на день
              </p>
            </div>

            <div className="summary-actions no-print">
              <button
                className="summary-btn summary-btn--secondary"
                onClick={handleCopyItinerary}
                disabled={stats.placesCount === 0}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                <span>{copied ? 'Скопировано в буфер!' : 'Копировать расписание'}</span>
              </button>

              <button
                className="summary-btn summary-btn--primary"
                onClick={handlePrint}
                disabled={stats.placesCount === 0}
              >
                <Printer size={16} />
                <span>Печать / Сохранить в PDF</span>
              </button>
            </div>
          </div>

          {/* Сводные показатели маршрутного листа для печати */}
          {stats.placesCount > 0 && (
            <div className="summary-print-meta">
              <div className="summary-print-meta-item">
                <span className="summary-print-meta-label">Суммарное время:</span>
                <strong className="summary-print-meta-val">{formatDuration(stats.totalDurationMinutes)}</strong>
              </div>
              <div className="summary-print-meta-item">
                <span className="summary-print-meta-label">Стоимость билетов:</span>
                <strong className="summary-print-meta-val">{formatCost(stats.totalCost)}</strong>
              </div>
              <div className="summary-print-meta-item">
                <span className="summary-print-meta-label">Количество локаций:</span>
                <strong className="summary-print-meta-val">{stats.placesCount}</strong>
              </div>
              <div className="summary-print-meta-item">
                <span className="summary-print-meta-label">Время на трансфер:</span>
                <strong className="summary-print-meta-val">{formatDuration(stats.totalTransferMinutes)}</strong>
              </div>
              <div className="summary-print-meta-item">
                <span className="summary-print-meta-label">Дневной лимит:</span>
                <strong className="summary-print-meta-val">{formatDuration(settings.maxDurationMinutes)}</strong>
              </div>
            </div>
          )}

          {timelineSchedule.length > 0 ? (
            <div className="print-table-wrap">
              <table className="print-table">
                <thead>
                  <tr>
                    <th>Время</th>
                    <th>Этап / Локация</th>
                    <th>Категория</th>
                    <th>Длительность</th>
                    <th>Билет</th>
                    <th>Адрес</th>
                  </tr>
                </thead>
                <tbody>
                  {timelineSchedule.map((item) => (
                    <React.Fragment key={item.place.id}>
                      <tr>
                        <td className="print-cell-time">
                          {item.startTimeStr} – {item.endTimeStr}
                        </td>
                        <td className="print-cell-title">
                          <strong>Шаг {item.stepIndex}: {item.place.title}</strong>
                        </td>
                        <td>{formatCategory(item.place.category)}</td>
                        <td>{formatDuration(item.durationMinutes)}</td>
                        <td>{formatCost(item.place.cost)}</td>
                        <td className="print-cell-addr">{item.place.location?.address}</td>
                      </tr>
                      {item.transferToNextMinutes > 0 && (
                        <tr className="print-row-transfer">
                          <td className="print-cell-time print-cell-transfer">
                            {item.transferStartStr} – {item.transferEndStr}
                          </td>
                          <td colSpan={5} className="print-cell-transfer-desc">
                            🚗 Переезд к следующей локации (~{item.transferToNextMinutes} мин)
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="summary-sheet-empty">
              <p>В маршруте пока нет объектов. Добавьте их в каталоге для формирования программы.</p>
              <button
                className="summary-btn summary-btn--primary"
                onClick={() => setActiveScreen('catalog')}
              >
                Перейти в каталог объектов <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
