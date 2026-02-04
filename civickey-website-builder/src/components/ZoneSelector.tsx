'use client';

import { useState } from 'react';
import type { Locale, Zone } from '@/lib/types';
import { t } from '@/lib/i18n';

interface ZoneSelectorProps {
  zones: Zone[];
  locale: Locale;
  selectedZone: string | null;
  onSelect: (zoneId: string) => void;
}

export default function ZoneSelector({ zones, locale, selectedZone, onSelect }: ZoneSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {t('collections.select_zone', locale)}
      </label>
      <div className="flex flex-wrap gap-2">
        {zones.map((zone) => (
          <button
            key={zone.id}
            onClick={() => onSelect(zone.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              selectedZone === zone.id
                ? 'text-white border-transparent'
                : 'text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
            style={
              selectedZone === zone.id
                ? { backgroundColor: zone.color || 'var(--color-primary)' }
                : undefined
            }
          >
            {zone.name}
          </button>
        ))}
      </div>
    </div>
  );
}
