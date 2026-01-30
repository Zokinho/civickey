import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import './Screenshots.css';

// Add your screenshot filenames here
const screenshots = [
  { src: '/screenshots/screen1.png', alt: 'Home Screen' },
  { src: '/screenshots/screen2.png', alt: 'Schedule Screen' },
  { src: '/screenshots/screen3.png', alt: 'Events Screen' },
  { src: '/screenshots/screen4.png', alt: 'Settings Screen' },
];

export default function Screenshots() {
  const { t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? screenshots.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === screenshots.length - 1 ? 0 : prev + 1));
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  return (
    <section id="screenshots" className="screenshots">
      <div className="container">
        <h2>{t.screenshots.title}</h2>
        <p className="section-subtitle">{t.screenshots.subtitle}</p>

        <div className="carousel">
          <button className="carousel-btn prev" onClick={goToPrevious} aria-label="Previous">
            ‹
          </button>

          <div className="carousel-container">
            <div
              className="carousel-track"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {screenshots.map((screenshot, index) => (
                <div key={index} className="carousel-slide">
                  <div className="phone-frame">
                    <img src={screenshot.src} alt={screenshot.alt} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button className="carousel-btn next" onClick={goToNext} aria-label="Next">
            ›
          </button>
        </div>

        <div className="carousel-dots">
          {screenshots.map((_, index) => (
            <button
              key={index}
              className={`dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
