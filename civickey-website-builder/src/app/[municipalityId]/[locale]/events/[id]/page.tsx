import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getEvent } from '@/lib/municipalities';
import { getLocalizedText, t } from '@/lib/i18n';
import type { Locale } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody } from '@/components/ui/Card';

export const revalidate = 300;

interface PageProps {
  params: Promise<{ municipalityId: string; locale: string; id: string }>;
}

export default async function EventDetailPage({ params }: PageProps) {
  const { municipalityId, locale: localeParam, id } = await params;
  const locale = localeParam as Locale;

  const event = await getEvent(municipalityId, id);
  if (!event) notFound();

  const dateObj = new Date(event.date + 'T00:00:00');
  const formattedDate = dateObj.toLocaleDateString(
    locale === 'fr' ? 'fr-CA' : 'en-CA',
    { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  );

  return (
    <div className="container-page py-12 max-w-3xl">
      <Link
        href={`/${municipalityId}/${locale}/events`}
        className="text-sm text-gray-500 hover:text-gray-700 mb-6 inline-block"
      >
        &larr; {t('common.back', locale)}
      </Link>

      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        {getLocalizedText(event.title, locale)}
      </h1>

      <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-6">
        <span>{formattedDate}</span>
        <span>
          {event.time}
          {event.endTime && ` - ${event.endTime}`}
        </span>
        {event.category && <Badge>{event.category}</Badge>}
      </div>

      {event.multiDay && event.endDate && (
        <p className="text-sm text-gray-600 mb-4">
          {locale === 'fr' ? 'Jusqu\'au' : 'Until'}{' '}
          {new Date(event.endDate + 'T00:00:00').toLocaleDateString(
            locale === 'fr' ? 'fr-CA' : 'en-CA',
            { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
          )}
        </p>
      )}

      <Card className="mb-8">
        <CardBody>
          <div className="prose max-w-none">
            <p className="whitespace-pre-wrap text-gray-700">
              {getLocalizedText(event.description, locale)}
            </p>
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {event.location && (
          <Card>
            <CardBody>
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                {t('events.location', locale)}
              </h3>
              <p className="font-medium text-gray-900">{event.location}</p>
              {event.address && <p className="text-sm text-gray-600">{event.address}</p>}
            </CardBody>
          </Card>
        )}

        <Card>
          <CardBody>
            <h3 className="text-sm font-medium text-gray-500 mb-1">
              {t('events.details', locale)}
            </h3>
            {event.ageGroup && <p className="text-sm text-gray-700">{event.ageGroup}</p>}
            {event.residents && (
              <p className="text-sm text-gray-700">{t('events.residents_only', locale)}</p>
            )}
            {event.maxParticipants && (
              <p className="text-sm text-gray-700">
                {t('events.max_participants', locale, { count: String(event.maxParticipants) })}
              </p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
