'use client';

import StudentHeader from './components/StudentHeader';
import StudentStats from './components/StudentStats';
import UpcomingClasses from './components/UpcomingClasses';
import HomeworkCard from './components/HomeworkCard';
import AttendanceCard from './components/AttendanceCard';
import ProgressChart from './components/ProgressChart';
import TeacherCard from './components/TeacherCard';
import DailyAyah from './components/DailyAyah';
import QuickActions from './components/QuickActions';
import NotificationsPanel from './components/NotificationsPanel';

export default function StudentDashboardPage() {
  return (
    <div className="space-y-8">

      {/* Header */}
      <StudentHeader />

      {/* Statistics */}
      <StudentStats />

      {/* Main Content */}
      <div className="grid xl:grid-cols-3 gap-6">

        {/* Left Section */}
        <div className="xl:col-span-2 space-y-6">

          <UpcomingClasses />

          <HomeworkCard />

          <ProgressChart />

        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">

          <AttendanceCard />

          <TeacherCard />

          <DailyAyah />

        </div>

      </div>

      {/* Bottom Section */}
      <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">

        <QuickActions />

        <NotificationsPanel />

        <div className="bg-white rounded-2xl shadow-sm border p-6">

          <h2 className="text-xl font-bold mb-4">
            Coming Soon 🚀
          </h2>

          <ul className="space-y-3 text-gray-600">

            <li>📅 Live Zoom Classes</li>

            <li>📝 Homework Submission</li>

            <li>👨‍🏫 Teacher Feedback</li>

            <li>📈 Learning Progress</li>

            <li>🎓 Certificates</li>

            <li>💳 Online Payments</li>

            <li>🤖 Islamic AI Assistant</li>

            <li>📚 Quran Reader</li>

            <li>📱 Mobile App</li>

          </ul>

        </div>

      </div>

    </div>
  );
}