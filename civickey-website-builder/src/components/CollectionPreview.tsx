import type { Locale, ScheduleData, Zone } from '@/lib/types';
import { getLocalizedText, t } from '@/lib/i18n';
import { Card, CardBody } from '@/components/ui/Card';

interface CollectionPreviewProps {
  schedule: ScheduleData | null;
  zones: Zone[];
  locale: Locale;
}

const DAY_NAMES_FR = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const DAY_NAMES_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function CollectionPreview({ schedule, zones, locale }: CollectionPreviewProps) {
  if (!schedule || !schedule.collectionTypes || zones.length === 0) return null;

  const dayNames = locale === 'fr' ? DAY_NAMES_FR : DAY_NAMES_EN;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {schedule.collectionTypes.map((type) => (
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
              {zones.slice(0, 3).map((zone) => {
                const days = schedule.schedules?.[zone.id]?.[type.id] || [];
                return (
                  <div key={zone.id} className="flex justify-between">
                    <span>{zone.name}</span>
                    <span className="text-gray-900">
                      {days.map((d: string) => {
                        const dayIndex = parseInt(d);
                        return isNaN(dayIndex) ? d : dayNames[dayIndex];
                      }).join(', ') || '\u2014'}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
