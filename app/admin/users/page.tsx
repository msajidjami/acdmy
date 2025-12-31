// app/admin/users/page.tsx - مکمل درست شدہ (کوئی ایرر نہیں آئے گا)

import dbConnect from '@/app/lib/dbConnect';
import User from '@/app/models/User';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const JWT_SECRET = process.env.JWT_SECRET || 'G3NQE3QHMqYQQ6KwNNlE1dk4MBSSqK3lqtRMyAZPF6JK9YpjSuwD42OpN+PMYZ5W';

interface AuthTokenPayload {
  userId: string;
  email: string;
  role: string;
}

async function getCurrentUser() {
  // cookies() کو await کریں
  const cookieStore = await cookies();
  const token = cookieStore.get('authToken')?.value;

  if (!token) return null;

  try {
    return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
  } catch (error) {
    console.error('JWT Verify Error:', error);
    return null;
  }
}

export default async function AdminUsersPage() {
  await dbConnect();

  const currentUser = await getCurrentUser();

  // اگر لاگ ان نہیں یا admin نہیں تو login پر redirect
  if (!currentUser || currentUser.role !== 'admin') {
    redirect('/login');
  }

  // تمام یوزرز لوڈ کریں
  const users = await User.find({})
    .select('name email role createdAt')
    .sort({ createdAt: -1 })
    .lean();

  return (
    <div className="p-8 bg-gray-50 min-h-screen" dir="rtl">
      <h1 className="text-3xl font-bold mb-8 text-center">ایڈمن پینل - تمام رجسٹرڈ یوزرز</h1>

      {users.length === 0 ? (
        <div className="text-center text-gray-600 text-xl mt-10">کوئی یوزر ابھی تک رجسٹر نہیں ہوا</div>
      ) : (
        <div className="overflow-x-auto shadow-lg rounded-lg">
          <table className="w-full border-collapse bg-white">
            <thead>
              <tr className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
                <th className="border border-gray-300 px-6 py-4 text-right font-bold">نام</th>
                <th className="border border-gray-300 px-6 py-4 text-right font-bold">جی میل</th>
                <th className="border border-gray-300 px-6 py-4 text-right font-bold">حیثیت</th>
                <th className="border border-gray-300 px-6 py-4 text-right font-bold">رجسٹریشن کی تاریخ</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user: any) => (
                <tr key={user._id.toString()} className="hover:bg-gray-50 transition-colors">
                  <td className="border border-gray-300 px-6 py-4">{user.name || '-'}</td>
                  <td className="border border-gray-300 px-6 py-4 text-blue-600">{user.email}</td>
                  <td className="border border-gray-300 px-6 py-4 text-center">
                    <span className={`inline-block px-4 py-2 rounded-full text-white font-semibold text-sm ${
                      user.role === 'admin' ? 'bg-red-600' : 'bg-green-600'
                    }`}>
                      {user.role === 'admin' ? 'ایڈمن' : 'یوزر'}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-6 py-4 text-sm text-gray-600">
                    {new Date(user.createdAt).toLocaleDateString('ur-PK', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}