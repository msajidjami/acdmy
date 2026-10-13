import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/dbConnect';
import { getUserFromToken } from '@/app/lib/auth/getUserFromToken';
import User from '@/models/User';
import Academy from '@/models/Academy';
import Teacher from '@/models/Teacher';
import Student from '@/models/Student';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Dashboard = {
  id: 'admin' | 'owner' | 'teacher' | 'student' | 'user';
  label: string;
  href: string;
  color: string;
};

export async function GET() {
  try {
    const me = await getUserFromToken();
    if (!me) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const user: any = await User.findById(me.id)
      .select('name email phone role')
      .lean();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const dashboards: Dashboard[] = [];

    /* ✅ Admin */
    if (user.role === 'admin') {
      dashboards.push({
        id: 'admin',
        label: 'Admin Dashboard',
        href: '/admin/dashboard',
        color: 'rose',
      });
    }

    /* ✅ Owner (Academy موجود ہے) */
    const academy = await Academy.findOne({ ownerId: user._id })
      .select('_id name')
      .lean();

    if (academy) {
      dashboards.push({
        id: 'owner',
        label: 'Owner Dashboard',
        href: '/owner/dashboard',
        color: 'emerald',
      });
    }

    /* ✅ Teacher */
    if (user.email || user.phone) {
      const or: any[] = [];
      if (user.email) or.push({ email: String(user.email).toLowerCase() });
      if (user.phone) or.push({ phone: user.phone });
      if (user._id) or.push({ userId: user._id });

      if (or.length > 0) {
        const teacher = await Teacher.findOne({ $or: or })
          .select('_id')
          .lean();

        if (teacher) {
          dashboards.push({
            id: 'teacher',
            label: 'Teacher Dashboard',
            href: '/teacher/dashboard',
            color: 'sky',
          });
        }

        /* ✅ Student */
        const student = await Student.findOne({ $or: or })
          .select('_id')
          .lean();

        if (student) {
          dashboards.push({
            id: 'student',
            label: 'Student Dashboard',
            href: '/student/dashboard',
            color: 'violet',
          });
        }
      }
    }

    /* ✅ Regular user (کوئی خاص role نہیں) */
    if (dashboards.length === 0) {
      dashboards.push({
        id: 'user',
        label: 'My Dashboard',
        href: '/user/dashboard',
        color: 'slate',
      });
    }

    return NextResponse.json({
      success: true,
      dashboards,
      current: user.role || 'user',
    });
  } catch (err: any) {
    console.error('[user/dashboards GET]', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Server error' },
      { status: 500 }
    );
  }
}