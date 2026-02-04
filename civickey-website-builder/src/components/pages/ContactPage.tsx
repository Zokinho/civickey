import type { Locale, CustomPage } from '@/lib/types';
import { getLocalizedText, t } from '@/lib/i18n';
import { Card, CardBody } from '@/components/ui/Card';

interface ContactPageProps {
  page: CustomPage;
  locale: Locale;
}

export default function ContactPage({ page, locale }: ContactPageProps) {
  const content = page.content;
  const departments = content?.departments || [];

  return (
    <div className="container-page py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        {getLocalizedText(page.title, locale)}
      </h1>

      <div className="grid gap-8 lg:grid-cols-2 mb-12">
        {/* Main contact info */}
        <Card>
          <CardBody className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {t('footer.contact', locale)}
            </h2>
            {content?.mainAddress && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  {t('facilities.address', locale)}
                </h3>
                <p className="text-gray-900">{content.mainAddress}</p>
              </div>
            )}
            {content?.mainPhone && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  {t('facilities.phone', locale)}
                </h3>
                <a href={`tel:${content.mainPhone}`} className="text-gray-900 hover:underline">
                  {content.mainPhone}
                </a>
              </div>
            )}
            {content?.mainEmail && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  {t('facilities.email', locale)}
                </h3>
                <a href={`mailto:${content.mainEmail}`} className="text-gray-900 hover:underline">
                  {content.mainEmail}
                </a>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Hours */}
        {content?.hours && (
          <Card>
            <CardBody>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                {t('facilities.hours', locale)}
              </h2>
              <p className="text-gray-700 whitespace-pre-wrap">
                {getLocalizedText(content.hours, locale)}
              </p>
            </CardBody>
          </Card>
        )}
      </div>

      {/* Departments */}
      {departments.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {locale === 'fr' ? 'D\u00e9partements' : 'Departments'}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {departments.map((dept, i) => (
              <Card key={i}>
                <CardBody>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {getLocalizedText(dept.name, locale)}
                  </h3>
                  {dept.phone && (
                    <p className="text-sm text-gray-600">
                      <a href={`tel:${dept.phone}`} className="hover:underline">
                        {dept.phone}
                      </a>
                    </p>
                  )}
                  {dept.email && (
                    <p className="text-sm text-gray-600">
                      <a href={`mailto:${dept.email}`} className="hover:underline">
                        {dept.email}
                      </a>
                    </p>
                  )}
                  {dept.hours && (
                    <p className="text-xs text-gray-400 mt-2">
                      {getLocalizedText(dept.hours, locale)}
                    </p>
                  )}
                </CardBody>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
