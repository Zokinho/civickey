import type { Locale, ScheduleData, Zone, CollectionScheduleEntry } from '@/lib/types';
import { getLocalizedText, t } from '@/lib/i18n';
import { Card, CardBody } from '@/components/ui/Card';

interface CollectionPreviewProps {
  schedule: ScheduleData | null;
  zones: Zone[];
  locale: Locale;
}

const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function getNextCollectionDate(entry: CollectionScheduleEntry): Date {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let daysUntil = entry.dayOfWeek - today.getDay();
  if (daysUntil < 0) daysUntil += 7;

  const candidate = new Date(today);
  candidate.setDate(today.getDate() + daysUntil);

  if (entry.frequency === 'biweekly' && entry.startDate) {
    const start = new Date(entry.startDate + 'T00:00:00');
    const diffMs = candidate.getTime() - start.getTime();
    const diffWeeks = Math.round(diffMs / (7 * 24 * 60 * 60 * 1000));
    if (diffWeeks % 2 !== 0) {
      candidate.setDate(candidate.getDate() + 7);
    }
  }

  if (entry.frequency === 'monthly' && entry.startDate) {
    const start = new Date(entry.startDate + 'T00:00:00');
    for (let monthOffset = 0; monthOffset <= 1; monthOffset++) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
      let firstOccurrence = new Date(monthStart);
      let diff = entry.dayOfWeek - monthStart.getDay();
      if (diff < 0) diff += 7;
      firstOccurrence.setDate(1 + diff);
      const diffMs = firstOccurrence.getTime() - start.getTime();
      const diffWeeks = Math.round(diffMs / (7 * 24 * 60 * 60 * 1000));
      if (diffWeeks % 2 !== 0) {
        firstOccurrence.setDate(firstOccurrence.getDate() + 7);
      }
      if (firstOccurrence >= today) {
        return firstOccurrence;
      }
    }
  }

  return candidate;
}

function formatNextDate(date: Date, locale: Locale): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (date.getTime() === today.getTime()) return t('collections.today', locale);
  if (date.getTime() === tomorrow.getTime()) return t('collections.tomorrow', locale);

  return date.toLocaleDateString(locale === 'fr' ? 'fr-CA' : 'en-CA', {
    month: 'short',
    day: 'numeric',
  });
}

export default function CollectionPreview({ schedule, zones, locale }: CollectionPreviewProps) {
  if (!schedule || !schedule.collectionTypes || zones.length === 0) return null;

  // Show schedule for the first zone as a preview
  const zone = zones[0];
  const zoneSchedule = schedule.schedules?.[zone.id];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {schedule.collectionTypes.map((type) => {
        const entry = zoneSchedule?.[type.id];
        if (!entry) return null;

        const dayKey = DAY_KEYS[entry.dayOfWeek];
        const dayLabel = t(`days.${dayKey}`, locale);
        const nextDate = getNextCollectionDate(entry);
        const nextDateLabel = formatNextDate(nextDate, locale);
        const frequencyLabel = entry.frequency === 'monthly'
          ? t('collections.monthly', locale)
          : entry.frequency === 'biweekly'
            ? t('collections.every_two_weeks', locale)
            : t('collections.every_week', locale);

        return (
          <Card key={type.id}>
            <CardBody>
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: type.color }}
                />
                <h3 className="font-semibold text-gray-900">
                  {getLocalizedText(type.name, locale)}
                </h3>
              </div>
              <div className="space-y-1.5 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>{dayLabel}</span>
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: type.color + '1A', color: type.color }}
                  >
                    {frequencyLabel}
                  </span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-gray-100">
                  <span>{t('collections.next', locale)}</span>
                  <span className="font-semibold text-gray-900">{nextDateLabel}</span>
                </div>
              </div>
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}
