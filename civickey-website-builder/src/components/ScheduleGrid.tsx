import type { Locale, ScheduleData, CollectionScheduleEntry } from '@/lib/types';
import { getLocalizedText, t } from '@/lib/i18n';

interface ScheduleGridProps {
  schedule: ScheduleData;
  selectedZoneId: string;
  locale: Locale;
}

const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function getNextCollectionDate(entry: CollectionScheduleEntry): Date {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayDow = today.getDay();

  // Find next occurrence of the target day of week
  let daysUntil = entry.dayOfWeek - todayDow;
  if (daysUntil < 0) daysUntil += 7;
  if (daysUntil === 0) {
    // Today is collection day — return today
  }

  let candidate = new Date(today);
  candidate.setDate(today.getDate() + daysUntil);

  if (entry.frequency === 'biweekly' && entry.startDate) {
    const start = new Date(entry.startDate + 'T00:00:00');
    // Calculate weeks difference from start date
    const diffMs = candidate.getTime() - start.getTime();
    const diffWeeks = Math.round(diffMs / (7 * 24 * 60 * 60 * 1000));
    // If odd number of weeks from start, push to next week
    if (diffWeeks % 2 !== 0) {
      candidate.setDate(candidate.getDate() + 7);
    }
  }

  if (entry.frequency === 'monthly' && entry.startDate) {
    const start = new Date(entry.startDate + 'T00:00:00');
    // Find first biweekly-aligned occurrence of dayOfWeek in current or next month
    for (let monthOffset = 0; monthOffset <= 1; monthOffset++) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
      // Find first occurrence of target dayOfWeek in this month
      let firstOccurrence = new Date(monthStart);
      let diff = entry.dayOfWeek - monthStart.getDay();
      if (diff < 0) diff += 7;
      firstOccurrence.setDate(1 + diff);
      // Check biweekly alignment with startDate
      const diffMs = firstOccurrence.getTime() - start.getTime();
      const diffWeeks = Math.round(diffMs / (7 * 24 * 60 * 60 * 1000));
      if (diffWeeks % 2 !== 0) {
        // Off-week — use second occurrence
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

  if (date.getTime() === today.getTime()) {
    return t('collections.today', locale);
  }
  if (date.getTime() === tomorrow.getTime()) {
    return t('collections.tomorrow', locale);
  }

  return date.toLocaleDateString(locale === 'fr' ? 'fr-CA' : 'en-CA', {
    month: 'short',
    day: 'numeric',
  });
}

export default function ScheduleGrid({ schedule, selectedZoneId, locale }: ScheduleGridProps) {
  const zoneSchedule = schedule.schedules?.[selectedZoneId];

  if (!zoneSchedule) {
    return (
      <p className="text-gray-500 py-8 text-center">
        {t('collections.no_schedule', locale)}
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {schedule.collectionTypes.map((type) => {
        const entry = zoneSchedule[type.id];
        if (!entry) return null;

        let effectiveEntry = entry;
        if (entry.frequency === 'monthly' && entry.piggybackOn) {
          const ref = zoneSchedule[entry.piggybackOn];
          if (ref) {
            effectiveEntry = { ...entry, dayOfWeek: ref.dayOfWeek, startDate: ref.startDate };
          }
        }

        const nextDate = getNextCollectionDate(effectiveEntry);
        const dayKey = DAY_KEYS[effectiveEntry.dayOfWeek];
        const dayLabel = t(`days.${dayKey}`, locale);
        const frequencyLabel = entry.frequency === 'monthly'
          ? t('collections.monthly', locale)
          : entry.frequency === 'biweekly'
            ? t('collections.every_two_weeks', locale)
            : t('collections.every_week', locale);
        const nextDateLabel = formatNextDate(nextDate, locale);

        return (
          <div
            key={type.id}
            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
          >
            <div
              className="h-1.5"
              style={{ backgroundColor: type.color }}
            />
            <div className="px-5 py-4">
              <div className="flex items-center gap-2.5 mb-3">
                <div
                  className="w-4 h-4 rounded-full shrink-0"
                  style={{ backgroundColor: type.color }}
                />
                <h3 className="font-semibold text-gray-900 text-lg">
                  {getLocalizedText(type.name, locale)}
                </h3>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">{dayLabel}</span>
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: type.color + '1A', color: type.color }}
                  >
                    {frequencyLabel}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="text-gray-500">{t('collections.next', locale)}</span>
                  <span className="font-semibold text-gray-900">{nextDateLabel}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
