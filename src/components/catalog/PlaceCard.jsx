import { Clock, Plus, Check, Star, Info } from 'lucide-react';
import { useRoute } from '../../context/RouteContext.jsx';
import { formatDuration, formatCost, formatRating, formatCategory } from '../../utils/formatters.js';
import hero1 from '../../assets/hero-1.jpg';

export default function PlaceCard({ place, onViewDetails }) {
  const { isInRoute, toggleRoute } = useRoute();
  const inRoute = isInRoute(place.id);

  return (
    <article className={`place-card ${inRoute ? 'place-card--in-route' : ''}`}>
      <div className="place-card__media" onClick={() => onViewDetails(place)}>
        <img
          src={place.imageUrl}
          alt={place.title}
          className="place-card__img"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = hero1;
          }}
        />
        <div className="place-card__badges">
          <span className="place-card__badge-cat">{formatCategory(place.category)}</span>
          <span className="place-card__badge-rating">
            <Star size={12} fill="currentColor" stroke="none" />
            {formatRating(place.rating)}
          </span>
        </div>
      </div>

      <div className="place-card__content">
        <h3 className="place-card__title" onClick={() => onViewDetails(place)}>
          {place.title}
        </h3>
        <p className="place-card__desc">{place.shortDesc}</p>

        <div className="place-card__meta">
          <span className="place-card__meta-item">
            <Clock size={14} />
            {formatDuration(place.durationMinutes)}
          </span>
          <span className="place-card__meta-item place-card__meta-cost">
            {formatCost(place.cost)}
          </span>
        </div>

        {place.tags && (
          <div className="place-card__tags">
            {place.tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="place-card__tag">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="place-card__actions">
          <button
            className="place-card__btn-detail"
            onClick={() => onViewDetails(place)}
            title="Посмотреть подробное описание"
          >
            <Info size={15} />
            <span>Подробнее</span>
          </button>

          <button
            className={`place-card__btn-toggle ${inRoute ? 'place-card__btn-toggle--active' : ''}`}
            onClick={() => toggleRoute(place.id)}
            aria-label={inRoute ? 'Убрать из маршрута' : 'Добавить в маршрут'}
          >
            {inRoute ? (
              <>
                <Check size={16} />
                <span>В маршруте</span>
              </>
            ) : (
              <>
                <Plus size={16} />
                <span>В маршрут</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
