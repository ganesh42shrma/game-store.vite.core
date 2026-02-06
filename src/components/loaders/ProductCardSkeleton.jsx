import Skeleton from '../Skeleton.jsx';

export default function ProductCardSkeleton() {
  return (
    <div className="block border border-gray-200 rounded-lg overflow-hidden bg-white">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="p-4">
        <Skeleton className="h-5 w-3/4 mb-2" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}
