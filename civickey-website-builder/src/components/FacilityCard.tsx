import Link from 'next/link';
import type { Locale, Facility } from '@/lib/types';
import { getLocalizedText, t } from '@/lib/i18n';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface FacilityCardProps {
  facility: Facility;
  municipalityId: string;
  locale: Locale;
}

export default function FacilityCard({ facility, municipalityId, locale }: FacilityCardProps) {
  const isOpen = checkIfOpen(facility.hours);

  return (
    <Link href={`/${municipalityId}/${locale}/facilities/${facility.id}`}>
      <Card className="hover:shadow-md transition-shadow h-full">
        <CardBody>
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="font-semibold text-gray-900">
              {getLocalizedText(facility.name, locale)}
            </h3>
            <Badge color={isOpen ? '#22c55e' : '#94a3b8'}>
              {isOpen ? t('facilities.open', locale) : t('facilities.closed', locale)}
            </Badge>
          </div>
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {getLocalizedText(facility.description, locale)}
          </p>
          {facility.address && (
            <p className="text-xs text-gray-400">{facility.address}</p>
          )}
        </CardBody>
      </Card>
    </Link>
  );
}

function checkIfOpen(hours: Facility['hours']): boolean {
  if (!hours) return false;

  const now = new Date();
  const todayIndex = now.getDay(); // 0=Sunday
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  // Firestore stores hours with numeric keys ("0"=Sunday, "1"=Monday, etc.)
  const todayHours = hours[todayIndex] ?? hours[dayNames[todayIndex]];

  if (!todayHours || todayHours.closed) return false;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [openH, openM] = todayHours.open.split(':').map(Number);
  const [closeH, closeM] = todayHours.close.split(':').map(Number);

  return currentMinutes >= openH * 60 + openM && currentMinutes < closeH * 60 + closeM;
}
