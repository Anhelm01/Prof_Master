import { ArrowRight } from 'lucide-react';
import { useRoute } from '../../context/RouteContext.jsx';
import './Presets.css';

export default function Presets({ onSelectPreset }) {
  const { presets, applyPreset, setActiveScreen } = useRoute();

  const handleSelect = (preset) => {
    if (onSelectPreset) {
      onSelectPreset(preset);
    } else {
      applyPreset(preset);
      setActiveScreen('builder');
    }
  };

  return (
    <section className="presets" id="presets">
      <div className="presets__inner">
        <div className="presets__header">
          <span className="presets__label">Быстрый старт</span>
          <h2 className="presets__title">
            Готовые маршруты <span className="presets__title-accent">на один день</span>
          </h2>
          <p className="presets__subtitle">
            Выберите один из подготовленных маршрутов или настройте свой в каталоге
          </p>
        </div>

        <div className="presets__grid">
          {presets.map((preset) => (
            <button
              key={preset.id}
              className="preset-card"
              onClick={() => handleSelect(preset)}
            >
              <span className="preset-card__emoji">{preset.emoji}</span>
              <h3 className="preset-card__title">{preset.title}</h3>
              <p className="preset-card__desc">{preset.description}</p>
              <span className="preset-card__action">
                Выбрать маршрут <ArrowRight size={16} />
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
