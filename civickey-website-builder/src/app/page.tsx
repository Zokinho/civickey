import { redirect } from 'next/navigation';

export default function RootPage() {
  // In production, middleware handles routing via subdomains.
  // This root page is only hit in dev when no municipality is specified.
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">CivicKey Website Builder</h1>
        <p className="text-gray-600 mb-6">
          Access a municipality website via subdomain or path.
        </p>
        <p className="text-sm text-gray-500">
          Dev example: <code className="bg-gray-100 px-2 py-1 rounded">/saint-lazare/fr</code>
        </p>
      </div>
    </main>
  );
}
