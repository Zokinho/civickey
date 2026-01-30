import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import './Contact.css';

export default function Contact() {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    municipality: '',
    message: '',
  });
  const [status, setStatus] = useState('idle'); // idle, sending, success, error

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');

    try {
      // Using Formspree for form handling (free tier)
      // Replace YOUR_FORM_ID with your actual Formspree form ID
      const response = await fetch('https://formspree.io/f/xbddbkwk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setStatus('success');
        setFormData({ name: '', email: '', municipality: '', message: '' });
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
    }
  };

  return (
    <section id="contact" className="contact">
      <div className="container">
        <h2>{t.contact.title}</h2>
        <p className="section-subtitle">{t.contact.subtitle}</p>

        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder={t.contact.form.name}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={t.contact.form.email}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <input
              type="text"
              name="municipality"
              value={formData.municipality}
              onChange={handleChange}
              placeholder={t.contact.form.municipality}
            />
          </div>

          <div className="form-group">
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder={t.contact.form.message}
              rows={5}
              required
            />
          </div>

          {status === 'success' && (
            <div className="form-message success">{t.contact.form.success}</div>
          )}
          {status === 'error' && (
            <div className="form-message error">
              {t.contact.form.error}{' '}
              <a href="mailto:zoran@civickey.ca">zoran@civickey.ca</a>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={status === 'sending'}
          >
            {status === 'sending' ? t.contact.form.sending : t.contact.form.send}
          </button>
        </form>
      </div>
    </section>
  );
}
