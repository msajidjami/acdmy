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
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value; // ← یہاں 'token' درست ہے (authToken نہیں)

  if (!token) return null;

  try {
    return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
  } catch (error) {
    console.error('JWT Verify Error:', error);
    return null;
  }
}

// Server Action: یوزر ڈیلیٹ کریں
async function deleteUserAction(formData: FormData) {
  'use server';

  const userId = formData.get('userId') as string;

  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== 'admin') {
    throw new Error('اجازت نہیں ہے');
  }

  if (currentUser.userId === userId) {
    throw new Error('آپ خود کو ڈیلیٹ نہیں کر سکتے');
  }

  await User.findByIdAndDelete(userId);
}

export default async function AdminUsersPage() {
  await dbConnect();

  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== 'admin') {
    redirect('/login');
  }

  const users = await User.find({})
    .select('name email role createdAt')
    .sort({ createdAt: -1 })
    .lean();

  return (
    <div className="p-8 bg-gray-50 min-h-screen" dir="rtl">
      <h1 className="text-3xl font-bold mb-8 text-center text-blue-800">ایڈمن پینل - تمام یوزرز</h1>

      {users.length === 0 ? (
        <div className="text-center text-gray-600 text-xl mt-10">کوئی یوزر ابھی تک رجسٹر نہیں ہوا</div>
      ) : (
        <div className="overflow-x-auto shadow-xl rounded-lg">
          <table className="w-full border-collapse bg-white">
            <thead>
              <tr className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                <th className="border border-gray-300 px-6 py-4 text-right font-bold">نام</th>
                <th className="border border-gray-300 px-6 py-4 text-right font-bold">ای میل</th>
                <th className="border border-gray-300 px-6 py-4 text-right font-bold">حیثیت</th>
                <th className="border border-gray-300 px-6 py-4 text-right font-bold">رجسٹریشن کی تاریخ</th>
                <th className="border border-gray-300 px-6 py-4 text-right font-bold">عمل</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user: any) => (
                <tr key={user._id.toString()} className="hover:bg-gray-50 transition-all">
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
                  <td className="border border-gray-300 px-6 py-4 text-center">
                    {currentUser.userId !== user._id.toString() ? (
                      <form action={deleteUserAction}>
                        <input type="hidden" name="userId" value={user._id.toString()} />
                        <button
                          type="submit"
                          className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg font-semibold transition-colors"
                        >
                          ڈیلیٹ کریں
                        </button>
                      </form>
                    ) : (
                      <span className="text-gray-500 text-sm">خود کو ڈیلیٹ نہیں کر سکتے</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-center text-gray-600 mt-8 text-sm">
        ڈیلیٹ کرنے کے بعد پیج خود ریفریش نہیں ہوگا — دستی ریفریش کریں یا F5 دبائیں۔
      </p>
    </div>
  );
}