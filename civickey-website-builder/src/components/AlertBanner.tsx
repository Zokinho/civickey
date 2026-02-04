import type { Locale, Alert } from '@/lib/types';
import { getLocalizedText, t } from '@/lib/i18n';

interface AlertBannerProps {
  alerts: Alert[];
  locale: Locale;
}

const ALERT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800' },
  warning: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800' },
  urgent: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800' },
  emergency: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800' },
};

export default function AlertBanner({ alerts, locale }: AlertBannerProps) {
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-3">
      {alerts.map((alert) => {
        const colors = ALERT_COLORS[alert.type] || ALERT_COLORS.info;
        return (
          <div
            key={alert.id}
            className={`${colors.bg} ${colors.border} border rounded-lg p-4`}
          >
            <div className="flex items-start gap-3">
              <span className={`text-xs font-bold uppercase ${colors.text}`}>
                {t(`alert.${alert.type}`, locale)}
              </span>
              <div className="flex-1">
                <h3 className={`font-semibold ${colors.text}`}>
                  {getLocalizedText(alert.title, locale)}
                </h3>
                <p className="text-sm mt-1 text-gray-700">
                  {getLocalizedText(alert.message, locale)}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
