import Image from 'next/image';
import type { Locale, CustomPage } from '@/lib/types';
import { getLocalizedText } from '@/lib/i18n';
import { Card, CardBody } from '@/components/ui/Card';

interface TextPageProps {
  page: CustomPage;
  locale: Locale;
}

export default function TextPage({ page, locale }: TextPageProps) {
  const content = page.content;
  const body = getLocalizedText(content?.body, locale);

  return (
    <div className="container-page py-12 max-w-3xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        {getLocalizedText(page.title, locale)}
      </h1>

      {content?.featuredImage && (
        <div className="relative w-full h-64 sm:h-80 rounded-xl overflow-hidden mb-8">
          <Image
            src={content.featuredImage}
            alt={getLocalizedText(page.title, locale)}
            fill
            className="object-cover"
          />
        </div>
      )}

      {body && (
        <div className="prose max-w-none text-gray-700 whitespace-pre-wrap mb-8">
          {body}
        </div>
      )}

      {(content?.contactInfo?.phone || content?.contactInfo?.email) && (
        <Card>
          <CardBody className="flex flex-wrap gap-6">
            {content.contactInfo.phone && (
              <a href={`tel:${content.contactInfo.phone}`} className="text-gray-900 hover:underline">
                {content.contactInfo.phone}
              </a>
            )}
            {content.contactInfo.email && (
              <a href={`mailto:${content.contactInfo.email}`} className="text-gray-900 hover:underline">
                {content.contactInfo.email}
              </a>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
