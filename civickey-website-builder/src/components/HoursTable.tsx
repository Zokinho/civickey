import type { Locale, FacilityHours } from '@/lib/types';
import { t } from '@/lib/i18n';

interface HoursTableProps {
  hours: FacilityHours;
  locale: Locale;
}

// Display order: Monday(1) through Sunday(0)
const DAYS_DISPLAY = [
  { key: 'monday', index: 1 },
  { key: 'tuesday', index: 2 },
  { key: 'wednesday', index: 3 },
  { key: 'thursday', index: 4 },
  { key: 'friday', index: 5 },
  { key: 'saturday', index: 6 },
  { key: 'sunday', index: 0 },
] as const;

export default function HoursTable({ hours, locale }: HoursTableProps) {
  const now = new Date();
  const todayIndex = now.getDay(); // 0=Sunday

  return (
    <table className="w-full text-sm">
      <tbody>
        {DAYS_DISPLAY.map(({ key, index }) => {
          // Firestore stores hours with numeric keys ("0"=Sunday, "1"=Monday, etc.)
          const dayHours = hours[index] ?? hours[key];
          const isToday = index === todayIndex;
          return (
            <tr
              key={key}
              className={`border-b border-gray-100 ${isToday ? 'bg-primary-light/30' : ''}`}
            >
              <td className={`py-2 pr-4 ${isToday ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                {t(`days.${key}`, locale)}
              </td>
              <td className={`py-2 text-right ${isToday ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                {dayHours && !dayHours.closed
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
