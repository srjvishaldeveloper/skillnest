const Loading = () => {
  return (
    <div className="p-6 flex-1">
      <div className="max-w-5xl mx-auto">
        {/* Header skeleton */}
        <div className="mb-6">
          <div className="h-7 bg-gray-200 rounded w-48 animate-pulse" />
          <div className="h-4 bg-gray-100 rounded w-72 mt-2 animate-pulse" />
        </div>

        {/* Filters skeleton */}
        <div className="flex gap-3 mb-4 bg-white rounded-lg p-4 shadow-sm">
          <div className="h-9 w-40 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-9 w-40 bg-gray-100 rounded-lg animate-pulse" />
        </div>

        {/* Table skeleton */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="border-b border-gray-100 p-4 flex gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded flex-1 animate-pulse" />
            ))}
          </div>
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-8 px-4 py-3 border-b border-gray-50">
              <div className="h-4 bg-gray-100 rounded flex-1 animate-pulse" />
              <div className="h-5 bg-gray-100 rounded-full w-20 animate-pulse" />
              <div className="h-4 bg-gray-100 rounded w-16 animate-pulse" />
              <div className="h-4 bg-gray-100 rounded w-12 hidden md:block animate-pulse" />
              <div className="h-4 bg-gray-100 rounded w-14 hidden md:block animate-pulse" />
              <div className="h-4 bg-gray-100 rounded w-20 hidden lg:block animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Loading;
