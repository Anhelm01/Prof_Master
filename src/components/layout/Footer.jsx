import { MapPin, Heart } from 'lucide-react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <MapPin size={18} />
          <span className="footer__logo">WayPoint</span>
        </div>
        <p className="footer__copy">
          Конкурс профессионального мастерства — I этап
        </p>
        <p className="footer__made">
          Сделано с <Heart size={14} fill="var(--color-apple)" stroke="none" /> для путешественников
        </p>
      </div>
    </footer>
  );
}
