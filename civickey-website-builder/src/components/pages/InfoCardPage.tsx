import type { Locale, CustomPage } from '@/lib/types';
import { getLocalizedText } from '@/lib/i18n';
import { Card, CardBody } from '@/components/ui/Card';

interface InfoCardPageProps {
  page: CustomPage;
  locale: Locale;
}

export default function InfoCardPage({ page, locale }: InfoCardPageProps) {
  const content = page.content;
  const intro = getLocalizedText(content?.intro, locale);
  const cards = content?.cards || [];

  return (
    <div className="container-page py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        {getLocalizedText(page.title, locale)}
      </h1>

      {intro && <p className="text-lg text-gray-600 mb-8 max-w-2xl">{intro}</p>}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, i) => (
          <Card key={i} className="h-full">
            <CardBody>
              {card.icon && (
                <span className="text-3xl mb-3 block">{card.icon}</span>
              )}
              <h3 className="font-semibold text-gray-900 mb-2">
                {getLocalizedText(card.title, locale)}
              </h3>
              <p className="text-sm text-gray-600">
                {getLocalizedText(card.description, locale)}
              </p>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
