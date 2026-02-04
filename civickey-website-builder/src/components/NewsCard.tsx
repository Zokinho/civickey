import type { Locale, Alert } from '@/lib/types';
import { getLocalizedText, t } from '@/lib/i18n';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface NewsCardProps {
  alert: Alert;
  locale: Locale;
}

const TYPE_COLORS: Record<string, string> = {
  info: '#3b82f6',
  warning: '#f59e0b',
  urgent: '#f97316',
  emergency: '#ef4444',
};

export default function NewsCard({ alert, locale }: NewsCardProps) {
  const dateStr = alert.startDate || alert.createdAt;
  let formattedDate = '';
  if (dateStr) {
    const d = new Date(dateStr);
    formattedDate = d.toLocaleDateString(
      locale === 'fr' ? 'fr-CA' : 'en-CA',
      { year: 'numeric', month: 'long', day: 'numeric' }
    );
  }

  return (
    <Card>
      <CardBody>
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-semibold text-gray-900">
            {getLocalizedText(alert.title, locale)}
          </h3>
          <Badge color={TYPE_COLORS[alert.type]}>
            {t(`alert.${alert.type}`, locale)}
          </Badge>
        </div>
        <p className="text-sm text-gray-600 mb-3">
          {getLocalizedText(alert.message, locale)}
        </p>
        {formattedDate && (
          <p className="text-xs text-gray-400">{formattedDate}</p>
        )}
      </CardBody>
    </Card>
  );
}
