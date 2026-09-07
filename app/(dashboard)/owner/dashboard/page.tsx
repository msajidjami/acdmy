import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import Link from 'next/link';
import connectDB from '@/app/lib/dbConnect';
import Academy from '@/models/Academy';
import Inquiry from '@/models/Inquiry';
import Teacher from '@/models/Teacher';
import AlertBanner from '@/app/components/AlertBanner';
import MessagesSection from '@/app/components/MessagesSection';
import {
  BuildingOfficeIcon,
  UserGroupIcon,
  EnvelopeIcon,
  PlusCircleIcon,
} from '@heroicons/react/24/outline';

async function getOwnerData(userId: string) {
  await connectDB();
  const academy = await Academy.findOne({ ownerId: userId });
  if (!academy) return { academy: null, inquiries: [], teacherCount: 0 };

  const inquiries = await Inquiry.find({ academyId: academy._id })
    .sort({ createdAt: -1 })
    .lean();

  const teacherCount = await Teacher.countDocuments({ academyId: academy._id });

  // ✅ inquiries کو سادہ آبجیکٹ میں تبدیل کریں (ObjectId, Date کو string میں)
  const serializedInquiries = inquiries.map((inquiry: any) => ({
    _id: inquiry._id.toString(),
    name: inquiry.name || '',
    email: inquiry.email || '',
    phone: inquiry.phone || '',
    message: inquiry.message || '',
    academyId: inquiry.academyId.toString(),
    status: inquiry.status || 'new',
    notes: inquiry.notes || '',
    createdAt: inquiry.createdAt ? new Date(inquiry.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: inquiry.updatedAt ? new Date(inquiry.updatedAt).toISOString() : new Date().toISOString(),
    repliedAt: inquiry.repliedAt ? new Date(inquiry.repliedAt).toISOString() : undefined,
    __v: inquiry.__v,
  }));

  return {
    academy: academy ? { ...academy.toObject(), _id: academy._id.toString() } : null,
    inquiries: serializedInquiries,
    teacherCount,
  };
}

interface SearchParams {
  success?: string;
  deleted?: string;
}

export default async function OwnerDashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const success = params.success === 'true';
  const deleted = params.deleted === 'true';

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

  return (
    <div className="max-w-7xl mx-auto">
      {/* Alert Banners */}
      {success && (
        <AlertBanner
          type="success"
          title="Success!"
          message={academy ? 'Your academy has been updated successfully!' : 'Your academy has been created successfully!'}
          onDismiss={() => {
            if (typeof window !== 'undefined') {
              const url = new URL(window.location.href);
              url.searchParams.delete('success');
              window.history.replaceState({}, '', url.toString());
              window.location.reload();
            }
          }}
        />
      )}
      {deleted && (
        <AlertBanner
          type="deleted"
          title="Deleted!"
          message="Your academy has been deleted."
          onDismiss={() => {
            if (typeof window !== 'undefined') {
              const url = new URL(window.location.href);
              url.searchParams.delete('deleted');
              window.history.replaceState({}, '', url.toString());
              window.location.reload();
            }
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-black">🎯 Owner Dashboard</h1>
          <p className="text-black/60 mt-1">
            Manage your Islamic academy, teachers, and student messages
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
                <div className="p-2 bg-purple-100 rounded-xl">
                  <EnvelopeIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-black/60">Total Messages</p>
                  <p className="text-xl font-bold text-black">{inquiries.length}</p>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {inquiries.filter((i: any) => i.status === 'new' || i.status === 'pending').length} new
              </p>
            </div>
          </div>

          {/* ✅ Messages Section (with toggle, delete, reply) */}
          <div className="mb-8">
            <MessagesSection
              initialInquiries={inquiries}
              academyId={academy._id}
            />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <h3 className="font-semibold text-black">All Messages</h3>
                <p className="text-sm text-black/60">View full list</p>
              </div>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}