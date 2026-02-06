import Skeleton from '../Skeleton.jsx';

export default function FormSkeleton() {
  return (
    <div>
      <Skeleton className="h-4 w-20 mb-4" />
      <Skeleton className="h-8 w-40 mb-6" />
      <div className="max-w-md space-y-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i}>
            <Skeleton className="h-4 w-16 mb-2" />
            <Skeleton className="h-10 w-full rounded" />
          </div>
        ))}
        <div className="flex gap-3 pt-2">
          <Skeleton className="h-10 w-24 rounded" />
          <Skeleton className="h-10 w-20 rounded" />
        </div>
      </div>
    </div>
  );
}
