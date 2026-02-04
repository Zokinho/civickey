import Link from 'next/link';
import { getMunicipalityConfig, getActiveAlerts, getUpcomingEvents, getScheduleData, getZones } from '@/lib/municipalities';
import { t } from '@/lib/i18n';
import type { Locale } from '@/lib/types';
import HeroSection from '@/components/HeroSection';
import AlertBanner from '@/components/AlertBanner';
import EventCard from '@/components/EventCard';
import CollectionPreview from '@/components/CollectionPreview';

export const revalidate = 300; // ISR: 5 minutes

interface PageProps {
  params: Promise<{ municipalityId: string; locale: string }>;
}

export default async function HomePage({ params }: PageProps) {
  const { municipalityId, locale: localeParam } = await params;
  const locale = localeParam as Locale;

  const [config, alerts, events, schedule, zones] = await Promise.all([
    getMunicipalityConfig(municipalityId),
    getActiveAlerts(municipalityId),
    getUpcomingEvents(municipalityId),
    getScheduleData(municipalityId),
    getZones(municipalityId),
  ]);

  if (!config) return null;

  const upcomingEvents = events.slice(0, 4);

  return (
    <div>
      <HeroSection config={config} locale={locale} />

      <div className="container-page py-12 space-y-12">
        {/* Active alerts */}
        {alerts.length > 0 && (
          <section>
            <h2 className="section-title">{t('home.active_alerts', locale)}</h2>
            <AlertBanner alerts={alerts} locale={locale} />
          </section>
        )}

        {/* Upcoming events */}
        {upcomingEvents.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {t('home.upcoming_events', locale)}
              </h2>
              <Link
                href={`/${municipalityId}/${locale}/events`}
                className="text-sm font-medium hover:underline"
                style={{ color: 'var(--color-primary)' }}
              >
                {t('home.view_all', locale)} &rarr;
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {upcomingEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  municipalityId={municipalityId}
                  locale={locale}
                />
              ))}
            </div>
          </section>
        )}

        {/* Collection preview */}
        {schedule && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {t('home.next_collections', locale)}
              </h2>
              <Link
                href={`/${municipalityId}/${locale}/collections`}
                className="text-sm font-medium hover:underline"
                style={{ color: 'var(--color-primary)' }}
              >
                {t('home.view_all', locale)} &rarr;
              </Link>
            </div>
            <CollectionPreview schedule={schedule} zones={zones} locale={locale} />
          </section>
        )}
      </div>
    </div>
  );
}
