import { getScheduleData, getZones } from '@/lib/municipalities';
import { t } from '@/lib/i18n';
import type { Locale } from '@/lib/types';
import CollectionsClient from '@/components/CollectionsClient';

export const revalidate = 300; // ISR: 5 minutes

interface Props {
  params: Promise<{ municipalityId: string; locale: string }>;
}

export default async function CollectionsPage({ params }: Props) {
  const { municipalityId, locale: localeParam } = await params;
  const locale = localeParam as Locale;

  const [schedule, zones] = await Promise.all([
    getScheduleData(municipalityId),
    getZones(municipalityId),
  ]);

  return (
    <div className="container-page py-12 space-y-8">
      <h1 className="section-title">{t('collections.title', locale)}</h1>
      <CollectionsClient schedule={schedule} zones={zones} locale={locale} />
    </div>
  );
}
