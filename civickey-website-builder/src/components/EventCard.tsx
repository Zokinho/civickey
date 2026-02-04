import Link from 'next/link';
import type { Locale, Event } from '@/lib/types';
import { getLocalizedText, t } from '@/lib/i18n';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody } from '@/components/ui/Card';

interface EventCardProps {
  event: Event;
  municipalityId: string;
  locale: Locale;
}

export default function EventCard({ event, municipalityId, locale }: EventCardProps) {
  const dateObj = new Date(event.date + 'T00:00:00');
  const month = dateObj.toLocaleDateString(locale === 'fr' ? 'fr-CA' : 'en-CA', { month: 'short' });
  const day = dateObj.getDate();

  return (
    <Link href={`/${municipalityId}/${locale}/events/${event.id}`}>
      <Card className="hover:shadow-md transition-shadow h-full">
        <CardBody className="flex gap-4">
          <div
            className="flex-shrink-0 w-14 h-14 rounded-lg flex flex-col items-center justify-center text-white"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <span className="text-xs uppercase font-medium leading-none">{month}</span>
            <span className="text-xl font-bold leading-none mt-0.5">{day}</span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 truncate">
              {getLocalizedText(event.title, locale)}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {event.time}{event.endTime && ` - ${event.endTime}`}
              {event.location && ` \u2022 ${event.location}`}
            </p>
            {event.category && (
              <Badge className="mt-2">{event.category}</Badge>
            )}
          </div>
        </CardBody>
      </Card>
    </Link>
  );
}
