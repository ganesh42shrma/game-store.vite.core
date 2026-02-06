import Skeleton from '../Skeleton.jsx';

export default function CheckoutSkeleton() {
  return (
    <div>
      <Skeleton className="h-8 w-28 mb-6" />
      <div className="border border-gray-200 rounded-lg p-4 bg-white max-w-md">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex justify-between py-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <Skeleton className="h-5 w-20" />
        </div>
      </div>
      <div className="mt-6 flex gap-4">
        <Skeleton className="h-10 w-28 rounded" />
        <Skeleton className="h-10 w-24 rounded" />
      </div>
    </div>
  );
}
