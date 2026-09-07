import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';

export default async function RootPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  // اگر ٹوکن نہیں ہے تو پبلک ہوم پیج دکھائیں
  if (!token) {
    const { default: HomePage } = await import('./(public)/page');
    return <HomePage />;
  }

  // ٹوکن کو ڈی کوڈ کریں
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const role = decoded.role;

    // کردار کے مطابق ری ڈائریکٹ
    if (role === 'admin') {
      redirect('/admin');
    } else if (role === 'owner') {
      redirect('/owner/dashboard');
    } else if (role === 'teacher') {
      redirect('/teacher/dashboard');
    } else if (role === 'student') {
      redirect('/student/dashboard');
    } else {
      redirect('/dashboard');
    }
  } catch (error) {
    // غلط ٹوکن - پبلک پیج دکھائیں
    const { default: HomePage } = await import('./(public)/page');
    return <HomePage />;
  }
}