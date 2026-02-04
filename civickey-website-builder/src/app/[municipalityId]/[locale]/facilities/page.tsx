import { getFacilities } from '@/lib/municipalities';
import { t } from '@/lib/i18n';
import type { Locale } from '@/lib/types';
import FacilityCard from '@/components/FacilityCard';

export const revalidate = 300;

interface PageProps {
  params: Promise<{ municipalityId: string; locale: string }>;
}

export default async function FacilitiesPage({ params }: PageProps) {
  const { municipalityId, locale: localeParam } = await params;
  const locale = localeParam as Locale;

  const facilities = await getFacilities(municipalityId);

  return (
    <div className="container-page py-12">
      <h1 className="section-title">{t('facilities.title', locale)}</h1>

      {facilities.length === 0 ? (
        <p className="text-gray-500 py-8 text-center">
          {t('facilities.no_facilities', locale)}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {facilities.map((facility) => (
            <FacilityCard
              key={facility.id}
              facility={facility}
              municipalityId={municipalityId}
              locale={locale}
            />
          ))}
        </div>
      )}
    </div>
  );
}
