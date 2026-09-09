import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';
import Academy from '@/models/Academy';
import Inquiry from '@/models/Inquiry';
import Teacher from '@/models/Teacher';
import Enrollment from '@/models/Enrollment';
import Link from 'next/link';
import { Users, School, Mail } from 'lucide-react';

// Define the expected shape of the JWT payload
interface DecodedToken extends jwt.JwtPayload {
  role: string;
}

async function getAdminStats() {
  await connectDB();

  const [
    usersCount,
    ownersCount,
    teachersCount,
    studentsCount,
    academiesCount,
    inquiriesCount,
    enrollmentsCount,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'owner' }),
    Teacher.countDocuments(),
    User.countDocuments({ role: 'student' }),
    Academy.countDocuments(),
    Inquiry.countDocuments({ status: 'pending' }),
    Enrollment.countDocuments(),
  ]);

  return {
    usersCount,
    ownersCount,
    teachersCount,
    studentsCount,
    academiesCount,
    inquiriesCount,
    enrollmentsCount,
  };
}

export default async function AdminDashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/login');
  }

  // Ensure JWT_SECRET is defined
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not defined');
  }

  try {
    const decoded = jwt.verify(token, secret) as DecodedToken;

    if (decoded.role !== 'admin') {
      redirect('/');
    }
  } catch {
    redirect('/login');
  }

  const stats = await getAdminStats();

  const statsCards = [
    {
      label: 'Total Users',
      value: stats.usersCount,
      icon: '👥',
      color: 'bg-blue-50 border-blue-200',
    },
    {
      label: 'Owners',
      value: stats.ownersCount,
      icon: '🏛️',
      color: 'bg-purple-50 border-purple-200',
    },
    {
      label: 'Teachers',
      value: stats.teachersCount,
      icon: '👨‍🏫',
      color: 'bg-green-50 border-green-200',
    },
    {
      label: 'Students',
      value: stats.studentsCount,
      icon: '🎓',
      color: 'bg-yellow-50 border-yellow-200',
    },
    {
      label: 'Academies',
      value: stats.academiesCount,
      icon: '🏫',
      color: 'bg-indigo-50 border-indigo-200',
    },
    {
      label: 'Pending Inquiries',
      value: stats.inquiriesCount,
      icon: '📩',
      color: 'bg-red-50 border-red-200',
    },
    {
      label: 'Enrollments',
      value: stats.enrollmentsCount,
      icon: '📚',
      color: 'bg-cyan-50 border-cyan-200',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2 sm:mb-3">
        📊 Admin Dashboard
      </h1>

      <p className="text-sm sm:text-base text-slate-500 mb-6 sm:mb-8">
        Welcome to the admin panel. Here you can manage everything.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {statsCards.map((stat) => (
          <div
            key={stat.label}
            className={`p-4 sm:p-6 rounded-2xl border ${stat.color} shadow-sm hover:shadow-md transition`}
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl sm:text-3xl">{stat.icon}</span>
              <span className="text-xl sm:text-2xl font-bold text-slate-800">
                {stat.value}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 sm:mt-2">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 sm:mt-10 grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        <Link
          href="/admin/users"
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 hover:shadow-lg transition flex items-center gap-3 sm:gap-4"
        >
          <Users className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-600" />
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-slate-800">
              Manage Users
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              View, edit, or delete users
            </p>
          </div>
        </Link>

        <Link
          href="/admin/academies"
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 hover:shadow-lg transition flex items-center gap-3 sm:gap-4"
        >
          <School className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-slate-800">
              Manage Academies
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Approve or deactivate academies
            </p>
          </div>
        </Link>

        <Link
          href="/admin/inquiries"
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 hover:shadow-lg transition flex items-center gap-3 sm:gap-4"
        >
          <Mail className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-slate-800">
              View Inquiries
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Check all pending messages
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}