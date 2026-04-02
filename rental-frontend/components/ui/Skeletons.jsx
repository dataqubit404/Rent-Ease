export function PropertyCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
      <div className="aspect-[4/3] skeleton" />
      <div className="p-4 space-y-3">
        <div className="skeleton h-4 rounded-lg w-3/4" />
        <div className="skeleton h-3 rounded-lg w-1/2" />
        <div className="flex gap-3">
          <div className="skeleton h-3 rounded w-16" />
          <div className="skeleton h-3 rounded w-16" />
        </div>
        <div className="flex justify-between pt-2 border-t border-gray-100">
          <div className="skeleton h-5 rounded w-24" />
          <div className="skeleton h-7 w-7 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function DashboardStatSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100">
      <div className="flex justify-between items-start mb-4">
        <div className="skeleton h-4 rounded w-24" />
        <div className="skeleton h-10 w-10 rounded-xl" />
      </div>
      <div className="skeleton h-8 rounded w-20 mb-1" />
      <div className="skeleton h-3 rounded w-32" />
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <div className="skeleton h-4 rounded w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  );
}
