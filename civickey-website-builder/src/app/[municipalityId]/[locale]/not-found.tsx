import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container-page py-24 text-center">
      <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
      <p className="text-xl text-gray-600 mb-8">Page non trouv&eacute;e / Page Not Found</p>
      <Link href="/" className="btn-primary">
        Accueil / Home
      </Link>
    </div>
  );
}
