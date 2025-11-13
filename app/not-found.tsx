export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f9fafb' }}>
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4" style={{ color: '#3b82f6' }}>404</h1>
        <h2 className="text-2xl font-semibold mb-4" style={{ color: '#1e293b' }}>Page Not Found</h2>
        <p className="text-lg mb-6" style={{ color: '#64748b' }}>
          The page you're looking for doesn't exist.
        </p>
        <a
          href="/"
          className="px-6 py-3 rounded-lg font-medium text-white transition-all hover:shadow-md inline-block"
          style={{ backgroundColor: '#3b82f6' }}
        >
          Go Home
        </a>
      </div>
    </div>
  );
}
