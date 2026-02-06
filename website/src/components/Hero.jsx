import { useLanguage } from '../contexts/LanguageContext';
import './Hero.css';

export default function Hero() {
  const { t } = useLanguage();

  return (
    <section className="hero">
      <div className="container hero-container">
        <div className="hero-content">
          <span className="hero-badge">{t.hero.badge}</span>
          <h1>{t.hero.tagline}</h1>
          <p>{t.hero.subtitle}</p>

          <div className="hero-buttons">
            <a href="#contact" className="btn btn-primary">
              {t.hero.cta}
            </a>
          </div>

          <div className="app-stores">
            <a href="#" className="store-badge" aria-label="App Store">
              <svg viewBox="0 0 180 60" className="badge-svg">
                <rect width="180" height="60" rx="8" fill="#000"/>
                <g fill="#fff">
                  <g transform="translate(18, 12) scale(1.4)">
                    <path d="M15.5 9.8c-.1-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3.1-1.7-1.3-.1-2.6.8-3.2.8-.7 0-1.7-.8-2.8-.7-1.4 0-2.8.8-3.5 2.1-1.5 2.6-.4 6.5 1.1 8.6.7 1 1.6 2.2 2.7 2.1 1.1 0 1.5-.7 2.8-.7s1.7.7 2.8.7c1.2 0 2-1 2.7-2.1.8-1.2 1.2-2.4 1.2-2.4 0 0-2.3-.9-2.5-3.5zm-2.3-6.4c.6-.7 1-1.7.9-2.7-.9 0-1.9.6-2.6 1.4-.6.7-1.1 1.7-.9 2.7.9.1 1.9-.5 2.6-1.4z"/>
                  </g>
                  <text x="55" y="24" fontFamily="Arial, sans-serif" fontSize="10" fill="#fff">{t.hero.appStore.subtitle}</text>
                  <text x="55" y="42" fontFamily="Arial, sans-serif" fontSize="18" fontWeight="600" fill="#fff">{t.hero.appStore.title}</text>
                </g>
              </svg>
              <span className="coming-soon-badge">{t.hero.comingSoon}</span>
            </a>
            <a href="#" className="store-badge" aria-label="Google Play">
              <svg viewBox="0 0 180 60" className="badge-svg">
                <rect width="180" height="60" rx="8" fill="#000"/>
                <g transform="translate(15, 12)">
                  <path d="M0 2.5L0 33.5L18 18L0 2.5Z" fill="#4285F4"/>
                  <path d="M0 2.5L18 18L24 12L4 0L0 2.5Z" fill="#EA4335"/>
                  <path d="M0 33.5L18 18L24 24L4 36L0 33.5Z" fill="#34A853"/>
                  <path d="M24 12L18 18L24 24L28 21L28 15L24 12Z" fill="#FBBC05"/>
                </g>
                <g fill="#fff">
                  <text x="55" y="24" fontFamily="Arial, sans-serif" fontSize="10" fill="#fff">{t.hero.googlePlay.subtitle}</text>
                  <text x="55" y="42" fontFamily="Arial, sans-serif" fontSize="18" fontWeight="600" fill="#fff">{t.hero.googlePlay.title}</text>
                </g>
              </svg>
              <span className="coming-soon-badge">{t.hero.comingSoon}</span>
            </a>
          </div>
        </div>

        <div className="hero-visual">
          <div className="phone-mockup">
            <img src="/screenshots/hero-phone.png" alt="CivicKey App" />
          </div>
        </div>
      </div>
    </section>
  );
}
