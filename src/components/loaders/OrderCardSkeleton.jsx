import Skeleton from '../Skeleton.jsx';

export default function OrderCardSkeleton() {
  return (
    <li className="border border-gray-200 rounded-lg p-4 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Skeleton className="h-5 w-24 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-5 w-16" />
      </div>
    </li>
  );
}
