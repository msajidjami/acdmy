// components/home/shared/DashboardCard.tsx
import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  className?: string;
}

export const DashboardCard = ({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  className = '',
}: DashboardCardProps) => {
  return (
    <div
      className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
          <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
      </div>
      {trend !== undefined && (
        <div className="mt-4 text-sm">
          <span className={trend >= 0 ? 'text-green-600' : 'text-red-600'}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
          <span className="text-gray-500 dark:text-gray-400 ml-2">
            {trendLabel || 'vs last month'}
          </span>
        </div>
      )}
    </div>
  );
};