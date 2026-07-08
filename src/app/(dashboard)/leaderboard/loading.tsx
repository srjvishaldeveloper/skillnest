const Loading = () => {
  return (
    <div className="p-6 flex-1">
      <div className="max-w-4xl mx-auto">
        {/* Header skeleton */}
        <div className="mb-6">
          <div className="h-7 bg-gray-200 rounded w-40 animate-pulse" />
          <div className="h-4 bg-gray-100 rounded w-72 mt-2 animate-pulse" />
        </div>

        {/* Top 3 cards skeleton */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm text-center animate-pulse">
              <div className="h-8 w-8 bg-gray-100 rounded-full mx-auto mb-2" />
              <div className="h-12 w-12 bg-gray-100 rounded-full mx-auto mb-2" />
              <div className="h-4 bg-gray-100 rounded w-24 mx-auto mb-1" />
              <div className="h-6 bg-gray-100 rounded w-20 mx-auto mb-1" />
              <div className="h-3 bg-gray-100 rounded w-28 mx-auto" />
            </div>
          ))}
        </div>

        {/* Table skeleton */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="border-b border-gray-100 p-4 flex gap-8">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded flex-1 animate-pulse" />
            ))}
          </div>
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex items-center gap-8 px-4 py-3 border-b border-gray-50">
              <div className="h-5 bg-gray-100 rounded w-8 animate-pulse" />
              <div className="flex items-center gap-3 flex-1">
                <div className="h-8 w-8 bg-gray-100 rounded-full animate-pulse" />
                <div className="h-4 bg-gray-100 rounded w-32 animate-pulse" />
              </div>
              <div className="h-5 bg-gray-100 rounded-full w-16 animate-pulse" />
              <div className="h-4 bg-gray-100 rounded w-14 animate-pulse" />
              <div className="h-4 bg-gray-100 rounded w-10 hidden md:block animate-pulse" />
              <div className="h-4 bg-gray-100 rounded w-12 hidden md:block animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Loading;
