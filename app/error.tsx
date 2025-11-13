'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f9fafb' }}>
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold mb-4" style={{ color: '#ef4444' }}>500</h1>
        <h2 className="text-2xl font-semibold mb-4" style={{ color: '#1e293b' }}>Something went wrong!</h2>
        <p className="text-lg mb-6" style={{ color: '#64748b' }}>
          An unexpected error occurred. Please try again.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 rounded-lg font-medium text-white transition-all hover:shadow-md"
            style={{ backgroundColor: '#3b82f6' }}
          >
            Try Again
          </button>
          <Link
            href="/"
            className="px-6 py-3 rounded-lg font-medium transition-all hover:shadow-md inline-block"
            style={{ backgroundColor: '#ffffff', border: '2px solid #e2e8f0', color: '#1e293b' }}
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
