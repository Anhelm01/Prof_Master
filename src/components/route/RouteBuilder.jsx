import { useState } from 'react';
import {
  ArrowUp,
  ArrowDown,
  Trash2,
  Clock,
  Car,
  FileEdit,
  ArrowRight,
  Compass,
  Sparkles,
  CalendarDays,
  CheckCircle2,
  ListOrdered,
  AlertTriangle
} from 'lucide-react';
import { useRoute } from '../../context/RouteContext.jsx';
import { formatDuration, formatCost, formatCategory } from '../../utils/formatters.js';
import hero1 from '../../assets/hero-1.jpg';
import './RouteBuilder.css';

export default function RouteBuilder() {
  const {
    stats,
    timelineSchedule,
    settings,
    moveRouteItemUp,
    moveRouteItemDown,
    removeFromRoute,
    routeNotes,
    updateNote,
    clearRoute,
    applyPreset,
    presets,
    setActiveScreen
  } = useRoute();

  const [activeTab, setActiveTab] = useState('sequence');
  const [editingNoteId, setEditingNoteId] = useState(null);

  const places = stats.routePlaces;

  if (places.length === 0) {
    return (
      <section className="builder-page" id="route">
        <div className="builder-container">
          <div className="builder-empty">
            <div className="builder-empty__icon">🗺️</div>
            <h2 className="builder-empty__title">Ваш маршрут пока пуст</h2>
            <p className="builder-empty__desc">
              Добавьте интересные локации из каталога или выберите один из подготовленных пресетов, чтобы сразу увидеть расписание и расчет времени.
            </p>
            <div className="builder-empty__actions">
              <button
                className="builder-empty__btn-catalog"
                onClick={() => setActiveScreen('catalog')}
              >
                <Compass size={18} />
                <span>Перейти в каталог</span>
              </button>
            </div>

            <div className="builder-empty__presets">
              <h4 className="builder-empty__presets-title">
                <Sparkles size={16} /> Быстрый старт: готовые пресеты
              </h4>
              <div className="builder-empty__presets-grid">
                {presets.map((preset) => (
                  <button
                    key={preset.id}
                    className="builder-preset-card"
                    onClick={() => applyPreset(preset)}
                  >
                    <span className="builder-preset-card__emoji">{preset.emoji}</span>
                    <strong className="builder-preset-card__name">{preset.title}</strong>
                    <span className="builder-preset-card__desc">{preset.description}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="builder-page" id="route">
      <div className="builder-container">

        <div className="builder-header">
          <div>
            <div className="builder-header__tag">ИНТЕРАКТИВНЫЙ КОНСТРУКТОР</div>
            <h1 className="builder-header__title">Маршрут экспедиции</h1>
            <p className="builder-header__sub">
              Настраивайте последовательность шагов, читайте расписание дня и добавляйте путевые заметки.
            </p>
          </div>

          <div className="builder-stats-card">
            <div className="builder-stats-item">
              <span className="builder-stats-item__label">Всего локаций</span>
              <span className="builder-stats-item__val">{stats.placesCount}</span>
            </div>
            <div className={`builder-stats-item ${stats.isDurationExceeded ? 'builder-stats-item--warn' : ''}`}>
              <span className="builder-stats-item__label">
                Общее время {stats.isDurationExceeded && '⚠️'}
              </span>
              <span className="builder-stats-item__val">{formatDuration(stats.totalDurationMinutes)}</span>
            </div>
            <div className="builder-stats-item">
              <span className="builder-stats-item__label">Общий бюджет</span>
              <span className="builder-stats-item__val">{formatCost(stats.totalCost)}</span>
            </div>
          </div>
        </div>

        {stats.isDurationExceeded && (
          <div className="builder-alert-bar" role="alert">
            <div className="builder-alert-bar__main">
              <AlertTriangle size={20} className="builder-alert-bar__icon" />
              <div className="builder-alert-bar__text">
                <strong>Лимит времени превышен на {formatDuration(stats.durationOverheadMinutes)}!</strong>
                <span> (Маршрут: {formatDuration(stats.totalDurationMinutes)} / Лимит: {formatDuration(settings.maxDurationMinutes)})</span>
              </div>
            </div>
            <button
              className="builder-alert-bar__action"
              onClick={() => setActiveScreen('summary')}
            >
              <span>Скорректировать в сводке</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}

        <div className="builder-view-switcher">
          <div className="builder-tabs">
            <button
              className={`builder-tab ${activeTab === 'sequence' ? 'builder-tab--active' : ''}`}
              onClick={() => setActiveTab('sequence')}
            >
              <ListOrdered size={16} />
              <span>Последовательность шагов</span>
            </button>
            <button
              className={`builder-tab ${activeTab === 'timeline' ? 'builder-tab--active' : ''}`}
              onClick={() => setActiveTab('timeline')}
            >
              <CalendarDays size={16} />
              <span>Расписание дня (Таймлайн)</span>
            </button>
          </div>

          <div className="builder-header-actions">
            <button
              className="builder-btn-clear"
              onClick={() => {
                if (window.confirm('Очистить весь маршрут?')) clearRoute();
              }}
            >
              Очистить
            </button>
            <button
              className="builder-btn-summary"
              onClick={() => setActiveScreen('summary')}
            >
              <span>К сводке и лимитам</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {activeTab === 'sequence' && (
          <div className="builder-sequence">
            {places.map((place, index) => {
              const isFirst = index === 0;
              const isLast = index === places.length - 1;
              const note = routeNotes[place.id] || '';
              const isEditing = editingNoteId === place.id;

              return (
                <div key={place.id} className="sequence-step-wrapper">
                  <div className="sequence-card">

                    <div className="sequence-step-num">
                      <span className="sequence-step-num__label">ШАГ</span>
                      <span className="sequence-step-num__digit">{index + 1}</span>
                    </div>

                    <div className="sequence-media">
                      <img
                        src={place.imageUrl}
                        alt={place.title}
                        className="sequence-media__img"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = hero1;
                        }}
                      />
                      <span className="sequence-media__cat">{formatCategory(place.category)}</span>
                    </div>

                    <div className="sequence-content">
                      <div className="sequence-content__header">
                        <h3 className="sequence-title">{place.title}</h3>
                        <span className="sequence-cost">{formatCost(place.cost)}</span>
                      </div>
                      <p className="sequence-desc">{place.shortDesc}</p>

                      <div className="sequence-meta">
                        <span className="sequence-meta-item">
                          <Clock size={14} />
                          {formatDuration(place.durationMinutes)}
                        </span>
                        <span className="sequence-address">
                          {place.location?.address}
                        </span>
                      </div>

                      <div className="sequence-note-box">
                        {isEditing ? (
                          <div className="sequence-note-edit">
                            <input
                              type="text"
                              value={note}
                              placeholder="Например: купить входной билет онлайн..."
                              onChange={(e) => updateNote(place.id, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === 'Escape') {
                                  setEditingNoteId(null);
                                }
                              }}
                              autoFocus
                              className="sequence-note-input"
                            />
                            <button
                              className="sequence-note-save"
                              onClick={() => setEditingNoteId(null)}
                            >
                              <CheckCircle2 size={16} /> Сохранить
                            </button>
                          </div>
                        ) : (
                          <div
                            className="sequence-note-display"
                            onClick={() => setEditingNoteId(place.id)}
                            title="Нажмите для редактирования заметки"
                          >
                            <FileEdit size={14} className="sequence-note-icon" />
                            <span className={note ? 'sequence-note-text' : 'sequence-note-placeholder'}>
                              {note || '+ Добавить путевую заметку...'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="sequence-actions">
                      <button
                        className="sequence-action-btn"
                        onClick={() => moveRouteItemUp(index)}
                        disabled={isFirst}
                        title="Переместить выше"
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button
                        className="sequence-action-btn"
                        onClick={() => moveRouteItemDown(index)}
                        disabled={isLast}
                        title="Переместить ниже"
                      >
                        <ArrowDown size={16} />
                      </button>
                      <button
                        className="sequence-action-btn sequence-action-btn--delete"
                        onClick={() => removeFromRoute(place.id)}
                        title="Удалить из маршрута"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {!isLast && (
                    <div className="sequence-transfer-indicator">
                      <div className="sequence-transfer-line" />
                      <div className="sequence-transfer-badge">
                        <Car size={14} />
                        <span>Трансфер между точками ~20 мин</span>
                      </div>
                      <div className="sequence-transfer-line" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="builder-timeline">
            <div className="timeline-info-banner">
              <CalendarDays size={18} />
              <span>
                Расписание рассчитано исходя из начала экспедиции в <strong>09:00</strong> с учетом длительности каждого визита и трансферов по 20 минут.
              </span>
            </div>

            <div className="timeline-track">
              {timelineSchedule.map((item, idx) => {
                const isLast = idx === timelineSchedule.length - 1;
                return (
                  <div key={item.place.id} className="timeline-node">

                    <div className="timeline-marker">
                      <div className="timeline-marker__dot">{item.stepIndex}</div>
                      {!isLast && <div className="timeline-marker__line" />}
                    </div>

                    <div className="timeline-content">
                      <div className="timeline-time-badge">
                        <Clock size={13} />
                        <span>{item.startTimeStr} – {item.endTimeStr}</span>
                        <span className="timeline-time-duration">({formatDuration(item.durationMinutes)})</span>
                      </div>

                      <div className="timeline-card">
                        <img
                          src={item.place.imageUrl}
                          alt={item.place.title}
                          className="timeline-card__img"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = hero1;
                          }}
                        />
                        <div className="timeline-card__body">
                          <div className="timeline-card__category">{formatCategory(item.place.category)}</div>
                          <h4 className="timeline-card__title">{item.place.title}</h4>
                          <p className="timeline-card__addr">{item.place.location?.address}</p>
                          {routeNotes[item.place.id] && (
                            <div className="timeline-card__note">
                              <strong>Заметка:</strong> {routeNotes[item.place.id]}
                            </div>
                          )}
                        </div>
                      </div>

                      {!isLast && (
                        <div className="timeline-transfer-block">
                          <Car size={15} />
                          <span className="timeline-transfer-text">
                            <strong>{item.transferStartStr} – {item.transferEndStr}</strong>: Переезд к следующей локации (20 мин)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
