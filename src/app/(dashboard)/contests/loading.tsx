const Loading = () => {
  return (
    <div className="p-6 flex-1">
      <div className="max-w-5xl mx-auto">
        {/* Header skeleton */}
        <div className="mb-6">
          <div className="h-7 bg-gray-200 rounded w-44 animate-pulse" />
          <div className="h-4 bg-gray-100 rounded w-72 mt-2 animate-pulse" />
        </div>

        {/* Active contests skeleton */}
        <div className="mb-8">
          <div className="h-5 bg-gray-200 rounded w-32 mb-3 animate-pulse" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 animate-pulse">
                <div className="flex justify-between mb-2">
                  <div className="h-4 bg-gray-100 rounded w-32" />
                  <div className="h-5 bg-gray-100 rounded-full w-16" />
                </div>
                <div className="h-3 bg-gray-100 rounded w-full mb-3" />
                <div className="flex gap-4">
                  <div className="h-3 bg-gray-100 rounded w-20" />
                  <div className="h-3 bg-gray-100 rounded w-16" />
                  <div className="h-3 bg-gray-100 rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming contests skeleton */}
        <div>
          <div className="h-5 bg-gray-200 rounded w-28 mb-3 animate-pulse" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 animate-pulse">
                <div className="flex justify-between mb-2">
                  <div className="h-4 bg-gray-100 rounded w-32" />
                  <div className="h-5 bg-gray-100 rounded-full w-16" />
                </div>
                <div className="h-3 bg-gray-100 rounded w-full mb-3" />
                <div className="flex gap-4">
                  <div className="h-3 bg-gray-100 rounded w-20" />
                  <div className="h-3 bg-gray-100 rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Loading;
