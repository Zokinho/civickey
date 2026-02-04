import type { Locale, CustomPage } from '@/lib/types';
import { getLocalizedText, t } from '@/lib/i18n';
import { Card, CardBody } from '@/components/ui/Card';

interface PdfPageProps {
  page: CustomPage;
  locale: Locale;
}

export default function PdfPage({ page, locale }: PdfPageProps) {
  const content = page.content;
  const description = getLocalizedText(content?.description, locale);
  const documents = content?.documents || [];

  return (
    <div className="container-page py-12 max-w-3xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        {getLocalizedText(page.title, locale)}
      </h1>

      {description && <p className="text-gray-600 mb-8">{description}</p>}

      <div className="space-y-3">
        {documents.map((doc, i) => (
          <Card key={i}>
            <CardBody className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-medium text-gray-900">
                  {getLocalizedText(doc.title, locale)}
                </h3>
                {doc.description && (
                  <p className="text-sm text-gray-500 mt-1">
                    {getLocalizedText(doc.description, locale)}
                  </p>
                )}
              </div>
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary shrink-0 text-sm"
              >
                {t('common.download', locale)}
              </a>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
