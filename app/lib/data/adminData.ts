// app/lib/data/adminData.ts
import connectDB from '../dbConnect';
import User from '@/models/User';
import Teacher from '@/models/Teacher';
import Course from '@/models/Course';
import Admission from '@/models/Admission';
import Payment from '@/models/Payment';
import Article from '@/models/Article';
import Review from '@/models/Review';
import Activity from '@/models/Activity';

export async function fetchAdminData() {
  await connectDB();

  // Get stats with proper field names
  const [
    totalStudents,
    totalTeachers,
    totalCourses,
    totalAdmissions,
    pendingAdmissions,
    activeClasses,
    revenue,
    totalArticles,
    totalReviews,
  ] = await Promise.all([
    User.countDocuments({ role: 'student' } as any),
    Teacher.countDocuments({ active: true } as any), // ✅ Teacher schema uses 'active', not 'isActive'
    Course.countDocuments({ isActive: true } as any),
    Admission.countDocuments({}),
    Admission.countDocuments({ currentStatus: 'pending' } as any),
    Course.countDocuments({ isActive: true } as any),
    Payment.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
    Article.countDocuments({ published: true } as any),
    Review.countDocuments({ isApproved: true } as any),
  ]);

  // Recent admissions
  const recentAdmissions = await Admission.find()
    .populate('studentId', 'name')
    .populate('courseId', 'title')
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  // Recent students
  const recentStudents = await User.find({ role: 'student' } as any)
    .select('name email createdAt')
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  // ✅ Recent teachers - براہِ راست Teacher سے ڈیٹا لیں (کیونکہ userId نہیں ہے)
  const recentTeachers = await Teacher.find()
    .select('fullName email qualification subjects createdAt')
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  // Recent payments
  const recentPayments = await Payment.find()
    .populate('studentId', 'name')
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  // Monthly admissions (last 6 months)
  const monthlyAdmissions = await Admission.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 5)) },
      },
    },
    {
      $group: {
        _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
    { $limit: 6 },
  ]).then((res) =>
    res.map((item) => ({
      month: new Date(item._id.year, item._id.month - 1, 1).toLocaleString('default', { month: 'short' }),
      count: item.count,
    }))
  );

  // Monthly revenue
  const monthlyRevenue = await Payment.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 5)) },
        status: 'Completed',
      },
    },
    {
      $group: {
        _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
        total: { $sum: '$amount' },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
    { $limit: 6 },
  ]).then((res) =>
    res.map((item) => ({
      month: new Date(item._id.year, item._id.month - 1, 1).toLocaleString('default', { month: 'short' }),
      amount: item.total,
    }))
  );

  // Latest activities
  const latestActivities = await Activity.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  // Format data
  return {
    stats: {
      totalStudents,
      totalTeachers,
      totalCourses,
      totalAdmissions,
      pendingAdmissions,
      activeClasses,
      revenue: revenue[0]?.total || 0,
      totalArticles,
      totalReviews,
    },
    recentAdmissions: recentAdmissions.map((a: any) => ({
      id: a._id.toString(),
      studentName: a.studentId?.name || 'Unknown',
      course: a.courseId?.title || 'Unknown',
      date: a.createdAt.toISOString().split('T')[0],
      status: a.currentStatus || 'Pending',
    })),
    recentStudents: recentStudents.map((s: any) => ({
      id: s._id.toString(),
      name: s.name,
      email: s.email,
      joined: s.createdAt.toISOString().split('T')[0],
    })),
    recentTeachers: recentTeachers.map((t: any) => ({
      id: t._id.toString(),
      name: t.fullName || t.name || 'Unknown',
      subject: t.qualification || (t.subjects && t.subjects.length > 0 ? t.subjects[0] : 'General'),
      joined: t.createdAt?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
    })),
    recentPayments: recentPayments.map((p: any) => ({
      id: p._id.toString(),
      student: p.studentId?.name || 'Unknown',
      amount: p.amount,
      date: p.createdAt.toISOString().split('T')[0],
      status: p.status || 'Pending',
    })),
    monthlyAdmissions: monthlyAdmissions.length ? monthlyAdmissions : [
      { month: 'Jan', count: 12 },
      { month: 'Feb', count: 19 },
      { month: 'Mar', count: 15 },
      { month: 'Apr', count: 22 },
      { month: 'May', count: 28 },
      { month: 'Jun', count: 24 },
    ],
    monthlyRevenue: monthlyRevenue.length ? monthlyRevenue : [
      { month: 'Jan', amount: 1200 },
      { month: 'Feb', amount: 1900 },
      { month: 'Mar', amount: 1500 },
      { month: 'Apr', amount: 2200 },
      { month: 'May', amount: 2800 },
      { month: 'Jun', amount: 2400 },
    ],
    latestActivities: latestActivities.map((act: any) => ({
      id: act._id.toString(),
      user: act.userName || 'System',
      action: act.action,
      date: act.createdAt.toISOString().split('T')[0],
      status: act.status || 'Completed',
    })),
  };
}