import { notFound } from 'next/navigation';
import { getPageBySlug } from '@/lib/municipalities';
import type { Locale } from '@/lib/types';
import TextPage from '@/components/pages/TextPage';
import InfoCardPage from '@/components/pages/InfoCardPage';
import PdfPage from '@/components/pages/PdfPage';
import CouncilPage from '@/components/pages/CouncilPage';
import LinksPage from '@/components/pages/LinksPage';
import ContactPage from '@/components/pages/ContactPage';

export const revalidate = 300;

const PAGE_RENDERERS: Record<string, React.ComponentType<{ page: any; locale: Locale }>> = {
  'text': TextPage,
  'info-cards': InfoCardPage,
  'pdf': PdfPage,
  'council': CouncilPage,
  'links': LinksPage,
  'contact': ContactPage,
};

interface PageProps {
  params: Promise<{ municipalityId: string; locale: string; pageSlug: string }>;
}

export default async function CustomPageRoute({ params }: PageProps) {
  const { municipalityId, locale: localeParam, pageSlug } = await params;
  const locale = localeParam as Locale;

  // Skip built-in routes (handled by their own page.tsx)
  const builtInSlugs = ['collections', 'events', 'news', 'facilities'];
  if (builtInSlugs.includes(pageSlug)) {
    notFound();
  }

  const page = await getPageBySlug(municipalityId, pageSlug);
  if (!page) notFound();

  const Renderer = PAGE_RENDERERS[page.type];
  if (!Renderer) notFound();

  return <Renderer page={page} locale={locale} />;
}
