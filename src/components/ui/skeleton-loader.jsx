import React from 'react';

const Skeleton = ({ className = '', width = 'w-full', height = 'h-4', rounded = 'rounded-lg' }) => (
  <div className={`bg-gradient-to-r from-muted via-muted to-muted animate-pulse ${className} ${width} ${height} ${rounded}`} />
);

export function KPICardSkeleton() {
  return (
    <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-3.5">
        <Skeleton width="w-10" height="h-10" rounded="rounded-lg" />
        <Skeleton width="w-32" height="h-3" />
      </div>
      <Skeleton width="w-full" height="h-6" className="mb-2" />
      <Skeleton width="w-24" height="h-3" />
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm">
      <div className="space-y-3 mb-4">
        <Skeleton width="w-40" height="h-5" />
        <Skeleton width="w-64" height="h-3" />
      </div>
      <div className="space-y-2">
        {Array(8).fill(0).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton width="w-12" height="h-8" rounded="rounded-md" />
            <Skeleton width="flex-1" height="h-8" rounded="rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TableRowSkeleton({ cols = 7 }) {
  return (
    <div className="flex gap-4 px-4 py-3 border-b border-border">
      {Array(cols).fill(0).map((_, i) => (
        <Skeleton key={i} width="flex-1" height="h-4" />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 7 }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex gap-4 px-4 py-3 border-b border-border bg-muted/30">
        {Array(cols).fill(0).map((_, i) => (
          <Skeleton key={i} width="flex-1" height="h-3" />
        ))}
      </div>
      {Array(rows).fill(0).map((_, i) => (
        <TableRowSkeleton key={i} cols={cols} />
      ))}
    </div>
  );
}

export default Skeleton;