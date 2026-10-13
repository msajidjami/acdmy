import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/dbConnect';
import User from '@/models/User';
import Teacher from '@/models/Teacher';
import Student from '@/models/Student';
import Academy from '@/models/Academy';
import { getUserFromToken } from '@/app/lib/auth/getUserFromToken';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_ROLES = ['admin', 'owner', 'teacher', 'student', 'user'] as const;
type Role = (typeof VALID_ROLES)[number];

/* ============================================================
   Normalize a User document
   ============================================================ */
function normalizeUser(u: any, role: Role) {
  const isOnline =
    u.isOnline === true &&
    u.lastSeen &&
    Date.now() - new Date(u.lastSeen).getTime() < 2 * 60 * 1000;

  return {
    _id: String(u._id),
    name: String(u.name || ''),
    email: String(u.email || ''),
    phone: String(u.phone || ''),
    role,
    avatar: String(u.avatar || ''),
    isVerified: Boolean(u.isVerified),
    provider: String(u.provider || 'credentials'),
    isOnline: Boolean(isOnline),
    lastSeen: u.lastSeen ? new Date(u.lastSeen).toISOString() : null,
    loginCount: Number(u.loginCount || 0),
    createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : null,
    /* extra fields for students/teachers */
    fatherName: String(u.fatherName || ''),
    academyName: String(u.academyName || ''),
    subjects: Array.isArray(u.subjects) ? u.subjects.map(String) : [],
    source: 'user' as const,
  };
}

/* ============================================================
   Normalize a Student document
   ============================================================ */
function normalizeStudent(s: any, academyName: string) {
  return {
    _id: String(s._id),
    name: String(s.name || ''),
    email: String(s.email || ''),
    phone: String(s.phone || ''),
    role: 'student' as const,
    avatar: String(s.avatar || ''),
    isVerified: Boolean(s.isVerified),
    provider: String(s.provider || 'manual'),
    isOnline: false,
    lastSeen: s.updatedAt ? new Date(s.updatedAt).toISOString() : null,
    loginCount: 0,
    createdAt: s.createdAt ? new Date(s.createdAt).toISOString() : null,
    fatherName: String(s.fatherName || ''),
    academyName: String(academyName || ''),
    subjects: [],
    source: 'student' as const,
  };
}

/* ============================================================
   Normalize a Teacher document
   ============================================================ */
function normalizeTeacher(t: any, academyName: string) {
  return {
    _id: String(t._id),
    name: String(t.name || ''),
    email: String(t.email || ''),
    phone: String(t.phone || ''),
    role: 'teacher' as const,
    avatar: String(t.avatar || ''),
    isVerified: Boolean(t.isVerified),
    provider: 'manual',
    isOnline: false,
    lastSeen: t.updatedAt ? new Date(t.updatedAt).toISOString() : null,
    loginCount: 0,
    createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : null,
    fatherName: '',
    academyName: String(academyName || ''),
    subjects: Array.isArray(t.subjects) ? t.subjects.map(String) : [],
    source: 'teacher' as const,
  };
}

/* ============================================================
   GET — list users by role
   Query: q, role, page, limit
   ============================================================ */
export async function GET(req: NextRequest) {
  try {
    const me = await getUserFromToken();
    if (!me) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const meDoc: any = await User.findById(me.id).select('role').lean();
    if (!meDoc || meDoc.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: admin only' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    const roleParam = (searchParams.get('role') || '').trim() as Role | '';
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const limit = Math.min(
      100,
      Math.max(5, Number(searchParams.get('limit') || 20))
    );

    const skip = (page - 1) * limit;

    /* ------------------------------------------------------------
       Search filter builder
       ------------------------------------------------------------ */
    const buildSearch = (): any => {
      if (!q) return {};
      return {
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } },
          { phone: { $regex: q, $options: 'i' } },
        ],
      };
    };

    /* ============================================================
       Counts (for tabs)
       ============================================================ */
    const [adminCount, ownerCount, teacherCount, studentCount, userCount] =
      await Promise.all([
        User.countDocuments({ role: 'admin' }),
        User.countDocuments({ role: 'owner' }),
        Teacher.countDocuments(),
        Student.countDocuments(),
        User.countDocuments({ role: 'user' }),
      ]);

    const counts = {
      all: adminCount + ownerCount + teacherCount + studentCount + userCount,
      admin: adminCount,
      owner: ownerCount,
      teacher: teacherCount,
      student: studentCount,
      user: userCount,
    };

    /* ============================================================
       Fetch by role
       ============================================================ */

    /* ---------- STUDENTS (from Student model) ---------- */
    if (roleParam === 'student') {
      const search = buildSearch();

      const [students, total] = await Promise.all([
        Student.find(search)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Student.countDocuments(search),
      ]);

      /* Enrich with academy names */
      const academyIds = [
        ...new Set(
          students
            .map((s: any) => s.academyId)
            .filter(Boolean)
            .map(String)
        ),
      ];

      const academies: any[] = academyIds.length
        ? await Academy.find({ _id: { $in: academyIds } })
            .select('name')
            .lean()
        : [];

      const acMap = new Map(
        academies.map((a: any) => [String(a._id), String(a.name || '')])
      );

      const result = students.map((s: any) =>
        normalizeStudent(s, acMap.get(String(s.academyId)) || '')
      );

      return NextResponse.json({
        success: true,
        users: result,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit) || 1,
        },
        counts,
      });
    }

    /* ---------- TEACHERS (from Teacher model) ---------- */
    if (roleParam === 'teacher') {
      const search = buildSearch();

      const [teachers, total] = await Promise.all([
        Teacher.find(search)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Teacher.countDocuments(search),
      ]);

      const academyIds = [
        ...new Set(
          teachers
            .map((t: any) => t.academyId)
            .filter(Boolean)
            .map(String)
        ),
      ];

      const academies: any[] = academyIds.length
        ? await Academy.find({ _id: { $in: academyIds } })
            .select('name')
            .lean()
        : [];

      const acMap = new Map(
        academies.map((a: any) => [String(a._id), String(a.name || '')])
      );

      const result = teachers.map((t: any) =>
        normalizeTeacher(t, acMap.get(String(t.academyId)) || '')
      );

      return NextResponse.json({
        success: true,
        users: result,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit) || 1,
        },
        counts,
      });
    }

    /* ---------- ADMIN / OWNER / USER (from User model) ---------- */
    if (roleParam === 'admin' || roleParam === 'owner' || roleParam === 'user') {
      const search = { ...buildSearch(), role: roleParam };

      const [users, total] = await Promise.all([
        User.find(search)
          .select(
            'name email phone role avatar isVerified provider isOnline lastSeen loginCount createdAt'
          )
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        User.countDocuments(search),
      ]);

      const result = users.map((u: any) => normalizeUser(u, roleParam));

      return NextResponse.json({
        success: true,
        users: result,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit) || 1,
        },
        counts,
      });
    }

    /* ---------- ALL (only User collection) ---------- */
    const search = buildSearch();

    const [users, total] = await Promise.all([
      User.find(search)
        .select(
          'name email phone role avatar isVerified provider isOnline lastSeen loginCount createdAt'
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(search),
    ]);

    const result = users.map((u: any) =>
      normalizeUser(u, (u.role as Role) || 'user')
    );

    return NextResponse.json({
      success: true,
      users: result,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
      counts,
    });
  } catch (err: any) {
    console.error('[admin/users GET]', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Server error' },
      { status: 500 }
    );
  }
}

/* ============================================================
   DELETE — admin can delete
   Body: { userId, type }
   ============================================================ */
export async function DELETE(req: NextRequest) {
  try {
    const me = await getUserFromToken();
    if (!me) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const meDoc: any = await User.findById(me.id).select('role').lean();
    if (!meDoc || meDoc.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: admin only' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { userId, type } = body || {};

    if (!userId || !/^[a-fA-F0-9]{24}$/.test(String(userId))) {
      return NextResponse.json(
        { success: false, error: 'Valid userId is required' },
        { status: 400 }
      );
    }

    if (String(userId) === String(me.id)) {
      return NextResponse.json(
        { success: false, error: 'You cannot delete your own account here' },
        { status: 400 }
      );
    }

    /* Delete from the right collection */
    if (type === 'student') {
      const d = await Student.findByIdAndDelete(userId).lean();
      if (!d) {
        return NextResponse.json(
          { success: false, error: 'Student not found' },
          { status: 404 }
        );
      }
    } else if (type === 'teacher') {
      const d = await Teacher.findByIdAndDelete(userId).lean();
      if (!d) {
        return NextResponse.json(
          { success: false, error: 'Teacher not found' },
          { status: 404 }
        );
      }
    } else {
      const d = await User.findByIdAndDelete(userId).lean();
      if (!d) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json({ success: true, userId });
  } catch (err: any) {
    console.error('[admin/users DELETE]', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Server error' },
      { status: 500 }
    );
  }
}