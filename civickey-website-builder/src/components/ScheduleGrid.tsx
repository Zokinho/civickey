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

  const getItemList = (items: unknown): string[] => {
    if (!items) return [];
    if (Array.isArray(items)) return items;
    const obj = items as Record<string, unknown>;
    const val = obj[locale] ?? obj['en'] ?? obj['fr'];
    if (Array.isArray(val)) return val;
    if (typeof val === 'string' && val) return [val];
    return [];
  };

  return (
    <div className="grid gap-5 grid-cols-1">
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

        const binName = type.binName ? getLocalizedText(type.binName, locale) : '';
        const tip = type.tip ? getLocalizedText(type.tip, locale) : '';
        const accepted = getItemList(type.accepted);
        const notAccepted = getItemList(type.notAccepted);

        return (
          <div
            key={type.id}
            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
          >
            <div
              className="h-2"
              style={{ backgroundColor: type.color }}
            />
            <div className="px-6 py-5">
              {/* Header row */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-5 h-5 rounded-full shrink-0"
                    style={{ backgroundColor: type.color }}
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {getLocalizedText(type.name, locale)}
                    </h3>
                    {binName && (
                      <p className="text-sm text-gray-500">
                        {binName}{type.binSize ? ` — ${type.binSize}` : ''}
                      </p>
                    )}
                  </div>
                </div>
                <span
                  className="text-xs font-medium px-2.5 py-1 rounded-full shrink-0"
                  style={{ backgroundColor: type.color + '1A', color: type.color }}
                >
                  {frequencyLabel}
                </span>
              </div>

              {/* Schedule info */}
              <div className="flex items-center justify-between text-sm py-3 border-y border-gray-100">
                <span className="text-gray-500">{dayLabel}</span>
                <div className="text-right">
                  <span className="text-gray-500">{t('collections.next', locale)} </span>
                  <span className="font-semibold text-gray-900">{nextDateLabel}</span>
                </div>
              </div>

              {/* Tip */}
              {tip && (
                <div
                  className="mt-4 text-sm rounded-lg px-4 py-3"
                  style={{ backgroundColor: type.color + '0D' }}
                >
                  <span style={{ color: type.color }} className="font-medium">
                    {locale === 'fr' ? 'Conseil' : 'Tip'}:
                  </span>{' '}
                  <span className="text-gray-700">{tip}</span>
                </div>
              )}

              {/* Accepted / Not Accepted — collapsible */}
              {(accepted.length > 0 || notAccepted.length > 0) && (
                <details className="mt-4 group">
                  <summary className="cursor-pointer select-none text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors list-none flex items-center gap-1.5">
                    <svg
                      className="w-4 h-4 transition-transform group-open:rotate-90"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    {locale === 'fr' ? 'Voir les matières acceptées et refusées' : 'View accepted & not accepted items'}
                  </summary>
                  <div className="mt-3 space-y-4">
                    {accepted.length > 0 && (
                      <div className="rounded-lg bg-green-50 border border-green-100 px-4 py-3">
                        <h4 className="text-sm font-semibold text-green-800 mb-2">
                          {locale === 'fr' ? 'Accepté' : 'Accepted'}
                        </h4>
                        <div className="text-sm text-green-900/80 space-y-1.5 leading-relaxed">
                          {accepted.map((line, i) => {
                            const isBullet = line.startsWith('- ');
                            return isBullet ? (
                              <p key={i} className="flex items-start gap-2">
                                <span className="text-green-500 mt-0.5 shrink-0">&#10003;</span>
                                <span>{line.slice(2)}</span>
                              </p>
                            ) : (
                              <p key={i}>{line}</p>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {notAccepted.length > 0 && (
                      <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3">
                        <h4 className="text-sm font-semibold text-red-800 mb-2">
                          {locale === 'fr' ? 'Refusé' : 'Not accepted'}
                        </h4>
                        <div className="text-sm text-red-900/80 space-y-1.5 leading-relaxed">
                          {notAccepted.map((line, i) => {
                            const isBullet = line.startsWith('- ');
                            return isBullet ? (
                              <p key={i} className="flex items-start gap-2">
                                <span className="text-red-400 mt-0.5 shrink-0">&#10007;</span>
                                <span>{line.slice(2)}</span>
                              </p>
                            ) : (
                              <p key={i}>{line}</p>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
