import Image from 'next/image';
import type { Locale, MunicipalityConfig } from '@/lib/types';
import { getLocalizedText } from '@/lib/i18n';

interface HeroSectionProps {
  config: MunicipalityConfig;
  locale: Locale;
}

export default function HeroSection({ config, locale }: HeroSectionProps) {
  const tagline = getLocalizedText(config.website?.heroTagline, locale);
  const heroImage = config.website?.heroImage;

  return (
    <section className="relative overflow-hidden" style={{ backgroundColor: 'var(--color-primary)' }}>
      {heroImage && (
        <Image
          src={heroImage}
          alt=""
          fill
          className="object-cover opacity-20"
          priority
        />
      )}
      <div className="relative container-page py-16 sm:py-24">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
          {config.name}
        </h1>
        {tagline && (
          <p className="text-lg sm:text-xl text-white/90 max-w-2xl">
            {tagline}
          </p>
        )}
      </div>
    </section>
  );
}
