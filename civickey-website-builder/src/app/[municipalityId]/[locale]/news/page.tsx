import { getAlerts } from '@/lib/municipalities';
import { t } from '@/lib/i18n';
import type { Locale } from '@/lib/types';
import NewsCard from '@/components/NewsCard';

export const revalidate = 300;

interface PageProps {
  params: Promise<{ municipalityId: string; locale: string }>;
}

export default async function NewsPage({ params }: PageProps) {
  const { municipalityId, locale: localeParam } = await params;
  const locale = localeParam as Locale;

  const alerts = await getAlerts(municipalityId);

  return (
    <div className="container-page py-12">
      <h1 className="section-title">{t('news.title', locale)}</h1>

      {alerts.length === 0 ? (
        <p className="text-gray-500 py-8 text-center">{t('news.no_news', locale)}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {alerts.map((alert) => (
            <NewsCard key={alert.id} alert={alert} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
