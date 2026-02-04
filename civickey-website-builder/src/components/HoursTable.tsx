import type { Locale, FacilityHours } from '@/lib/types';
import { t } from '@/lib/i18n';

interface HoursTableProps {
  hours: FacilityHours;
  locale: Locale;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

export default function HoursTable({ hours, locale }: HoursTableProps) {
  const now = new Date();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = dayNames[now.getDay()];

  return (
    <table className="w-full text-sm">
      <tbody>
        {DAYS.map((day) => {
          const dayHours = hours[day];
          const isToday = day === today;
          return (
            <tr
              key={day}
              className={`border-b border-gray-100 ${isToday ? 'bg-primary-light/30' : ''}`}
            >
              <td className={`py-2 pr-4 ${isToday ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                {t(`days.${day}`, locale)}
              </td>
              <td className={`py-2 text-right ${isToday ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                {dayHours
                  ? `${dayHours.open} - ${dayHours.close}`
                  : t('facilities.closed', locale)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
