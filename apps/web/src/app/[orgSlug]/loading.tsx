export default function DashboardLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-white p-6 space-y-6 animate-pulse select-none">
      {/* Top Header Skeleton */}
      <div className="flex items-center justify-between pb-6 border-b border-black/10">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-black/10 rounded-lg"></div>
          <div className="h-4 w-72 bg-black/5 rounded-md"></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-28 bg-black/10 rounded-xl"></div>
          <div className="h-10 w-36 bg-black rounded-xl"></div>
        </div>
      </div>

      {/* KPI Cards Skeleton (4 Columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-5 bg-white border border-black/10 rounded-2xl space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-4 w-24 bg-black/10 rounded"></div>
              <div className="h-6 w-6 bg-black/5 rounded-full"></div>
            </div>
            <div className="h-8 w-32 bg-black/15 rounded-lg"></div>
            <div className="h-3 w-40 bg-black/5 rounded"></div>
          </div>
        ))}
      </div>

      {/* Main Grid Skeleton: Chart & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 bg-white border border-black/10 rounded-2xl space-y-4">
          <div className="flex justify-between items-center">
            <div className="h-5 w-40 bg-black/10 rounded"></div>
            <div className="h-4 w-24 bg-black/5 rounded"></div>
          </div>
          <div className="h-64 bg-black/5 rounded-xl"></div>
        </div>
        <div className="p-6 bg-white border border-black/10 rounded-2xl space-y-4">
          <div className="h-5 w-32 bg-black/10 rounded"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-black/10 shrink-0"></div>
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-3/4 bg-black/10 rounded"></div>
                  <div className="h-2.5 w-1/2 bg-black/5 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
