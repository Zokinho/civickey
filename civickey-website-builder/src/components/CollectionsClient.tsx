'use client';

import { useState } from 'react';
import type { Locale, ScheduleData, Zone } from '@/lib/types';
import { t, getLocalizedText } from '@/lib/i18n';
import ZoneSelector from '@/components/ZoneSelector';
import ScheduleGrid from '@/components/ScheduleGrid';
import { Card, CardBody } from '@/components/ui/Card';

interface CollectionsClientProps {
  schedule: ScheduleData | null;
  zones: Zone[];
  locale: Locale;
}

export default function CollectionsClient({ schedule, zones, locale }: CollectionsClientProps) {
  const [selectedZone, setSelectedZone] = useState<string | null>(
    zones.length > 0 ? zones[0].id : null
  );

  return (
    <div className="space-y-8">
      {zones.length > 0 && (
        <ZoneSelector
          zones={zones}
          locale={locale}
          selectedZone={selectedZone}
          onSelect={setSelectedZone}
        />
      )}

      {schedule && selectedZone && (
        <Card>
          <CardBody>
            <ScheduleGrid
              schedule={schedule}
              selectedZoneId={selectedZone}
              locale={locale}
            />
          </CardBody>
        </Card>
      )}

      {schedule?.guidelines && (
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {t('collections.guidelines', locale)}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {Object.entries(schedule.guidelines).map(([key, text]) => (
              <Card key={key}>
                <CardBody>
                  <h3 className="font-semibold text-gray-900 mb-2 capitalize">{key}</h3>
                  <p className="text-sm text-gray-600">
                    {getLocalizedText(text, locale)}
                  </p>
                </CardBody>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
