import React from 'react';

export function SkeletonPlan() {
  return (
    <div className="space-y-6 w-full animate-pulse select-none">
      {/* Top progress bar placeholder */}
      <div className="h-3 w-32 skeleton" />

      {/* 5 task blocks */}
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="card p-4 h-16 flex flex-col justify-center">
            <div className="h-2.5 w-3/4 skeleton mb-2" />
            <div className="h-2 w-1/2 skeleton" />
          </div>
        ))}
      </div>

      {/* Chat bar placeholder at the bottom */}
      <div className="h-12 skeleton rounded-xl w-full" />
    </div>
  );
}

export default SkeletonPlan;
