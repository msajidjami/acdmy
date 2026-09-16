// app/lib/data/userDashboardData.ts
import connectDB from '../dbConnect';
import User from '@/models/User';
import Inquiry from '@/models/Inquiry';
import Academy from '@/models/Academy';
import Course from '@/models/Course';
import Enrollment from '@/models/Enrollment';
import EnrollmentMessage from '@/models/EnrollmentMessage';

/* ============================================================
   TYPES
   ============================================================ */

export type UserInquiry = {
  _id: string;
  academyName: string;
  academySlug: string;
  subject: string;
  message: string;
  status: 'pending' | 'replied' | 'closed';
  createdAt: string;
};

export type EnrollmentConversation = {
  _id: string;
  courseId: string;
  courseTitle: string;
  academyId: string;
  academyName: string;
  academySlug: string;
  academyLogo: string;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'cancelled';
  unreadCount: number;
  lastMessage: {
    content: string;
    senderRole: 'owner' | 'user' | 'system';
    createdAt: string;
  } | null;
  createdAt: string;
};

export type FeaturedAcademy = {
  _id: string;
  name: string;
  slug: string;
  logo: string;
  description: string;
  city: string;
  country: string;
  totalCourses: number;
};

export type UserDashboardData = {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar: string;
    createdAt: string;
  };
  stats: {
    totalInquiries: number;
    pendingInquiries: number;
    totalEnrollments: number;
    pendingEnrollments: number;
    unreadMessages: number;
  };
  recentInquiries: UserInquiry[];
  enrollments: EnrollmentConversation[];
  featuredAcademies: FeaturedAcademy[];
};

/* ============================================================
   MAIN
   ============================================================ */

export async function fetchUserDashboardData(
  userId: string
): Promise<UserDashboardData | null> {
  await connectDB();

  /* ---------- 1. User ---------- */
  const user = await User.findById(userId).select('-password').lean();
  if (!user) return null;

  const email = String((user as any).email || '').trim().toLowerCase();

  /* ---------- 2. Inquiries ---------- */
  const inquiries = await Inquiry.find({
    $or: [{ userId }, { email }],
  })
    .populate({ path: 'academyId', model: Academy, select: 'name slug' })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  const totalInquiries = await Inquiry.countDocuments({
    $or: [{ userId }, { email }],
  });

  const pendingInquiries = await Inquiry.countDocuments({
    $or: [{ userId }, { email }],
    status: 'pending',
  });

  /* ---------- 3. Enrollments + last message + unread count ---------- */
  const enrollmentDocs = await Enrollment.find({
    $or: [{ userId }, { email }],
  })
    .populate({ path: 'courseId', model: Course, select: 'title' })
    .populate({ path: 'academyId', model: Academy, select: 'name slug logo' })
    .sort({ updatedAt: -1 })
    .limit(50)
    .lean();

  /* Unread counts per enrollment */
  const enrollmentIds = enrollmentDocs.map((e: any) => e._id);
  const unreadCounts = enrollmentIds.length
    ? await EnrollmentMessage.aggregate([
        {
          $match: {
            enrollmentId: { $in: enrollmentIds },
            senderRole: 'owner',
            readByUser: false,
          },
        },
        {
          $group: {
            _id: '$enrollmentId',
            count: { $sum: 1 },
          },
        },
      ])
    : [];

  const unreadMap = new Map<string, number>(
    unreadCounts.map((u: any) => [String(u._id), u.count])
  );

  /* Last message per enrollment */
  const lastMessages = await Promise.all(
    enrollmentIds.map(async (id: any) => {
      const msg = await EnrollmentMessage.findOne({ enrollmentId: id })
        .sort({ createdAt: -1 })
        .select('content senderRole createdAt')
        .lean();
      return { id: String(id), msg };
    })
  );

  const lastMsgMap = new Map<
    string,
    { content: string; senderRole: 'owner' | 'user' | 'system'; createdAt: string }
  >();

  for (const { id, msg } of lastMessages) {
    if (msg) {
      lastMsgMap.set(id, {
        content: String((msg as any).content || '').slice(0, 120),
        senderRole: (msg as any).senderRole || 'system',
        createdAt: (msg as any).createdAt
          ? new Date((msg as any).createdAt).toISOString()
          : new Date().toISOString(),
      });
    }
  }

  const enrollments: EnrollmentConversation[] = enrollmentDocs.map((e: any) => {
    const id = String(e._id);
    const acad = e.academyId;
    const crs = e.courseId;

    return {
      _id: id,
      courseId: crs ? String(crs._id) : '',
      courseTitle: crs?.title || 'Course',
      academyId: acad ? String(acad._id) : '',
      academyName: acad?.name || 'Academy',
      academySlug: acad?.slug || '',
      academyLogo: acad?.logo || '',
      status: (e.status as EnrollmentConversation['status']) || 'pending',
      unreadCount: unreadMap.get(id) || 0,
      lastMessage: lastMsgMap.get(id) || null,
      createdAt: e.createdAt
        ? new Date(e.createdAt).toISOString()
        : new Date().toISOString(),
    };
  });

  const totalUnread = enrollments.reduce((s, e) => s + e.unreadCount, 0);

  /* ---------- 4. Featured Academies ---------- */
  const featuredAcademiesRaw = await Academy.find({
    isActive: { $ne: false },
  })
    .sort({ createdAt: -1 })
    .limit(6)
    .select('_id name slug logo description city country')
    .lean();

  const featuredAcademies: FeaturedAcademy[] = await Promise.all(
    featuredAcademiesRaw.map(async (a: any) => {
      const totalCourses = await Course.countDocuments({ academyId: a._id });
      return {
        _id: String(a._id),
        name: String(a.name || ''),
        slug: String(a.slug || ''),
        logo: String(a.logo || ''),
        description: String(a.description || '').slice(0, 100),
        city: String(a.city || ''),
        country: String(a.country || ''),
        totalCourses,
      };
    })
  );

  /* ---------- 5. Return ---------- */
  return {
    user: {
      id: String((user as any)._id),
      name: String((user as any).name || ''),
      email,
      role: String((user as any).role || 'user'),
      avatar: String((user as any).avatar || ''),
      createdAt: (user as any).createdAt
        ? new Date((user as any).createdAt).toISOString()
        : new Date().toISOString(),
    },
    stats: {
      totalInquiries,
      pendingInquiries,
      totalEnrollments: enrollments.length,
      pendingEnrollments: enrollments.filter((e) => e.status === 'pending')
        .length,
      unreadMessages: totalUnread,
    },
    recentInquiries: inquiries.map((i: any) => ({
      _id: String(i._id),
      academyName: i.academyId?.name || 'Academy',
      academySlug: i.academyId?.slug || '',
      subject: String(i.subject || 'No subject'),
      message: String(i.message || '').slice(0, 120),
      status: (i.status as UserInquiry['status']) || 'pending',
      createdAt: i.createdAt
        ? new Date(i.createdAt).toISOString()
        : new Date().toISOString(),
    })),
    enrollments,
    featuredAcademies,
  };
}