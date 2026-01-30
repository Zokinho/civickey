import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import './Navbar.css';

export default function Navbar() {
  const { language, toggleLanguage, t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="container navbar-container">
        <a href="#" className="navbar-logo">
          <img src="/logo.png" alt="CivicKey" className="navbar-logo-img" />
          <span className="navbar-logo-text">CivicKey</span>
        </a>

        <button
          className="navbar-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className={`navbar-menu ${menuOpen ? 'open' : ''}`}>
          <a href="#features" onClick={() => setMenuOpen(false)}>
            {t.nav.features}
          </a>
          <a href="#screenshots" onClick={() => setMenuOpen(false)}>
            {t.nav.screenshots}
          </a>
          <a href="#contact" onClick={() => setMenuOpen(false)}>
            {t.nav.contact}
          </a>
          <button className="lang-toggle" onClick={toggleLanguage}>
            {language === 'en' ? 'FR' : 'EN'}
          </button>
        </div>
      </div>
    </nav>
  );
}
