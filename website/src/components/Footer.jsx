import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import './Footer.css';

export default function Footer() {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-brand">
            <img src="/logo.png" alt="CivicKey" className="footer-logo" />
            <h3>CivicKey</h3>
            <p>{t.footer.tagline}</p>
          </div>

          <div className="footer-links">
            <div className="footer-column">
              <h4>{t.footer.contact}</h4>
              <a href="mailto:team@civickey.ca">team@civickey.ca</a>
            </div>

            <div className="footer-column">
              <h4>{t.footer.legal}</h4>
              <Link to="/privacy">{t.footer.privacy}</Link>
              <Link to="/terms">{t.footer.terms}</Link>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>{t.footer.copyright.replace('{year}', currentYear)}</p>
        </div>
      </div>
    </footer>
  );
}
