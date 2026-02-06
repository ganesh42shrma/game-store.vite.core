import Skeleton from '../Skeleton.jsx';

export default function OrderDetailSkeleton() {
  return (
    <div>
      <Skeleton className="h-4 w-24 mb-4" />
      <Skeleton className="h-8 w-32 mb-2" />
      <Skeleton className="h-4 w-48 mb-6" />
      <div className="border border-gray-200 rounded-lg p-4 bg-white max-w-lg">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
        <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
        </div>
      </div>
    </div>
  );
}
