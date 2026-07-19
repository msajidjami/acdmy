'use client';
export default function StudentHome({ user, currentCourse, progress, upcomingClasses, assignments, attendance, messages }) {
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow p-6">
          <h2 className="text-2xl font-bold">Welcome back, {user.name}!</h2>
          <p className="text-slate-600 dark:text-slate-300">Current Course: {currentCourse}</p>
          <div className="mt-4">
            <div className="w-full bg-slate-200 rounded-full h-4">
              <div className="bg-teal-600 h-4 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
            <p className="mt-1 text-sm">{progress}% complete</p>
          </div>
          <button className="mt-4 bg-teal-600 text-white px-4 py-2 rounded-lg">Continue Learning</button>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
          <h3 className="font-bold">Today's Schedule</h3>
          <ul className="mt-2 space-y-2">
            {upcomingClasses.map((cls: any) => (
              <li key={cls._id} className="flex justify-between border-b pb-2">
                <span>{cls.title}</span>
                <span className="text-sm text-slate-500">{cls.time}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {/* Quick actions, announcements, etc. */}
    </div>
  );
}