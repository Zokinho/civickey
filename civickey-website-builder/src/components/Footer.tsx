import Link from 'next/link';
import type { Locale, MunicipalityConfig } from '@/lib/types';
import { t } from '@/lib/i18n';

interface FooterProps {
  config: MunicipalityConfig;
  locale: Locale;
}

export default function Footer({ config, locale }: FooterProps) {
  const footer = config.website?.footer;
  const base = `/${config.id}/${locale}`;

  const socialLinks = [
    { key: 'facebook', url: footer?.facebook, label: 'Facebook' },
    { key: 'twitter', url: footer?.twitter, label: 'Twitter' },
    { key: 'instagram', url: footer?.instagram, label: 'Instagram' },
    { key: 'youtube', url: footer?.youtube, label: 'YouTube' },
  ].filter((s) => s.url);

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container-page py-12">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Municipality info */}
          <div>
            <h3 className="text-white font-bold text-lg mb-3">{config.name}</h3>
            {footer?.address && <p className="text-sm mb-1">{footer.address}</p>}
            {footer?.phone && (
              <p className="text-sm mb-1">
                <a href={`tel:${footer.phone}`} className="hover:text-white">
                  {footer.phone}
                </a>
              </p>
            )}
            {footer?.email && (
              <p className="text-sm">
                <a href={`mailto:${footer.email}`} className="hover:text-white">
                  {footer.email}
                </a>
              </p>
            )}
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-white font-bold text-lg mb-3">
              {locale === 'fr' ? 'Liens rapides' : 'Quick Links'}
            </h3>
            <nav className="flex flex-col gap-2 text-sm">
              <Link href={base} className="hover:text-white">{t('nav.home', locale)}</Link>
              <Link href={`${base}/collections`} className="hover:text-white">{t('nav.collections', locale)}</Link>
              <Link href={`${base}/events`} className="hover:text-white">{t('nav.events', locale)}</Link>
              <Link href={`${base}/facilities`} className="hover:text-white">{t('nav.facilities', locale)}</Link>
            </nav>
          </div>

          {/* Social links */}
          {socialLinks.length > 0 && (
            <div>
              <h3 className="text-white font-bold text-lg mb-3">{t('footer.follow', locale)}</h3>
              <div className="flex gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.key}
                    href={social.url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm hover:text-white"
                  >
                    {social.label}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-800 mt-8 pt-6 text-center text-sm text-gray-500">
          {t('footer.powered_by', locale)}
        </div>
      </div>
    </footer>
  );
}
