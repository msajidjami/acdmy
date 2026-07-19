// components/home/shared/RecentActivities.tsx
interface Activity {
  id: string;
  user: string;
  action: string;
  date: string;
  status?: string;
}

interface RecentActivitiesProps {
  activities: Activity[];
  title?: string;
}

export const RecentActivities = ({
  activities,
  title = 'Recent Activities',
}: RecentActivitiesProps) => {
  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-3 px-2 font-medium">User</th>
              <th className="text-left py-3 px-2 font-medium">Action</th>
              <th className="text-left py-3 px-2 font-medium">Date</th>
              <th className="text-left py-3 px-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((activity) => (
              <tr
                key={activity.id}
                className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30"
              >
                <td className="py-3 px-2">{activity.user}</td>
                <td className="py-3 px-2">{activity.action}</td>
                <td className="py-3 px-2">{activity.date}</td>
                <td className="py-3 px-2">
                  {activity.status ? (
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        activity.status === 'Completed'
                          ? 'bg-green-100 text-green-700'
                          : activity.status === 'Pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {activity.status}
                    </span>
                  ) : (
                    '-'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};