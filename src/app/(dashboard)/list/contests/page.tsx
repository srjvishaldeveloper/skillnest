export default function ManageContestsPage() {
  return (
    <div className="bg-white p-6 rounded-2xl flex-1 m-4 mt-0 shadow-sm border border-gray-100">
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Coding Contests — Coming Soon</h2>
        <p className="text-gray-500 text-sm max-w-md">
          We&apos;re working on an exciting coding contest platform. Stay tuned for updates!
        </p>
      </div>
    </div>
  );
}
