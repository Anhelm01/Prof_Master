import { useState, useEffect } from 'react';
import { MapPin, Menu, X, Compass, Route as RouteIcon, BarChart3, AlertTriangle } from 'lucide-react';
import { useRoute } from '../../context/RouteContext.jsx';
import './Header.css';

export default function Header() {
  const { activeScreen, setActiveScreen, stats } = useRoute();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const handleNavClick = (screen) => {
    setActiveScreen(screen);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isLightPage = activeScreen !== 'home';

  return (
    <>
      <header className={`header ${scrolled || isLightPage ? 'header--scrolled' : ''}`}>
        <div className="header__inner">
          <button
            className="header__logo"
            onClick={() => handleNavClick('home')}
            aria-label="На главную"
          >
            <div className="header__logo-icon">
              <MapPin size={20} strokeWidth={2.5} />
            </div>
            <span className="header__logo-text">WayPoint</span>
          </button>

          <nav className={`header__nav ${menuOpen ? 'header__nav--open' : ''}`}>
            <button
              className={`header__link ${activeScreen === 'home' ? 'header__link--active' : ''}`}
              onClick={() => handleNavClick('home')}
            >
              Главная
            </button>

            <button
              className={`header__link ${activeScreen === 'catalog' ? 'header__link--active' : ''}`}
              onClick={() => handleNavClick('catalog')}
            >
              <Compass size={16} />
              <span>Каталог</span>
            </button>

            <button
              className={`header__link ${activeScreen === 'builder' ? 'header__link--active' : ''}`}
              onClick={() => handleNavClick('builder')}
            >
              <RouteIcon size={16} />
              <span>Маршрут</span>
              {stats.placesCount > 0 && (
                <span className="header__badge">{stats.placesCount}</span>
              )}
            </button>

            <button
              className={`header__link ${activeScreen === 'summary' ? 'header__link--active' : ''}`}
              onClick={() => handleNavClick('summary')}
            >
              <BarChart3 size={16} />
              <span>Сводка</span>
              {stats.isDurationExceeded && (
                <span className="header__badge-warn" title="Превышен лимит времени!">
                  <AlertTriangle size={12} />
                </span>
              )}
            </button>
          </nav>

          <div className="header__actions">
            {stats.placesCount > 0 && activeScreen !== 'summary' && (
              <button
                className="header__quick-cta"
                onClick={() => handleNavClick('summary')}
              >
                Итог: {stats.placesCount} мест
              </button>
            )}

            <button
              className="header__burger"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Меню"
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Backdrop for mobile navigation drawer */}
      {menuOpen && (
        <div
          className="header__backdrop"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}
