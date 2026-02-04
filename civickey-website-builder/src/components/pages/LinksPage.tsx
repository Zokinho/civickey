import type { Locale, CustomPage } from '@/lib/types';
import { getLocalizedText } from '@/lib/i18n';
import { Card, CardBody } from '@/components/ui/Card';

interface LinksPageProps {
  page: CustomPage;
  locale: Locale;
}

export default function LinksPage({ page, locale }: LinksPageProps) {
  const categories = page.content?.categories || [];

  return (
    <div className="container-page py-12 max-w-3xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        {getLocalizedText(page.title, locale)}
      </h1>

      <div className="space-y-8">
        {categories.map((category, i) => (
          <section key={i}>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {getLocalizedText(category.title, locale)}
            </h2>
            <div className="space-y-2">
              {category.links.map((link, j) => (
                <Card key={j}>
                  <CardBody className="flex items-center gap-3">
                    {link.icon && <span className="text-xl">{link.icon}</span>}
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium hover:underline"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      {getLocalizedText(link.title, locale)}
                    </a>
                  </CardBody>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
