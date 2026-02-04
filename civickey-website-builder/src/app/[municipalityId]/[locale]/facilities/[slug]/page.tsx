import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getFacility } from '@/lib/municipalities';
import { getLocalizedText, t } from '@/lib/i18n';
import type { Locale } from '@/lib/types';
import { Card, CardBody } from '@/components/ui/Card';
import HoursTable from '@/components/HoursTable';

export const revalidate = 300;

interface PageProps {
  params: Promise<{ municipalityId: string; locale: string; slug: string }>;
}

export default async function FacilityDetailPage({ params }: PageProps) {
  const { municipalityId, locale: localeParam, slug } = await params;
  const locale = localeParam as Locale;

  const facility = await getFacility(municipalityId, slug);
  if (!facility) notFound();

  return (
    <div className="container-page py-12 max-w-3xl">
      <Link
        href={`/${municipalityId}/${locale}/facilities`}
        className="text-sm text-gray-500 hover:text-gray-700 mb-6 inline-block"
      >
        &larr; {t('common.back', locale)}
      </Link>

      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        {getLocalizedText(facility.name, locale)}
      </h1>

      <p className="text-gray-600 mb-8 whitespace-pre-wrap">
        {getLocalizedText(facility.description, locale)}
      </p>

      <div className="grid gap-6 sm:grid-cols-2">
        {facility.hours && (
          <Card>
            <CardBody>
              <h2 className="font-semibold text-gray-900 mb-3">
                {t('facilities.hours', locale)}
              </h2>
              <HoursTable hours={facility.hours} locale={locale} />
            </CardBody>
          </Card>
        )}

        <Card>
          <CardBody className="space-y-3">
            {facility.address && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  {t('facilities.address', locale)}
                </h3>
                <p className="text-gray-900">{facility.address}</p>
              </div>
            )}
            {facility.phone && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  {t('facilities.phone', locale)}
                </h3>
                <a href={`tel:${facility.phone}`} className="text-gray-900 hover:underline">
                  {facility.phone}
                </a>
              </div>
            )}
            {facility.email && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  {t('facilities.email', locale)}
                </h3>
                <a href={`mailto:${facility.email}`} className="text-gray-900 hover:underline">
                  {facility.email}
                </a>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
