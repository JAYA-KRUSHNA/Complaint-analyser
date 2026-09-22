/**
 * Skeleton loading components for CiviSense.
 * Content-aware placeholders that match the shape of real data.
 */

function SkeletonPulse({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`rounded-lg animate-pulse ${className}`}
      style={{
        background: 'linear-gradient(90deg, rgba(226,232,240,0.4) 25%, rgba(226,232,240,0.7) 50%, rgba(226,232,240,0.4) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.8s ease-in-out infinite',
        ...style,
      }}
    />
  );
}

export function SkeletonStatCard() {
  return (
    <div className="glass-card p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-2.5 flex-1">
          <SkeletonPulse className="h-3 w-24" />
          <SkeletonPulse className="h-7 w-16" />
        </div>
        <SkeletonPulse className="w-10 h-10 rounded-xl" />
      </div>
    </div>
  );
}

export function SkeletonTableRow() {
  return (
    <tr>
      <td className="px-6 py-4">
        <div className="space-y-1.5">
          <SkeletonPulse className="h-3 w-16" />
          <SkeletonPulse className="h-4 w-48" />
        </div>
      </td>
      <td className="px-6 py-4"><SkeletonPulse className="h-4 w-20" /></td>
      <td className="px-6 py-4"><SkeletonPulse className="h-5 w-20 rounded-full" /></td>
      <td className="px-6 py-4"><SkeletonPulse className="h-5 w-12 rounded-full" /></td>
      <td className="px-6 py-4"><SkeletonPulse className="h-4 w-28" /></td>
    </tr>
  );
}

export function SkeletonComplaintCard() {
  return (
    <div className="flex items-center gap-4 px-5 py-3.5">
      <SkeletonPulse className="w-9 h-9 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <SkeletonPulse className="h-4 w-3/4" />
        <SkeletonPulse className="h-3 w-1/3" />
      </div>
      <div className="flex gap-2">
        <SkeletonPulse className="h-5 w-10 rounded-full" />
        <SkeletonPulse className="h-5 w-20 rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonChart({ height = 'h-48' }: { height?: string }) {
  return (
    <div className={`${height} flex items-end justify-center gap-3 px-4 pb-4`}>
      {[40, 65, 50, 80, 35, 70, 55].map((h, i) => (
        <SkeletonPulse
          key={i}
          className="rounded-t-lg flex-1 max-w-[40px]"
          style={{ height: `${h}%`, animationDelay: `${i * 100}ms` }}
        />
      ))}
    </div>
  );
}

export function SkeletonQueueItem() {
  return (
    <div className="glass-card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex items-center gap-3 sm:w-28 shrink-0">
        <SkeletonPulse className="w-10 h-10 rounded-xl" />
        <div className="space-y-1.5">
          <SkeletonPulse className="h-3 w-8" />
          <SkeletonPulse className="h-2.5 w-14" />
        </div>
      </div>
      <div className="flex-1 space-y-2">
        <div className="flex gap-2">
          <SkeletonPulse className="h-3 w-16" />
          <SkeletonPulse className="h-4 w-20 rounded-full" />
        </div>
        <SkeletonPulse className="h-4 w-2/3" />
        <SkeletonPulse className="h-3 w-1/2" />
      </div>
      <div className="flex gap-2 shrink-0">
        <SkeletonPulse className="h-8 w-24 rounded-xl" />
        <SkeletonPulse className="h-8 w-8 rounded-xl" />
      </div>
    </div>
  );
}

export function SkeletonPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <SkeletonPulse className="h-6 w-48" />
        <SkeletonPulse className="h-4 w-64" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <SkeletonStatCard key={i} />)}
      </div>
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b border-civic-200/20">
          <SkeletonPulse className="h-4 w-36" />
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="border-b border-civic-100/20 last:border-0">
            <SkeletonComplaintCard />
          </div>
        ))}
      </div>
    </div>
  );
}
