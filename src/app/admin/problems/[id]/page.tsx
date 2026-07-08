export default function AdminEditProblemPage() {
  return (
    <div className="p-6 flex-1">
      <div className="max-w-5xl mx-auto flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Manage Problems — Coming Soon</h2>
        <p className="text-gray-500 text-sm max-w-md">
          Problem management is under development. Stay tuned!
        </p>
      </div>
    </div>
  );
}
