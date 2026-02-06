'use client';

export function CategoryCardSkeleton() {
  return (
    <div className="bg-[#001B33] border border-[#A5ACAF]/10 rounded-2xl p-5 mb-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full shimmer" />
          <div className="w-40 h-5 rounded shimmer" />
        </div>
        <div className="w-16 h-6 rounded-lg shimmer" />
      </div>
      <div className="w-48 h-4 rounded shimmer mb-2" />
      <div className="w-32 h-4 rounded shimmer mb-4" />
      <div className="flex justify-center">
        <div className="w-32 h-10 rounded-xl shimmer" />
      </div>
    </div>
  );
}

export function CategoryListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="px-4 py-4 space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <CategoryCardSkeleton key={i} />
      ))}
    </div>
  );
}
