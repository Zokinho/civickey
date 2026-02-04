'use client';

import { useState } from 'react';
import type { Locale, Event } from '@/lib/types';
import { t } from '@/lib/i18n';
import EventCard from './EventCard';

interface EventListProps {
  events: Event[];
  municipalityId: string;
  locale: Locale;
}

const CATEGORIES = ['community', 'workshop', 'family', 'municipal'];

export default function EventList({ events, municipalityId, locale }: EventListProps) {
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all'
    ? events
    : events.filter((e) => e.category === filter);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'text-white'
              : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
          }`}
          style={filter === 'all' ? { backgroundColor: 'var(--color-primary)' } : undefined}
        >
          {t('events.all', locale)}
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
              filter === cat
                ? 'text-white'
                : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
            }`}
            style={filter === cat ? { backgroundColor: 'var(--color-primary)' } : undefined}
          >
            {cat}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-500 py-8 text-center">{t('events.no_events', locale)}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              municipalityId={municipalityId}
              locale={locale}
            />
          ))}
        </div>
      )}
    </div>
  );
}
