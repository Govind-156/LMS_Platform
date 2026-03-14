"use client";

interface ProgressBarProps {
  completed: number;
  total: number;
  label?: string;
  className?: string;
}

export function ProgressBar({ completed, total, label, className = "" }: ProgressBarProps) {
  const percent = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;

  return (
    <div className={className}>
      {label && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
          {label}
          {total > 0 && (
            <span className="ml-1 text-gray-500 dark:text-gray-500">({percent}%)</span>
          )}
        </p>
      )}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-300"
            style={{ width: `${percent}%` }}
            role="progressbar"
            aria-valuenow={completed}
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuetext={`${completed} of ${total} lessons completed`}
          />
        </div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 tabular-nums">
          {completed} / {total}
        </span>
      </div>
    </div>
  );
}
