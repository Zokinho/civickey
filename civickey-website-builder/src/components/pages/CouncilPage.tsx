import Image from 'next/image';
import type { Locale, CustomPage } from '@/lib/types';
import { getLocalizedText } from '@/lib/i18n';
import { Card, CardBody } from '@/components/ui/Card';

interface CouncilPageProps {
  page: CustomPage;
  locale: Locale;
}

export default function CouncilPage({ page, locale }: CouncilPageProps) {
  const members = page.content?.members || [];

  return (
    <div className="container-page py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        {getLocalizedText(page.title, locale)}
      </h1>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((member, i) => (
          <Card key={i} className="text-center h-full">
            <CardBody>
              {member.photo ? (
                <div className="relative w-24 h-24 rounded-full overflow-hidden mx-auto mb-4">
                  <Image
                    src={member.photo}
                    alt={member.name}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-200 mx-auto mb-4 flex items-center justify-center text-2xl text-gray-400">
                  {member.name?.charAt(0) || '?'}
                </div>
              )}
              <h3 className="font-semibold text-gray-900">{member.name}</h3>
              <p className="text-sm text-gray-500 mb-3">
                {getLocalizedText(member.role, locale)}
              </p>
              <div className="text-xs text-gray-400 space-y-1">
                {member.email && (
                  <a href={`mailto:${member.email}`} className="block hover:text-gray-600">
                    {member.email}
                  </a>
                )}
                {member.phone && (
                  <a href={`tel:${member.phone}`} className="block hover:text-gray-600">
                    {member.phone}
                  </a>
                )}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
