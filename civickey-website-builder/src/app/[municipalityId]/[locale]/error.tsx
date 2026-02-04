'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container-page py-24 text-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        Une erreur est survenue / An error occurred
      </h1>
      <p className="text-gray-600 mb-8">{error.message}</p>
      <button onClick={reset} className="btn-primary">
        R&eacute;essayer / Try again
      </button>
    </div>
  );
}
