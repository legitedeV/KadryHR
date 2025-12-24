import React from 'react';

/**
 * Base skeleton component for loading states
 */
export const Skeleton = ({ className = '', width, height, circle = false }) => {
  const baseClasses = 'animate-pulse bg-slate-200 dark:bg-slate-700';
  const shapeClasses = circle ? 'rounded-full' : 'rounded-lg';
  
  const style = {};
  if (width) style.width = width;
  if (height) style.height = height;
  
  return (
    <div 
      className={`${baseClasses} ${shapeClasses} ${className}`}
      style={style}
    />
  );
};

/**
 * Skeleton for stat cards on dashboard
 */
export const StatCardSkeleton = () => (
  <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-3">
    <Skeleton width="60%" height="1rem" />
    <Skeleton width="40%" height="2rem" />
    <Skeleton width="80%" height="0.75rem" />
  </div>
);

/**
 * Skeleton for table rows
 */
export const TableRowSkeleton = ({ columns = 4 }) => (
  <tr className="border-b border-slate-200 dark:border-slate-700">
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <Skeleton height="1rem" />
      </td>
    ))}
  </tr>
);

/**
 * Skeleton for full table
 */
export const TableSkeleton = ({ rows = 5, columns = 4 }) => (
  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
    <table className="w-full">
      <thead className="bg-slate-50 dark:bg-slate-800">
        <tr>
          {Array.from({ length: columns }).map((_, i) => (
            <th key={i} className="px-4 py-3 text-left">
              <Skeleton height="1rem" width="70%" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, i) => (
          <TableRowSkeleton key={i} columns={columns} />
        ))}
      </tbody>
    </table>
  </div>
);

/**
 * Skeleton for list items
 */
export const ListItemSkeleton = () => (
  <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 space-y-2">
    <div className="flex items-center gap-3">
      <Skeleton circle width="2.5rem" height="2.5rem" />
      <div className="flex-1 space-y-2">
        <Skeleton width="60%" height="1rem" />
        <Skeleton width="40%" height="0.75rem" />
      </div>
    </div>
  </div>
);

/**
 * Skeleton for card grid
 */
export const CardGridSkeleton = ({ count = 4 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <StatCardSkeleton key={i} />
    ))}
  </div>
);

/**
 * Skeleton for schedule/calendar view
 */
export const ScheduleSkeleton = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <Skeleton width="200px" height="2rem" />
      <Skeleton width="150px" height="2.5rem" />
    </div>
    <div className="grid grid-cols-7 gap-2">
      {Array.from({ length: 35 }).map((_, i) => (
        <div key={i} className="aspect-square rounded-lg border border-slate-200 dark:border-slate-700 p-2">
          <Skeleton height="1rem" className="mb-2" />
          <Skeleton height="0.75rem" width="60%" />
        </div>
      ))}
    </div>
  </div>
);

/**
 * Skeleton for page header
 */
export const PageHeaderSkeleton = () => (
  <div className="mb-6 space-y-2">
    <Skeleton width="300px" height="2rem" />
    <Skeleton width="500px" height="1rem" />
  </div>
);

/**
 * Full page skeleton with header and content
 */
export const PageSkeleton = ({ type = 'table' }) => (
  <div className="space-y-6">
    <PageHeaderSkeleton />
    {type === 'table' && <TableSkeleton rows={8} columns={5} />}
    {type === 'cards' && <CardGridSkeleton count={6} />}
    {type === 'list' && (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <ListItemSkeleton key={i} />
        ))}
      </div>
    )}
    {type === 'schedule' && <ScheduleSkeleton />}
  </div>
);

export default Skeleton;
