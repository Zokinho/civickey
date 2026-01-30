import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import './LegalPage.css';

export default function PrivacyPolicy() {
  const { language } = useLanguage();

  const content = {
    en: {
      title: 'Privacy Policy',
      lastUpdated: 'Last updated: January 29, 2026',
      sections: [
        {
          title: 'Introduction',
          content: `CivicKey ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our mobile application.`
        },
        {
          title: 'Information We Collect',
          content: `CivicKey is designed with privacy in mind. We collect minimal information to provide you with the best experience:`,
          list: [
            'Municipality and zone selection (stored locally on your device)',
            'Language preference (stored locally on your device)',
            'Theme preference - light or dark mode (stored locally on your device)',
            'Notification time preferences (stored locally on your device)',
            'No personal information such as name, email, or phone number is collected',
            'No location data is tracked or stored',
            'No user accounts are required to use the app'
          ]
        },
        {
          title: 'How We Use Information',
          content: `The information stored on your device is used solely to:`,
          list: [
            'Display relevant collection schedules for your selected zone',
            'Show local events and announcements from your municipality',
            'Display facility hours and contact information for municipal services',
            'Send you local notification reminders at your preferred time',
            'Display the app in your preferred language and theme'
          ]
        },
        {
          title: 'Device Permissions',
          content: `CivicKey may request the following optional permissions:`,
          list: [
            'Notifications: To send you reminders about collection days. You can disable this at any time in your device settings.',
            'Network: To fetch the latest municipal information. When offline, the app displays cached data.'
          ]
        },
        {
          title: 'Data Storage',
          content: `All preference data is stored locally on your device using secure storage mechanisms. We do not transmit or store any personal data on our servers. Municipal information (schedules, events, announcements) is fetched from our secure database but does not require any personal information to access.`
        },
        {
          title: 'Third-Party Services',
          content: `CivicKey uses the following services:`,
          list: [
            'Firebase (Google): Used to store and retrieve public municipal data such as collection schedules, events, and announcements. No personal user data is stored in Firebase.',
            'Expo Notifications: Used to deliver local notification reminders. Notifications are scheduled locally on your device.'
          ]
        },
        {
          title: 'Data Sharing',
          content: `We do not sell, trade, or otherwise transfer your information to third parties. Since we do not collect personal information, there is no personal data to share.`
        },
        {
          title: 'Children\'s Privacy',
          content: `CivicKey does not collect any personal information from anyone, including children under 13. The app is safe for users of all ages.`
        },
        {
          title: 'Your Rights',
          content: `You can clear all locally stored preferences at any time by using the "Reset App" feature in the Settings screen. This will remove all stored preferences from your device.`
        },
        {
          title: 'Changes to This Policy',
          content: `We may update this Privacy Policy from time to time. Any changes will be reflected in the "Last updated" date at the top of this page. We encourage you to review this policy periodically.`
        },
        {
          title: 'Contact Us',
          content: `If you have questions about this Privacy Policy, please contact us at:`,
          contact: 'team@civickey.ca'
        }
      ]
    },
    fr: {
      title: 'Politique de confidentialité',
      lastUpdated: 'Dernière mise à jour : 29 janvier 2026',
      sections: [
        {
          title: 'Introduction',
          content: `CivicKey (« nous », « notre » ou « nos ») s'engage à protéger votre vie privée. Cette politique de confidentialité explique comment nous collectons, utilisons et protégeons vos informations lorsque vous utilisez notre application mobile.`
        },
        {
          title: 'Informations que nous collectons',
          content: `CivicKey est conçu avec la confidentialité à l'esprit. Nous collectons un minimum d'informations pour vous offrir la meilleure expérience :`,
          list: [
            'Sélection de la municipalité et de la zone (stockée localement sur votre appareil)',
            'Préférence de langue (stockée localement sur votre appareil)',
            'Préférence de thème - mode clair ou sombre (stockée localement sur votre appareil)',
            'Préférences d\'heure de notification (stockées localement sur votre appareil)',
            'Aucune information personnelle telle que nom, courriel ou numéro de téléphone n\'est collectée',
            'Aucune donnée de localisation n\'est suivie ou stockée',
            'Aucun compte utilisateur n\'est requis pour utiliser l\'application'
          ]
        },
        {
          title: 'Comment nous utilisons les informations',
          content: `Les informations stockées sur votre appareil sont utilisées uniquement pour :`,
          list: [
            'Afficher les horaires de collecte pertinents pour votre zone sélectionnée',
            'Afficher les événements locaux et annonces de votre municipalité',
            'Afficher les heures d\'ouverture et coordonnées des services municipaux',
            'Vous envoyer des rappels de notification locale à l\'heure de votre choix',
            'Afficher l\'application dans votre langue et thème préférés'
          ]
        },
        {
          title: 'Permissions de l\'appareil',
          content: `CivicKey peut demander les permissions optionnelles suivantes :`,
          list: [
            'Notifications : Pour vous envoyer des rappels concernant les jours de collecte. Vous pouvez désactiver cette fonction à tout moment dans les paramètres de votre appareil.',
            'Réseau : Pour récupérer les dernières informations municipales. Hors ligne, l\'application affiche les données en cache.'
          ]
        },
        {
          title: 'Stockage des données',
          content: `Toutes les données de préférences sont stockées localement sur votre appareil en utilisant des mécanismes de stockage sécurisés. Nous ne transmettons ni ne stockons aucune donnée personnelle sur nos serveurs. Les informations municipales (horaires, événements, annonces) sont récupérées depuis notre base de données sécurisée mais ne nécessitent aucune information personnelle pour y accéder.`
        },
        {
          title: 'Services tiers',
          content: `CivicKey utilise les services suivants :`,
          list: [
            'Firebase (Google) : Utilisé pour stocker et récupérer les données municipales publiques telles que les horaires de collecte, les événements et les annonces. Aucune donnée personnelle utilisateur n\'est stockée dans Firebase.',
            'Expo Notifications : Utilisé pour envoyer des rappels de notification locale. Les notifications sont programmées localement sur votre appareil.'
          ]
        },
        {
          title: 'Partage des données',
          content: `Nous ne vendons, n'échangeons ni ne transférons vos informations à des tiers. Puisque nous ne collectons pas d'informations personnelles, il n'y a pas de données personnelles à partager.`
        },
        {
          title: 'Vie privée des enfants',
          content: `CivicKey ne collecte aucune information personnelle de quiconque, y compris les enfants de moins de 13 ans. L'application est sûre pour les utilisateurs de tous âges.`
        },
        {
          title: 'Vos droits',
          content: `Vous pouvez effacer toutes les préférences stockées localement à tout moment en utilisant la fonction « Réinitialiser l'application » dans l'écran Paramètres. Cela supprimera toutes les préférences stockées de votre appareil.`
        },
        {
          title: 'Modifications de cette politique',
          content: `Nous pouvons mettre à jour cette politique de confidentialité de temps à autre. Tout changement sera reflété dans la date de « Dernière mise à jour » en haut de cette page. Nous vous encourageons à consulter cette politique périodiquement.`
        },
        {
          title: 'Nous contacter',
          content: `Si vous avez des questions concernant cette politique de confidentialité, veuillez nous contacter à :`,
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
