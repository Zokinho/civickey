import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CivicKey',
  description: 'Municipal website powered by CivicKey',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
