export const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
)

export const DashboardSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
    <div className="lg:ml-20 transition-all duration-300">
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
              <Skeleton className="h-4 w-24 mb-4" />
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
            <Skeleton className="h-6 w-40 mb-4" />
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
            <Skeleton className="h-6 w-40 mb-4" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    </div>
  </div>
)

export const TransactionsSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
    <div className="lg:ml-20 transition-all duration-300">
      <div className="p-6 lg:p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg mb-6">
          <div className="flex gap-2 mb-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-20" />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div>
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="text-right">
                  <Skeleton className="h-5 w-20 mb-2" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
)

export const AnalyticsSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
    <div className="lg:ml-20 transition-all duration-300">
      <div className="p-6 lg:p-8">
        <Skeleton className="h-8 w-48 mb-8" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
              <Skeleton className="h-4 w-24 mb-4" />
              <Skeleton className="h-8 w-32" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
            <Skeleton className="h-6 w-40 mb-4" />
            <Skeleton className="h-80 w-full" />
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
            <Skeleton className="h-6 w-40 mb-4" />
            <Skeleton className="h-80 w-full" />
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
          <Skeleton className="h-6 w-40 mb-4" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    </div>
  </div>
)

export const BudgetSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
    <div className="lg:ml-20 transition-all duration-300">
      <div className="p-6 lg:p-8">
        <div className="flex justify-between items-center mb-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
              <Skeleton className="h-2 w-full mb-2 rounded-full" />
              <div className="flex justify-between">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
)

export const GoalsSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
    <div className="lg:ml-20 transition-all duration-300">
      <div className="p-6 lg:p-8">
        <div className="flex justify-between items-center mb-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div>
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
              <Skeleton className="h-2 w-full mb-2 rounded-full" />
              <div className="flex justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
)

export const SettingsSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
    <div className="lg:ml-20 transition-all duration-300">
      <div className="p-6 lg:p-8">
        <Skeleton className="h-8 w-48 mb-8" />

        <div className="max-w-4xl space-y-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
              <Skeleton className="h-6 w-40 mb-4" />
              <div className="space-y-4">
                <div>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
)

export const BorrowLoanSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
    <div className="lg:ml-20 transition-all duration-300">
      <div className="p-6 lg:p-8">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 mb-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-14 w-14 rounded-xl" />
              <div>
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
            <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-md">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
          <div className="flex gap-3">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-6 w-24 mb-2" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                </div>
                <div className="flex gap-1">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
)
