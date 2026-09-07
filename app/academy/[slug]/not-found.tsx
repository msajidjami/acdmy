import Link from 'next/link';

export default function AcademyNotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-green-50/20 to-white flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-3xl font-bold text-black">Academy Not Found</h1>
        <p className="text-black/60 mt-2">The academy you're looking for doesn't exist or has been removed.</p>
        <Link
          href="/"
          className="inline-block mt-6 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition shadow-lg shadow-green-600/20"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}