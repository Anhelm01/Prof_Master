import { useState, useMemo } from 'react';
import {
  Search,
  SlidersHorizontal,
  X,
  Compass,
  Landmark,
  TreePine,
  Palette,
  UtensilsCrossed,
  Bike,
  Globe,
  ArrowRight
} from 'lucide-react';
import { useRoute } from '../../context/RouteContext.jsx';
import PlaceCard from './PlaceCard.jsx';
import PlaceDetailModal from './PlaceDetailModal.jsx';
import './Catalog.css';

const CATEGORY_ICONS = {
  all: Globe,
  culture: Palette,
  architecture: Landmark,
  nature: TreePine,
  food: UtensilsCrossed,
  activity: Bike
};

export default function Catalog() {
  const {
    places,
    categories,
    stats,
    setActiveScreen,
    selectedCategory,
    setSelectedCategory
  } = useRoute();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [modalPlace, setModalPlace] = useState(null);

  const categoriesWithCount = useMemo(() => {
    return categories.map((cat) => {
      const count =
        cat.id === 'all'
          ? places.length
          : places.filter((p) => p.category === cat.id).length;
      return { ...cat, count };
    });
  }, [categories, places]);

  const filteredAndSortedPlaces = useMemo(() => {
    let result = places.filter((place) => {

      if (selectedCategory !== 'all' && place.category !== selectedCategory) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inTitle = place.title.toLowerCase().includes(q);
        const inDesc = (place.shortDesc + ' ' + (place.fullDesc || '')).toLowerCase().includes(q);
        const inAddress = place.location?.address?.toLowerCase().includes(q);
        const inTags = place.tags?.some((t) => t.toLowerCase().includes(q));
        if (!inTitle && !inDesc && !inAddress && !inTags) {
          return false;
        }
      }
      return true;
    });

    switch (sortBy) {
      case 'cost-asc':
        result.sort((a, b) => a.cost - b.cost);
        break;
      case 'cost-desc':
        result.sort((a, b) => b.cost - a.cost);
        break;
      case 'duration-asc':
        result.sort((a, b) => a.durationMinutes - b.durationMinutes);
        break;
      case 'duration-desc':
        result.sort((a, b) => b.durationMinutes - a.durationMinutes);
        break;
      case 'rating-desc':
        result.sort((a, b) => b.rating - a.rating);
        break;
      default:
        break;
    }

    return result;
  }, [places, selectedCategory, searchQuery, sortBy]);

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setSortBy('default');
  };

  return (
    <section className="catalog-page" id="catalog">
      <div className="catalog-container">

        <div className="catalog-header">
          <div className="catalog-header__tag">ЭКСПЕДИЦИОННЫЙ КАТАЛОГ</div>
          <h1 className="catalog-header__title">Достопримечательности и локации</h1>
          <p className="catalog-header__sub">
            Исследуйте ключевые культурные объекты, шедевры архитектуры, парки и гастрономические точки.
            Добавляйте любые места в свой индивидуальный маршрут.
          </p>
        </div>

        <div className="catalog-controls">
          <div className="catalog-search">
            <Search size={18} className="catalog-search__icon" />
            <input
              type="text"
              placeholder="Поиск по названию, адресу или тегам..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="catalog-search__input"
            />
            {searchQuery && (
              <button
                className="catalog-search__clear"
                onClick={() => setSearchQuery('')}
                aria-label="Очистить поиск"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="catalog-sort">
            <SlidersHorizontal size={16} className="catalog-sort__icon" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="catalog-sort__select"
            >
              <option value="default">Сортировка: По умолчанию</option>
              <option value="rating-desc">По рейтингу (высокие)</option>
              <option value="cost-asc">Стоимость: сначала дешевле</option>
              <option value="cost-desc">Стоимость: сначала дороже</option>
              <option value="duration-asc">Время визита: короткие</option>
              <option value="duration-desc">Время визита: длительные</option>
            </select>
          </div>
        </div>

        <div className="catalog-categories">
          {categoriesWithCount.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.id] || Compass;
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                className={`category-pill ${isActive ? 'category-pill--active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                <Icon size={16} />
                <span>{cat.label}</span>
                <span className="category-pill__count">{cat.count}</span>
              </button>
            );
          })}
        </div>

        <div className="catalog-meta-bar">
          <div className="catalog-meta-bar__count">
            Найдено объектов: <strong>{filteredAndSortedPlaces.length}</strong>
            {(selectedCategory !== 'all' || searchQuery || sortBy !== 'default') && (
              <button className="catalog-meta-bar__reset" onClick={handleResetFilters}>
                Сбросить фильтры
              </button>
            )}
          </div>

          {stats.placesCount > 0 && (
            <button
              className="catalog-meta-bar__route-hint"
              onClick={() => setActiveScreen('builder')}
            >
              <span>В маршруте: {stats.placesCount} мест</span>
              <ArrowRight size={15} />
            </button>
          )}
        </div>

        {filteredAndSortedPlaces.length > 0 ? (
          <div className="catalog-grid">
            {filteredAndSortedPlaces.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                onViewDetails={(p) => setModalPlace(p)}
              />
            ))}
          </div>
        ) : (
          <div className="catalog-empty">
            <div className="catalog-empty__icon">🔍</div>
            <h3 className="catalog-empty__title">Ничего не найдено</h3>
            <p className="catalog-empty__desc">
              По вашему запросу не нашлось подходящих локаций. Попробуйте изменить параметры поиска или сбросить фильтры.
            </p>
            <button className="catalog-empty__btn" onClick={handleResetFilters}>
              Сбросить фильтры
            </button>
          </div>
        )}
      </div>

      {modalPlace && (
        <PlaceDetailModal
          place={modalPlace}
          onClose={() => setModalPlace(null)}
        />
      )}
    </section>
  );
}
