import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import connectDB from '@/app/lib/dbConnect';
import User from '@/app/models/User';
import Teacher from '@/app/models/Teacher';
import Class from '@/app/models/Class';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const teacherUserId = decoded.userId || decoded.id || decoded._id;
    if (!teacherUserId) {
      return NextResponse.json({ error: 'Teacher User ID not found in token' }, { status: 400 });
    }

    console.log('🔍 Teacher User ID from token:', teacherUserId);

    await connectDB();

    // ✅ 1. Teacher کا User حاصل کریں (email کے لیے)
    const teacherUser = await User.findById(teacherUserId).select('email');
    if (!teacherUser) {
      return NextResponse.json({ error: 'Teacher user not found' }, { status: 404 });
    }

    // ✅ 2. Teacher ماڈل سے Teacher کا _id حاصل کریں (email کے ذریعے)
    const teacher = await Teacher.findOne({ email: teacherUser.email, active: true })
      .select('_id')
      .lean();

    if (!teacher) {
      console.warn('⚠️ Teacher record not found in Teacher model for email:', teacherUser.email);
      // اگر ٹیچر ریکارڈ نہیں تو پھر بھی کلاسز سے طلباء تلاش کریں (اگر کوئی ہیں)
      // لیکن اس صورت میں ہم صرف کلاسز سے طلباء لیں گے
      const classStudents = await Class.distinct('student', {
        teacher: new mongoose.Types.ObjectId(teacherUserId),
      });
      console.log(`📚 Students from classes (using User ID): ${classStudents.length}`);
      if (classStudents.length === 0) {
        return NextResponse.json({ students: [], debug: { teacherUserId, teacherNotFound: true } });
      }
      const allStudents = await User.find({
        _id: { $in: classStudents },
        role: 'user',
      }).select('_id name email phone avatar').lean();
      const serialized = allStudents.map((s: any) => ({
        _id: s._id.toString(),
        name: s.name || 'Unknown',
        email: s.email || '',
        phone: s.phone || '',
        avatar: s.avatar || '',
      }));
      return NextResponse.json({ students: serialized });
    }

    const teacherObjectId = teacher._id;
    console.log('✅ Found Teacher _id:', teacherObjectId);

    // ✅ 3. اب اس Teacher _id کے ذریعے طلباء تلاش کریں
    const assignedStudents = await User.find({
      assignedTeacher: teacherObjectId,
      role: 'user',
    })
      .select('_id name email phone avatar')
      .lean();

    console.log(`👨‍🎓 Directly assigned students: ${assignedStudents.length}`);

    // ✅ 4. کلاسز کے ذریعے بھی تلاش کریں (اگر کوئی طالب علم براہِ راست اسائن نہیں)
    const classStudents = await Class.distinct('student', {
      teacher: teacherObjectId,
    });

    console.log(`📚 Students from classes: ${classStudents.length}`);

    // دونوں سیٹس کو ملا دیں
    const studentIds = new Set<string>();
    assignedStudents.forEach(s => studentIds.add(s._id.toString()));
    classStudents.forEach(id => studentIds.add(id.toString()));

    console.log(`🔄 Total unique student IDs: ${studentIds.size}`);

    if (studentIds.size === 0) {
      return NextResponse.json({
        students: [],
        debug: {
          teacherUserId,
          teacherObjectId: teacherObjectId.toString(),
          assignedCount: assignedStudents.length,
          classCount: classStudents.length,
        },
      });
    }

    const allStudents = await User.find({
      _id: { $in: Array.from(studentIds) },
      role: 'user',
    })
      .select('_id name email phone avatar')
      .lean();

    const serialized = allStudents.map((s: any) => ({
      _id: s._id.toString(),
      name: s.name || 'Unknown',
      email: s.email || '',
      phone: s.phone || '',
      avatar: s.avatar || '',
    }));

    console.log(`✅ Final students count: ${serialized.length}`);

    return NextResponse.json({ students: serialized });
  } catch (error) {
    console.error('Error fetching teacher students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}