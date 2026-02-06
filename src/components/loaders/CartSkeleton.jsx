import Skeleton from '../Skeleton.jsx';

function CartRowSkeleton() {
  return (
    <div className="flex items-center gap-4 py-4 border-b border-gray-200 last:border-0">
      <div className="flex-1 min-w-0">
        <Skeleton className="h-5 w-40 mb-2" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-16 rounded" />
        <Skeleton className="h-4 w-14" />
      </div>
      <Skeleton className="h-5 w-16" />
    </div>
  );
}

export default function CartSkeleton() {
  return (
    <div>
      <Skeleton className="h-8 w-24 mb-6" />
      <div className="border border-gray-200 rounded-lg p-4 bg-white">
        <CartRowSkeleton />
        <CartRowSkeleton />
        <CartRowSkeleton />
      </div>
      <div className="mt-6 flex items-center justify-between">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-10 w-28 rounded" />
      </div>
    </div>
  );
}
