'use client';

import { useState } from 'react';
import type { Locale, ScheduleData, Zone } from '@/lib/types';
import { t, getLocalizedText } from '@/lib/i18n';
import ZoneSelector from '@/components/ZoneSelector';
import ScheduleGrid from '@/components/ScheduleGrid';

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
      <div className="flex flex-wrap items-center justify-between gap-4">
        {zones.length > 0 && (
          <ZoneSelector
            zones={zones}
            locale={locale}
            selectedZone={selectedZone}
            onSelect={setSelectedZone}
          />
        )}
        <a
          href="https://contenu.maruche.ca/Fichiers/228290ed-49b5-4dff-af87-e59de42eefd0/Sites/22d38d6f-ef7d-ec11-81d5-00155d000708/Images/Cartes/CarteCollecteParSecteur.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          {locale === 'fr' ? 'Carte des secteurs' : 'Zone Map'}
        </a>
      </div>

      {schedule && selectedZone && (
        <ScheduleGrid
          schedule={schedule}
          selectedZoneId={selectedZone}
          locale={locale}
        />
      )}

      {schedule?.guidelines && (
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-5">
          <h2 className="text-lg font-bold text-gray-900 mb-3">
            {t('collections.guidelines', locale)}
          </h2>
          <div className="space-y-3 text-sm text-gray-600">
            {schedule.guidelines.timing && (
              <p>{getLocalizedText(schedule.guidelines.timing, locale)}</p>
            )}
            {schedule.guidelines.position && (() => {
              const val = (schedule.guidelines.position as unknown as Record<string, unknown>)[locale]
                ?? (schedule.guidelines.position as unknown as Record<string, unknown>)['en'];
              const items = Array.isArray(val) ? val : [];
              return items.length > 0 ? (
                <ul className="space-y-1">
                  {items.map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-gray-400 mt-0.5">&#8226;</span>
                      {item}
                    </li>
                  ))}
                </ul>
              ) : null;
            })()}
          </div>
        </section>
      )}
    </div>
  );
}
