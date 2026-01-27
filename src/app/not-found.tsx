import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-2">
          <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h2 className="text-lg font-semibold">Page Not Found</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <p className="text-sm text-gray-600 mb-4">
          It might have been moved, deleted, or you may have entered the wrong URL.
        </p>
        <Link
          href="/"
          className="block w-full bg-black text-white text-center py-2 px-4 rounded-md hover:bg-gray-800 transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}
