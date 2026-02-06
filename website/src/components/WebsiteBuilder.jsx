import { useLanguage } from '../contexts/LanguageContext';
import './WebsiteBuilder.css';

export default function WebsiteBuilder() {
  const { t } = useLanguage();

  return (
    <section id="website-builder" className="website-builder">
      <div className="container">
        <div className="website-builder-content">
          <div className="website-builder-text">
            <span className="badge">{t.websiteBuilder.badge}</span>
            <h2>{t.websiteBuilder.title}</h2>
            <p className="lead">{t.websiteBuilder.subtitle}</p>

            <ul className="benefits-list">
              {t.websiteBuilder.benefits.map((benefit, index) => (
                <li key={index}>
                  <span className="benefit-icon">{benefit.icon}</span>
                  <div>
                    <strong>{benefit.title}</strong>
                    <p>{benefit.description}</p>
                  </div>
                </li>
              ))}
            </ul>

            <a href="#contact" className="cta-button">
              {t.websiteBuilder.cta}
            </a>
          </div>

          <div className="website-builder-visual">
            <div className="browser-mockup">
              <div className="browser-header">
                <div className="browser-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <div className="browser-url">ville-exemple.civickey.ca</div>
              </div>
              <div className="browser-content">
                <div className="mockup-header"></div>
                <div className="mockup-hero"></div>
                <div className="mockup-cards">
                  <div className="mockup-card"></div>
                  <div className="mockup-card"></div>
                  <div className="mockup-card"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
