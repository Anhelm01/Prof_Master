import { useRef, useState, useEffect, useCallback } from 'react';
import { ArrowRight, Clock, Compass, MapPin } from 'lucide-react';
import hero1 from '../../assets/hero-1.jpg';
import hero2 from '../../assets/hero-2.jpg';
import hero3 from '../../assets/hero-3.jpg';
import { useRoute } from '../../context/RouteContext.jsx';
import './Conveyor.css';

const SLIDES = [
  {
    id: 1,
    src: hero1,
    alt: 'Северный реликтовый лес в утреннем тумане',
    tag: 'ЛОКАЦИЯ 01 • СЕВЕРО-ЗАПАД',
    title: 'Тропа туманных вершин',
    description: 'Вековые сосновые массивы, утренний туман над кронами и чистейший горный воздух. Идеальное начало путешествия для восстановления сил и созерцания.',
    duration: '2 ч 30 мин',
    category: 'Реликтовые леса',
    highlight: 'Легкий трекинг',
    targetScreen: 'catalog',
    categoryFilter: 'nature'
  },
  {
    id: 2,
    src: hero2,
    alt: 'Лазурное горное озеро в лучах рассвета',
    tag: 'ЛОКАЦИЯ 02 • ВОДНЫЙ БАССЕЙН',
    title: 'Зеркальная гладь рассвета',
    description: 'Бирюзовые зеркальные воды в окружении хвойных склонов. Момент тишины на рассвете, каякинг по водной глади и живописные обзорные площадки.',
    duration: '3 ч 00 мин',
    category: 'Озерный край',
    highlight: 'Каякинг и фото',
    targetScreen: 'catalog',
    categoryFilter: 'activity'
  },
  {
    id: 3,
    src: hero3,
    alt: 'Традиционное деревянное шале в предгорьях',
    tag: 'ЛОКАЦИЯ 03 • ГОРНЫЙ ПЕРЕВАЛ',
    title: 'Уютная стоянка на перевале',
    description: 'Традиционные деревянные шале среди альпийских лугов. Теплый привал после долгого перехода, аутентичные гастрономические традиции и закат.',
    duration: '2 ч 00 мин',
    category: 'Горная деревня',
    highlight: 'Гастрономия и уют',
    targetScreen: 'builder'
  },
];

/**
 * Conveyor — Fullscreen immersive image showcase.
 * Вертикальный скролл управляет плавным crossfade + zoom + parallax
 * между тремя фуллскрин-изображениями.
 * Содержит кинематографичные надписи по пути скролла и индикатор слайдов.
 * Лишний нижний прогресс-бар удален.
 */
export default function Conveyor() {
  const { setActiveScreen, openCatalogWithCategory } = useRoute();
  const sectionRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef(null);
  const currentProgress = useRef(0);
  const targetProgress = useRef(0);

  // Smooth lerp animation loop for 60fps butter
  const animate = useCallback(() => {
    const lerp = 0.08;
    currentProgress.current += (targetProgress.current - currentProgress.current) * lerp;

    // Snap when close enough
    if (Math.abs(currentProgress.current - targetProgress.current) < 0.0001) {
      currentProgress.current = targetProgress.current;
    }

    setProgress(currentProgress.current);
    rafRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [animate]);

  // Scroll handler — sets target, lerp does the rest
  useEffect(() => {
    const handleScroll = () => {
      const section = sectionRef.current;
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const sectionHeight = section.offsetHeight;
      const viewportHeight = window.innerHeight;
      const scrolled = -rect.top;
      const scrollable = sectionHeight - viewportHeight;
      targetProgress.current = Math.max(0, Math.min(1, scrolled / scrollable));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Preload images
  useEffect(() => {
    SLIDES.forEach((s) => {
      const img = new Image();
      img.src = s.src;
    });
  }, []);

  const totalSlides = SLIDES.length;

  // Compute per-slide visibility: each slide occupies 1/totalSlides of the progress range
  const getSlideStyle = (index) => {
    const segmentSize = 1 / totalSlides;
    const slideStart = index * segmentSize;
    const slideEnd = slideStart + segmentSize;

    // Opacity: fade in during first 30% of segment, fade out during last 30%
    let opacity = 0;
    const fadeZone = segmentSize * 0.3;

    if (progress >= slideStart && progress <= slideEnd) {
      if (progress < slideStart + fadeZone) {
        opacity = (progress - slideStart) / fadeZone;
      } else if (progress < slideEnd - fadeZone) {
        opacity = 1;
      } else {
        opacity = (slideEnd - progress) / fadeZone;
      }
    }

    // First slide starts fully visible
    if (index === 0 && progress < fadeZone) {
      opacity = 1;
    }

    // Last slide stays visible at end
    if (index === totalSlides - 1 && progress > slideEnd - fadeZone) {
      opacity = 1;
    }

    // Ken Burns: slow zoom + slight vertical parallax
    const slideProgress = Math.max(0, Math.min(1, (progress - slideStart) / segmentSize));
    const scale = 1.0 + slideProgress * 0.12;
    const translateY = (slideProgress - 0.5) * -24;

    return {
      opacity: Math.max(0, Math.min(1, opacity)),
      transform: `scale(${scale}) translateY(${translateY}px)`,
      zIndex: Math.round(opacity * 10),
    };
  };

  // Active slide index for counter
  const activeIndex = Math.min(
    Math.floor(progress * totalSlides),
    totalSlides - 1
  );

  // Compute caption style along the scroll path without sudden flashes or vanishing on slide 3
  const getCaptionStyle = (index) => {
    let opacity = 0;
    let translateY = 20;

    if (index === 0) {
      if (progress < 0.05) {
        opacity = 0;
        translateY = 20;
      } else if (progress < 0.14) {
        // Smooth ease in from 0.05 to 0.14
        const t = (progress - 0.05) / (0.14 - 0.05);
        opacity = t;
        translateY = 20 * (1 - t);
      } else if (progress <= 0.26) {
        // Full visibility
        opacity = 1;
        translateY = 0;
      } else if (progress < 0.35) {
        // Smooth ease out
        const t = (progress - 0.26) / (0.35 - 0.26);
        opacity = 1 - t;
        translateY = -20 * t;
      } else {
        opacity = 0;
        translateY = -20;
      }
    } else if (index === 1) {
      if (progress < 0.31) {
        opacity = 0;
        translateY = 20;
      } else if (progress < 0.40) {
        const t = (progress - 0.31) / (0.40 - 0.31);
        opacity = t;
        translateY = 20 * (1 - t);
      } else if (progress <= 0.60) {
        opacity = 1;
        translateY = 0;
      } else if (progress < 0.69) {
        const t = (progress - 0.60) / (0.69 - 0.60);
        opacity = 1 - t;
        translateY = -20 * t;
      } else {
        opacity = 0;
        translateY = -20;
      }
    } else if (index === 2) {
      // Last slide: stays visible all the way to bottom of the conveyor
      if (progress < 0.65) {
        opacity = 0;
        translateY = 20;
      } else if (progress < 0.74) {
        const t = (progress - 0.65) / (0.74 - 0.65);
        opacity = t;
        translateY = 20 * (1 - t);
      } else {
        opacity = 1;
        translateY = 0;
      }
    }

    const clampedOpacity = Math.max(0, Math.min(1, opacity));
    return {
      opacity: clampedOpacity,
      transform: `translateY(${translateY}px)`,
      pointerEvents: clampedOpacity > 0.35 ? 'auto' : 'none'
    };
  };

  const handleSlideAction = (slide) => {
    if (slide.targetScreen === 'catalog') {
      if (slide.categoryFilter) {
        openCatalogWithCategory(slide.categoryFilter);
      } else {
        setActiveScreen('catalog');
      }
    } else {
      setActiveScreen(slide.targetScreen);
    }
  };

  return (
    <section
      ref={sectionRef}
      className="cv"
      id="conveyor"
    >
      <div className="cv-sticky">
        {/* Fullscreen image layers */}
        {SLIDES.map((slide, i) => {
          const style = getSlideStyle(i);
          return (
            <div
              key={slide.id}
              className="cv-layer"
              style={{ opacity: style.opacity, zIndex: style.zIndex }}
            >
              <div
                className="cv-layer__img"
                style={{
                  backgroundImage: `url(${slide.src})`,
                  transform: style.transform,
                }}
              />
            </div>
          );
        })}

        {/* Soft gradient overlays for text readability */}
        <div className="cv-overlay cv-overlay--top" />
        <div className="cv-overlay cv-overlay--bottom" />

        {/* Minimal branding — clean and clear */}
        <div className={`cv-hero ${progress > 0.05 ? 'cv-hero--fade' : ''}`}>
          <h1 className="cv-hero__title">WayPoint</h1>
          <p className="cv-hero__sub">Спланируй маршрут мечты</p>
        </div>

        {/* Scroll hint */}
        <div className={`cv-scroll-hint ${progress > 0.03 ? 'cv-scroll-hint--hide' : ''}`}>
          <span className="cv-scroll-hint__text">Крутите вниз</span>
          <div className="cv-scroll-hint__line" />
        </div>

        {/* Pure cinematic text along scroll path */}
        <div className="cv-captions-container">
          {SLIDES.map((slide, i) => {
            const capStyle = getCaptionStyle(i);
            return (
              <div
                key={`caption-${slide.id}`}
                className="cv-caption-text"
                style={{
                  opacity: capStyle.opacity,
                  transform: capStyle.transform,
                  pointerEvents: 'none'
                }}
              >
                <span className="cv-caption__tag">{slide.tag}</span>
                <h2 className="cv-caption__title">{slide.title}</h2>
                <p className="cv-caption__desc">{slide.description}</p>
              </div>
            );
          })}
        </div>

        {/* Slide counter — bottom-right, ultra minimal */}
        <div className="cv-counter">
          <span className="cv-counter__current">{String(activeIndex + 1).padStart(2, '0')}</span>
          <span className="cv-counter__sep">/</span>
          <span className="cv-counter__total">{String(totalSlides).padStart(2, '0')}</span>
        </div>
      </div>
    </section>
  );
}
