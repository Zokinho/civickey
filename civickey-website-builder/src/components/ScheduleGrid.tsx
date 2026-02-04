import type { Locale, ScheduleData, Zone } from '@/lib/types';
import { getLocalizedText, t } from '@/lib/i18n';

interface ScheduleGridProps {
  schedule: ScheduleData;
  selectedZoneId: string;
  locale: Locale;
}

const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

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
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 pr-4 font-medium text-gray-500">
              {t('events.date', locale)}
            </th>
            {schedule.collectionTypes.map((type) => (
              <th key={type.id} className="text-center py-3 px-2 font-medium text-gray-500">
                <div className="flex items-center justify-center gap-1.5">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: type.color }}
                  />
                  {getLocalizedText(type.name, locale)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DAY_KEYS.map((dayKey, index) => (
            <tr key={dayKey} className="border-b border-gray-100">
              <td className="py-3 pr-4 font-medium text-gray-900">
                {t(`days.${dayKey}`, locale)}
              </td>
              {schedule.collectionTypes.map((type) => {
                const days = zoneSchedule[type.id] || [];
                const isActive = days.includes(String(index + 1)) || days.includes(dayKey);
                return (
                  <td key={type.id} className="py-3 px-2 text-center">
                    {isActive && (
                      <span
                        className="inline-block w-6 h-6 rounded-full"
                        style={{ backgroundColor: type.color }}
                      />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
