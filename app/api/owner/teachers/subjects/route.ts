import { NextResponse, NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/app/lib/dbConnect';
import Academy from '@/models/Academy';
import Course from '@/models/Course';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET;

/* ============================================================
   GET — Academy کی تمام subjects (category + title + name)
   ============================================================ */

export async function GET(req: NextRequest) {
  try {
    /* ---------- Auth ---------- */
    const token = req.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!JWT_SECRET) {
      console.error('JWT_SECRET is not configured');
      return NextResponse.json(
        { error: 'Server misconfigured' },
        { status: 500 }
      );
    }

    let decoded: { userId: string };
    try {
      const result = jwt.verify(token, JWT_SECRET);
      if (typeof result === 'string') throw new Error('Invalid');
      decoded = result as { userId: string };
    } catch {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    await connectDB();

    /* ---------- User ---------- */
    const user = await User.findById(decoded.userId)
      .select('-password')
      .lean();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    /* ---------- Academy ---------- */
    const academy = await Academy.findOne({ ownerId: user._id })
      .select('_id')
      .lean();

    if (!academy) {
      return NextResponse.json(
        { error: 'No academy found' },
        { status: 404 }
      );
    }

    /* ------------------------------------------------------------
       ✅ FIXED: category + title + name — سب سے subjects بنائیں
       
       یہ یقینی بناتا ہے کہ:
       - اگر course میں category ہے → وہ شامل
       - اگر title ہے → وہ شامل
       - اگر name ہے → وہ شامل
       - تمام courses کی ہر ممکن unique value
       ------------------------------------------------------------ */
    const courses = await Course.find({ academyId: academy._id })
      .select('category title name subjects')
      .lean();

    const subjectSet = new Set<string>();

    courses.forEach((c: any) => {
      // Category field
      const cat = String(c.category || '').trim();
      if (cat) subjectSet.add(cat);

      // Title field
      const title = String(c.title || '').trim();
      if (title) subjectSet.add(title);

      // Name field (alternative to title)
      const name = String(c.name || '').trim();
      if (name) subjectSet.add(name);

      // Subjects array (if course has its own subjects list)
      if (Array.isArray(c.subjects)) {
        c.subjects.forEach((s: any) => {
          const sub = String(s || '').trim();
          if (sub) subjectSet.add(sub);
        });
      }
    });

    const subjects = Array.from(subjectSet).sort((a, b) =>
      a.localeCompare(b)
    );

    console.log(
      `[subjects] Found ${subjects.length} subjects for academy ${academy._id}`
    );

    return NextResponse.json({ subjects });
  } catch (error) {
    console.error('GET /api/owner/teachers/subjects error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}