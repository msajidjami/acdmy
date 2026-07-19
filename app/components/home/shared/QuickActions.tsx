// components/home/shared/QuickActions.tsx
import { LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface QuickAction {
  label: string;
  icon: LucideIcon;
  href: string;
  color?: string; // optional Tailwind text color class
}

interface QuickActionsProps {
  actions: QuickAction[];
  title?: string;
}

export const QuickActions = ({
  actions,
  title = 'Quick Actions',
}: QuickActionsProps) => {
  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex flex-col items-center justify-center p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <action.icon
              className={`w-6 h-6 ${action.color || 'text-blue-600 dark:text-blue-400'}`}
            />
            <span className="mt-2 text-sm text-center">{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};