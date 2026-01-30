import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import './LegalPage.css';

export default function TermsOfService() {
  const { language } = useLanguage();

  const content = {
    en: {
      title: 'Terms of Service',
      lastUpdated: 'Last updated: January 2026',
      sections: [
        {
          title: 'Acceptance of Terms',
          content: `By downloading, installing, or using CivicKey ("the App"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the App.`
        },
        {
          title: 'Description of Service',
          content: `CivicKey is a mobile application that provides users with municipal information including:`,
          list: [
            'Collection schedules (garbage, recycling, compost)',
            'Local community events',
            'Municipal announcements and alerts',
            'Road closure information'
          ]
        },
        {
          title: 'Use of the App',
          content: `You agree to use CivicKey only for lawful purposes and in accordance with these Terms. You agree not to:`,
          list: [
            'Use the App in any way that violates any applicable law or regulation',
            'Attempt to interfere with the proper functioning of the App',
            'Attempt to access data not intended for you',
            'Use the App to transmit any malware or harmful code'
          ]
        },
        {
          title: 'Information Accuracy',
          content: `While we strive to provide accurate and up-to-date municipal information, CivicKey is provided for informational purposes only. We make no guarantees about the accuracy, completeness, or timeliness of the information displayed. Always verify critical information (such as collection schedules during holidays) with your local municipality.`
        },
        {
          title: 'Notifications',
          content: `CivicKey offers optional notification reminders for collection days. These notifications are scheduled locally on your device and depend on your device settings. We are not responsible for missed notifications due to device settings, battery optimization, or other technical factors.`
        },
        {
          title: 'Intellectual Property',
          content: `The App, including its design, features, and content, is owned by CivicKey and is protected by intellectual property laws. You may not copy, modify, distribute, or create derivative works based on the App without our prior written consent.`
        },
        {
          title: 'Disclaimer of Warranties',
          content: `THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE APP WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS.`
        },
        {
          title: 'Limitation of Liability',
          content: `TO THE FULLEST EXTENT PERMITTED BY LAW, CIVICKEY SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR RELATED TO YOUR USE OF THE APP.`
        },
        {
          title: 'Changes to Terms',
          content: `We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting in the App or on our website. Your continued use of the App after changes constitutes acceptance of the new Terms.`
        },
        {
          title: 'Governing Law',
          content: `These Terms shall be governed by and construed in accordance with the laws of the Province of Quebec, Canada, without regard to its conflict of law provisions.`
        },
        {
          title: 'Contact Us',
          content: `If you have questions about these Terms of Service, please contact us at:`,
          contact: 'team@civickey.ca'
        }
      ]
    },
    fr: {
      title: 'Conditions d\'utilisation',
      lastUpdated: 'Dernière mise à jour : janvier 2026',
      sections: [
        {
          title: 'Acceptation des conditions',
          content: `En téléchargeant, installant ou utilisant CivicKey (« l'application »), vous acceptez d'être lié par ces conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser l'application.`
        },
        {
          title: 'Description du service',
          content: `CivicKey est une application mobile qui fournit aux utilisateurs des informations municipales, notamment :`,
          list: [
            'Les horaires de collecte (ordures, recyclage, compost)',
            'Les événements communautaires locaux',
            'Les annonces et alertes municipales',
            'Les informations sur les fermetures de routes'
          ]
        },
        {
          title: 'Utilisation de l\'application',
          content: `Vous acceptez d'utiliser CivicKey uniquement à des fins légales et conformément à ces conditions. Vous acceptez de ne pas :`,
          list: [
            'Utiliser l\'application d\'une manière qui viole toute loi ou réglementation applicable',
            'Tenter d\'interférer avec le bon fonctionnement de l\'application',
            'Tenter d\'accéder à des données qui ne vous sont pas destinées',
            'Utiliser l\'application pour transmettre des logiciels malveillants ou du code nuisible'
          ]
        },
        {
          title: 'Exactitude des informations',
          content: `Bien que nous nous efforcions de fournir des informations municipales exactes et à jour, CivicKey est fourni à titre informatif uniquement. Nous ne garantissons pas l'exactitude, l'exhaustivité ou l'actualité des informations affichées. Vérifiez toujours les informations critiques (comme les horaires de collecte pendant les jours fériés) auprès de votre municipalité locale.`
        },
        {
          title: 'Notifications',
          content: `CivicKey offre des rappels de notification optionnels pour les jours de collecte. Ces notifications sont programmées localement sur votre appareil et dépendent de vos paramètres d'appareil. Nous ne sommes pas responsables des notifications manquées en raison des paramètres de l'appareil, de l'optimisation de la batterie ou d'autres facteurs techniques.`
        },
        {
          title: 'Propriété intellectuelle',
          content: `L'application, y compris sa conception, ses fonctionnalités et son contenu, appartient à CivicKey et est protégée par les lois sur la propriété intellectuelle. Vous ne pouvez pas copier, modifier, distribuer ou créer des œuvres dérivées basées sur l'application sans notre consentement écrit préalable.`
        },
        {
          title: 'Exclusion de garanties',
          content: `L'APPLICATION EST FOURNIE « TELLE QUELLE » ET « SELON DISPONIBILITÉ » SANS GARANTIE D'AUCUNE SORTE, EXPRESSE OU IMPLICITE. NOUS NE GARANTISSONS PAS QUE L'APPLICATION SERA ININTERROMPUE, SANS ERREUR OU EXEMPTE DE VIRUS OU D'AUTRES COMPOSANTS NUISIBLES.`
        },
        {
          title: 'Limitation de responsabilité',
          content: `DANS TOUTE LA MESURE PERMISE PAR LA LOI, CIVICKEY NE SERA PAS RESPONSABLE DE TOUT DOMMAGE INDIRECT, ACCESSOIRE, SPÉCIAL, CONSÉCUTIF OU PUNITIF DÉCOULANT DE OU LIÉ À VOTRE UTILISATION DE L'APPLICATION.`
        },
        {
          title: 'Modifications des conditions',
          content: `Nous nous réservons le droit de modifier ces conditions à tout moment. Les modifications entreront en vigueur immédiatement après leur publication dans l'application ou sur notre site Web. Votre utilisation continue de l'application après les modifications constitue une acceptation des nouvelles conditions.`
        },
        {
          title: 'Loi applicable',
          content: `Ces conditions sont régies et interprétées conformément aux lois de la province de Québec, Canada, sans égard aux principes de conflits de lois.`
        },
        {
          title: 'Nous contacter',
          content: `Si vous avez des questions concernant ces conditions d'utilisation, veuillez nous contacter à :`,
          contact: 'team@civickey.ca'
        }
      ]
    }
  };

  const t = content[language] || content.en;

  return (
    <div className="legal-page">
      <div className="legal-container">
        <Link to="/" className="back-link">
          {language === 'fr' ? '← Retour à l\'accueil' : '← Back to Home'}
        </Link>

        <h1>{t.title}</h1>
        <p className="last-updated">{t.lastUpdated}</p>

        {t.sections.map((section, index) => (
          <section key={index} className="legal-section">
            <h2>{section.title}</h2>
            <p>{section.content}</p>
            {section.list && (
              <ul>
                {section.list.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            )}
            {section.contact && (
              <p className="contact-email">
                <a href={`mailto:${section.contact}`}>{section.contact}</a>
              </p>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
