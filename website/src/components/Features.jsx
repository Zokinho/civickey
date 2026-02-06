import { useLanguage } from '../contexts/LanguageContext';
import './Features.css';

export default function Features() {
  const { t } = useLanguage();

  return (
    <section id="features" className="features">
      <div className="container">
        <h2>{t.features.title}</h2>
        <p className="section-subtitle">{t.features.subtitle}</p>

        <div className="features-grid">
          {t.features.items.map((feature, index) => (
            <div key={index} className="feature-card">
              <span className="feature-icon">{feature.icon}</span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
