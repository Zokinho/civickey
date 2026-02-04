import { getUpcomingEvents } from '@/lib/municipalities';
import { t } from '@/lib/i18n';
import type { Locale } from '@/lib/types';
import EventList from '@/components/EventList';

export const revalidate = 300;

interface PageProps {
  params: Promise<{ municipalityId: string; locale: string }>;
}

export default async function EventsPage({ params }: PageProps) {
  const { municipalityId, locale: localeParam } = await params;
  const locale = localeParam as Locale;

  const events = await getUpcomingEvents(municipalityId);

  return (
    <div className="container-page py-12">
      <h1 className="section-title">{t('events.title', locale)}</h1>
      <EventList events={events} municipalityId={municipalityId} locale={locale} />
    </div>
  );
}
