import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import './Features.css';

export default function Features() {
  const { t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(3);

  // Adjust visible count based on screen size
  useEffect(() => {
    const updateVisibleCount = () => {
      if (window.innerWidth < 640) {
        setVisibleCount(1);
      } else if (window.innerWidth < 1024) {
        setVisibleCount(2);
      } else {
        setVisibleCount(3);
      }
    };

    updateVisibleCount();
    window.addEventListener('resize', updateVisibleCount);
    return () => window.removeEventListener('resize', updateVisibleCount);
  }, []);

  const totalItems = t.features.items.length;
  const maxIndex = Math.max(0, totalItems - visibleCount);

  const goToPrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
  };

  const goToSlide = (index) => {
    setCurrentIndex(Math.min(index, maxIndex));
  };

  return (
    <section id="features" className="features">
      <div className="container">
        <h2>{t.features.title}</h2>
        <p className="section-subtitle">{t.features.subtitle}</p>

        <div className="features-carousel">
          <button
            className="features-nav-btn features-nav-prev"
            onClick={goToPrev}
            disabled={currentIndex === 0}
            aria-label="Previous"
          >
            ‹
          </button>

          <div className="features-viewport">
            <div
              className="features-track"
              style={{
                transform: `translateX(-${currentIndex * (100 / visibleCount)}%)`,
              }}
            >
              {t.features.items.map((feature, index) => (
                <div
                  key={index}
                  className="feature-card"
                  style={{ flex: `0 0 ${100 / visibleCount}%` }}
                >
                  <span className="feature-icon">{feature.icon}</span>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
              ))}
            </div>
          </div>

          <button
            className="features-nav-btn features-nav-next"
            onClick={goToNext}
            disabled={currentIndex >= maxIndex}
            aria-label="Next"
          >
            ›
          </button>
        </div>

        <div className="features-dots">
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <button
              key={index}
              className={`features-dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
