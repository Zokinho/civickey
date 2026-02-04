import { notFound } from 'next/navigation';
import { getMunicipalityConfig } from '@/lib/municipalities';
import { getPublishedPages } from '@/lib/municipalities';
import { isValidLocale } from '@/lib/locale';
import { generateThemeStyles } from '@/lib/theme';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import type { Locale } from '@/lib/types';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ municipalityId: string; locale: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ municipalityId: string; locale: string }> }) {
  const { municipalityId, locale } = await params;
  const config = await getMunicipalityConfig(municipalityId);
  if (!config) return { title: 'Not Found' };

  return {
    title: {
      template: `%s | ${config.name}`,
      default: config.name,
    },
    description: locale === 'fr'
      ? `Site officiel de ${config.name}`
      : `Official website of ${config.name}`,
    openGraph: {
      siteName: config.name,
      locale: locale === 'fr' ? 'fr_CA' : 'en_CA',
    },
  };
}

export default async function MunicipalityLayout({ children, params }: LayoutProps) {
  const { municipalityId, locale } = await params;

  if (!isValidLocale(locale)) notFound();

  const config = await getMunicipalityConfig(municipalityId);
  if (!config) notFound();

  let pages: Awaited<ReturnType<typeof getPublishedPages>> = [];
  try {
    pages = await getPublishedPages(municipalityId);
  } catch {
    pages = [];
  }

  const themeStyle = generateThemeStyles(config.colors);

  return (
    <div style={{ ...parseStyleString(themeStyle) }}>
      <Header config={config} locale={locale as Locale} pages={pages} />
      <main className="min-h-[60vh]">{children}</main>
      <Footer config={config} locale={locale as Locale} />
    </div>
  );
}

function parseStyleString(styleStr: string): Record<string, string> {
  const styles: Record<string, string> = {};
  styleStr.split(';').forEach((pair) => {
    const [key, value] = pair.split(':').map((s) => s.trim());
    if (key && value) styles[key] = value;
  });
  return styles;
}
