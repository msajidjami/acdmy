import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import Link from 'next/link';
import connectDB from '@/app/lib/dbConnect';
import Academy from '@/models/Academy';
import Inquiry from '@/models/Inquiry';
import Teacher from '@/models/Teacher';
import { 
  BuildingOfficeIcon, 
  UserGroupIcon, 
  EnvelopeIcon,
  PlusCircleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

async function getOwnerData(userId: string) {
  await connectDB();
  const academy = await Academy.findOne({ ownerId: userId });
  if (!academy) return { academy: null, inquiries: [], teacherCount: 0 };

  const inquiries = await Inquiry.find({ academyId: academy._id })
    .sort({ createdAt: -1 })
    .lean();

  const teacherCount = await Teacher.countDocuments({ academyId: academy._id });

  return { academy, inquiries, teacherCount };
}

interface SearchParams {
  success?: string;
  deleted?: string;
}

export default async function OwnerDashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return redirect('/login');

  let userId = '';
  let userRole = '';
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    userId = decoded.userId;
    userRole = decoded.role;
    if (userRole !== 'owner' && userRole !== 'admin') return redirect('/');
  } catch {
    return redirect('/login');
  }

  const { academy, inquiries, teacherCount } = await getOwnerData(userId);

  const success = searchParams.success === 'true';
  const deleted = searchParams.deleted === 'true';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      {/* ✅ Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 shadow-sm">
          <CheckCircleIcon className="h-6 w-6 text-emerald-600 flex-shrink-0" />
          <div>
            <p className="font-semibold">Success!</p>
            <p className="text-sm text-emerald-700">
              {academy ? 'Your academy has been updated successfully!' : 'Your academy has been created successfully!'}
            </p>
          </div>
          <button
            onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.delete('success');
              window.history.replaceState({}, '', url.toString());
              window.location.reload();
            }}
            className="ml-auto text-emerald-600 hover:text-emerald-800 text-sm font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 🗑️ Deleted Message */}
      {deleted && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 shadow-sm">
          <svg className="h-6 w-6 text-rose-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <div>
            <p className="font-semibold">Deleted!</p>
            <p className="text-sm text-rose-700">Your academy has been deleted.</p>
          </div>
          <button
            onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.delete('deleted');
              window.history.replaceState({}, '', url.toString());
              window.location.reload();
            }}
            className="ml-auto text-rose-600 hover:text-rose-800 text-sm font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Owner Dashboard Content */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-800">
            🎯 Owner Dashboard
          </h1>
          <p className="text-slate-500 mt-1 text-sm lg:text-base">
            Manage your Islamic academy, teachers, and student inquiries
          </p>
        </div>
        {!academy && (
          <Link
            href="/owner/academy"
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/40 transition-all duration-200 whitespace-nowrap"
          >
            <PlusCircleIcon className="h-5 w-5" />
            Create Academy
          </Link>
        )}
      </div>

      {/* Academy Summary */}
      {!academy ? (
        <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-emerald-200 shadow-sm">
          <div className="text-6xl mb-4">🏛️</div>
          <h3 className="text-2xl font-bold text-slate-800">No Academy Yet</h3>
          <p className="text-slate-500 mt-2 max-w-md mx-auto">
            You haven't created an academy yet. Start by creating your Islamic academy and inviting teachers.
          </p>
          <Link
            href="/owner/academy"
            className="inline-block mt-6 px-8 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-semibold rounded-2xl shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/40 transition"
          >
            + Create Your Academy
          </Link>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200 hover:border-emerald-200 group">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 rounded-xl group-hover:bg-emerald-200 transition">
                  <BuildingOfficeIcon className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Your Academy</p>
                  <p className="text-xl font-bold text-slate-800 truncate">{academy.name}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="text-xs px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full font-medium">
                  Active
                </span>
                <Link
                  href="/owner/academy"
                  className="text-xs text-emerald-600 hover:underline font-medium"
                >
                  Edit →
                </Link>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200 hover:border-blue-200 group">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition">
                  <UserGroupIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Teachers</p>
                  <p className="text-xl font-bold text-slate-800">{teacherCount}</p>
                </div>
              </div>
              <Link
                href="/owner/teachers"
                className="mt-3 text-sm text-indigo-600 hover:underline font-medium inline-block"
              >
                Manage Teachers →
              </Link>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200 hover:border-amber-200 group">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-100 rounded-xl group-hover:bg-amber-200 transition">
                  <EnvelopeIcon className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Inquiries</p>
                  <p className="text-xl font-bold text-slate-800">
                    {inquiries.filter((i: any) => i.status === 'pending').length}
                  </p>
                </div>
              </div>
              <Link
                href="/owner/inquiries"
                className="mt-3 text-sm text-amber-600 hover:underline font-medium inline-block"
              >
                View All →
              </Link>
            </div>
          </div>

          {/* Recent Inquiries */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <h2 className="font-semibold text-slate-800">📬 Recent Inquiries</h2>
              {inquiries.length > 0 && (
                <Link href="/owner/inquiries" className="text-sm text-emerald-600 hover:underline font-medium">
                  View all →
                </Link>
              )}
            </div>
            {inquiries.length > 0 ? (
              <ul className="divide-y divide-slate-100">
                {inquiries.slice(0, 5).map((inquiry: any) => (
                  <li key={inquiry._id} className="p-5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800">{inquiry.visitorName}</p>
                      <p className="text-sm text-slate-500 truncate">{inquiry.message}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(inquiry.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap ${
                      inquiry.status === 'pending'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {inquiry.status}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-8 text-center text-slate-400">No inquiries yet.</p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/owner/academy"
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:shadow-lg transition-all duration-200 flex items-center gap-4 group hover:border-emerald-200"
            >
              <div className="p-2.5 bg-emerald-100 rounded-xl group-hover:bg-emerald-200 transition">
                <BuildingOfficeIcon className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Edit Academy</h3>
                <p className="text-sm text-slate-500">Update your academy details</p>
              </div>
            </Link>

            <Link
              href="/owner/teachers"
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:shadow-lg transition-all duration-200 flex items-center gap-4 group hover:border-blue-200"
            >
              <div className="p-2.5 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition">
                <UserGroupIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Manage Teachers</h3>
                <p className="text-sm text-slate-500">Add or remove teachers</p>
              </div>
            </Link>

            <Link
              href="/owner/inquiries"
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:shadow-lg transition-all duration-200 flex items-center gap-4 group hover:border-amber-200"
            >
              <div className="p-2.5 bg-amber-100 rounded-xl group-hover:bg-amber-200 transition">
                <EnvelopeIcon className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">View Inquiries</h3>
                <p className="text-sm text-slate-500">Check all messages</p>
              </div>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}