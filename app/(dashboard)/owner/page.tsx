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
    <div className="max-w-7xl mx-auto">
      {/* ✅ Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-3 text-green-800">
          <CheckCircleIcon className="h-6 w-6 text-green-600 flex-shrink-0" />
          <div>
            <p className="font-semibold">Success!</p>
            <p className="text-sm text-green-700">
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
            className="ml-auto text-green-600 hover:text-green-800 text-sm font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 🗑️ Deleted Message */}
      {deleted && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-800">
          <svg className="h-6 w-6 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <div>
            <p className="font-semibold">Deleted!</p>
            <p className="text-sm text-red-700">Your academy has been deleted.</p>
          </div>
          <button
            onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.delete('deleted');
              window.history.replaceState({}, '', url.toString());
              window.location.reload();
            }}
            className="ml-auto text-red-600 hover:text-red-800 text-sm font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Owner Dashboard Content */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-black">
            🎯 Owner Dashboard
          </h1>
          <p className="text-black/60 mt-1">
            Manage your Islamic academy, teachers, and student inquiries
          </p>
        </div>
        {!academy && (
          <Link
            href="/owner/academy"
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-green-600/20 transition"
          >
            <PlusCircleIcon className="h-5 w-5" />
            Create Academy
          </Link>
        )}
      </div>

      {/* Academy Summary */}
      {!academy ? (
        <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-green-200 shadow-sm">
          <div className="text-6xl mb-4">🏛️</div>
          <h3 className="text-2xl font-bold text-black">No Academy Yet</h3>
          <p className="text-black/60 mt-2 max-w-md mx-auto">
            You haven't created an academy yet. Start by creating your Islamic academy and inviting teachers.
          </p>
          <Link
            href="/owner/academy"
            className="inline-block mt-6 px-8 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-semibold rounded-2xl shadow-lg shadow-green-600/20 hover:shadow-green-600/40 transition"
          >
            + Create Your Academy
          </Link>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-black/5 hover:shadow-md transition">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-xl">
                  <BuildingOfficeIcon className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-black/60">Your Academy</p>
                  <p className="text-xl font-bold text-black truncate">{academy.name}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="text-xs px-2.5 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                  Active
                </span>
                <Link
                  href="/owner/academy"
                  className="text-xs text-green-600 hover:underline font-medium"
                >
                  Edit →
                </Link>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-black/5 hover:shadow-md transition">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <UserGroupIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-black/60">Teachers</p>
                  <p className="text-xl font-bold text-black">{teacherCount}</p>
                </div>
              </div>
              <Link
                href="/owner/teachers"
                className="mt-3 text-sm text-indigo-600 hover:underline font-medium inline-block"
              >
                Manage Teachers →
              </Link>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-black/5 hover:shadow-md transition">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-xl">
                  <EnvelopeIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-black/60">Inquiries</p>
                  <p className="text-xl font-bold text-black">
                    {inquiries.filter((i: any) => i.status === 'pending').length}
                  </p>
                </div>
              </div>
              <Link
                href="/owner/inquiries"
                className="mt-3 text-sm text-yellow-600 hover:underline font-medium inline-block"
              >
                View All →
              </Link>
            </div>
          </div>

          {/* Recent Inquiries */}
          <div className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden">
            <div className="p-5 border-b border-black/5 flex justify-between items-center">
              <h2 className="font-semibold text-black">📬 Recent Inquiries</h2>
              {inquiries.length > 0 && (
                <Link href="/owner/inquiries" className="text-sm text-green-600 hover:underline">
                  View all
                </Link>
              )}
            </div>
            {inquiries.length > 0 ? (
              <ul className="divide-y divide-black/5">
                {inquiries.slice(0, 5).map((inquiry: any) => (
                  <li key={inquiry._id} className="p-5 hover:bg-black/5 transition flex justify-between items-start">
                    <div>
                      <p className="font-medium text-black">{inquiry.visitorName}</p>
                      <p className="text-sm text-black/60 line-clamp-1">{inquiry.message}</p>
                      <p className="text-xs text-black/40 mt-1">
                        {new Date(inquiry.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      inquiry.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {inquiry.status}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-8 text-center text-black/40">No inquiries yet.</p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/owner/academy"
              className="bg-white p-5 rounded-2xl border border-black/5 hover:shadow-lg transition flex items-center gap-4 group"
            >
              <div className="p-2 bg-green-100 rounded-xl group-hover:bg-green-200 transition">
                <BuildingOfficeIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-black">Edit Academy</h3>
                <p className="text-sm text-black/60">Update your academy details</p>
              </div>
            </Link>

            <Link
              href="/owner/teachers"
              className="bg-white p-5 rounded-2xl border border-black/5 hover:shadow-lg transition flex items-center gap-4 group"
            >
              <div className="p-2 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition">
                <UserGroupIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-black">Manage Teachers</h3>
                <p className="text-sm text-black/60">Add or remove teachers</p>
              </div>
            </Link>

            <Link
              href="/owner/inquiries"
              className="bg-white p-5 rounded-2xl border border-black/5 hover:shadow-lg transition flex items-center gap-4 group"
            >
              <div className="p-2 bg-yellow-100 rounded-xl group-hover:bg-yellow-200 transition">
                <EnvelopeIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold text-black">View Inquiries</h3>
                <p className="text-sm text-black/60">Check all messages</p>
              </div>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}