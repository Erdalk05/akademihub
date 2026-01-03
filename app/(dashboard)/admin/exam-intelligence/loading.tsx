export default function Loading() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="bg-slate-200 rounded-2xl h-32" />

      {/* Stats Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-md p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-slate-200 rounded-xl" />
              <div className="w-12 h-6 bg-slate-200 rounded-lg" />
            </div>
            <div className="h-8 bg-slate-200 rounded w-20 mb-2" />
            <div className="h-4 bg-slate-100 rounded w-24" />
          </div>
        ))}
      </div>

      {/* Content Skeleton */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="h-6 bg-slate-200 rounded w-32 mb-4" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
