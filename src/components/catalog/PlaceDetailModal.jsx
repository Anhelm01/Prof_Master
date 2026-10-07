import { useEffect } from 'react';
import { X, Clock, MapPin, Star, Tag, Check, Plus, Calendar } from 'lucide-react';
import { useRoute } from '../../context/RouteContext.jsx';
import { formatDuration, formatCost, formatRating, formatCategory } from '../../utils/formatters.js';
import hero1 from '../../assets/hero-1.jpg';
import './Catalog.css';

export default function PlaceDetailModal({ place, onClose }) {
  const { isInRoute, toggleRoute } = useRoute();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (!place) return null;

  const inRoute = isInRoute(place.id);

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Закрыть">
          <X size={20} />
        </button>

        <div className="modal-cover">
          <img
            src={place.imageUrl}
            alt={place.title}
            className="modal-cover__img"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = hero1;
            }}
          />
          <div className="modal-cover__overlay" />
          <div className="modal-cover__badges">
            <span className="modal-badge-cat">{formatCategory(place.category)}</span>
            <span className="modal-badge-rating">
              <Star size={13} fill="currentColor" stroke="none" />
              {formatRating(place.rating)}
            </span>
          </div>
        </div>

        <div className="modal-body">
          <h2 className="modal-title">{place.title}</h2>
          <p className="modal-desc">{place.fullDesc || place.shortDesc}</p>

          <div className="modal-facts">
            <div className="modal-fact">
              <Clock size={16} className="modal-fact__icon" />
              <div>
                <div className="modal-fact__label">Рекомендуемое время</div>
                <div className="modal-fact__val">{formatDuration(place.durationMinutes)}</div>
              </div>
            </div>

            <div className="modal-fact">
              <span className="modal-fact__icon-text">₽</span>
              <div>
                <div className="modal-fact__label">Стоимость билета</div>
                <div className="modal-fact__val">{formatCost(place.cost)}</div>
              </div>
            </div>

            <div className="modal-fact">
              <Calendar size={16} className="modal-fact__icon" />
              <div>
                <div className="modal-fact__label">Часы работы</div>
                <div className="modal-fact__val">{place.openingHours || '10:00 – 19:00'}</div>
              </div>
            </div>

            <div className="modal-fact">
              <MapPin size={16} className="modal-fact__icon" />
              <div>
                <div className="modal-fact__label">Адрес</div>
                <div className="modal-fact__val">{place.location?.address || 'Центральный район'}</div>
              </div>
            </div>
          </div>

          {place.tags && place.tags.length > 0 && (
            <div className="modal-tags">
              <div className="modal-tags__title">
                <Tag size={14} /> Теги и особенности
              </div>
              <div className="modal-tags__list">
                {place.tags.map((t, idx) => (
                  <span key={idx} className="modal-tag-item">#{t}</span>
                ))}
              </div>
            </div>
          )}

          <div className="modal-actions">
            <button
              className={`modal-btn-route ${inRoute ? 'modal-btn-route--active' : ''}`}
              onClick={() => toggleRoute(place.id)}
            >
              {inRoute ? (
                <>
                  <Check size={18} />
                  <span>В вашем маршруте (Нажмите, чтобы убрать)</span>
                </>
              ) : (
                <>
                  <Plus size={18} />
                  <span>Добавить объект в маршрут</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
