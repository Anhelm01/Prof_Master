import { useEffect } from 'react';
import { RouteProvider, useRoute } from './context/RouteContext.jsx';
import Header from './components/layout/Header.jsx';
import Footer from './components/layout/Footer.jsx';
import Conveyor from './components/showcase/Conveyor.jsx';
import Presets from './components/showcase/Presets.jsx';
import Catalog from './components/catalog/Catalog.jsx';
import RouteBuilder from './components/route/RouteBuilder.jsx';
import RouteSummary from './components/summary/RouteSummary.jsx';

/**
 * AppContent — Контейнер экранов приложения «WayPoint».
 * Поддерживает бесшовное переключение между:
 * 1. Главная (кинематографичный конвейер + пресеты)
 * 2. Каталог туристических объектов (фильтрация, поиск, модалка)
 * 3. Конструктор маршрута (последовательность, порядок, таймлайн)
 * 4. Сводка и лимиты (аналитика, предупреждение о превышении, печать/экспорт)
 */
function AppContent() {
  const { activeScreen } = useRoute();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeScreen]);

  return (
    <div className="app-layout">
      <Header />
      <main className="app-main app-screen-enter" key={activeScreen}>
        {activeScreen === 'home' && (
          <>
            <Conveyor />
            <Presets />
          </>
        )}
        {activeScreen === 'catalog' && <Catalog />}
        {activeScreen === 'builder' && <RouteBuilder />}
        {activeScreen === 'summary' && <RouteSummary />}
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <RouteProvider>
      <AppContent />
    </RouteProvider>
  );
}
