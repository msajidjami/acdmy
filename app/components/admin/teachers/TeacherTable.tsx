'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  Eye,
  Pencil,
  Trash2,
  RefreshCw,
} from 'lucide-react';

interface Teacher {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  gender: string;
  country: string;
  qualification: string;
  experience: number;
  languages: string[];
  courses?: string[]; // ✅ make optional to avoid runtime error
  profileImage?: string;
  isActive: boolean;
}

interface Props {
  teachers: Teacher[];
  loading: boolean;
  onRefresh: () => void;
}

export default function TeacherTable({
  teachers,
  loading,
  onRefresh,
}: Props) {

  const deleteTeacher = async (id: string) => {

    if (!confirm('Delete this teacher?')) return;

    try {

      const res = await fetch(`/api/admin/teachers/${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        onRefresh();
      } else {
        alert(data.message || 'Delete failed');
      }

    } catch (err) {
      console.error(err);
      alert('Server Error');
    }

  };

  if (loading) {

    return (
      <div className="bg-white rounded-xl shadow p-12 text-center">

        <RefreshCw className="animate-spin mx-auto mb-4" />

        <p>Loading Teachers...</p>

      </div>
    );

  }

  if (teachers.length === 0) {

    return (
      <div className="bg-white rounded-xl shadow p-12 text-center">

        <h2 className="text-2xl font-bold">

          No Teachers Found

        </h2>

      </div>
    );

  }

  return (

    <div className="bg-white rounded-xl shadow overflow-hidden">

      <div className="overflow-x-auto">

        <table className="w-full">

          <thead className="bg-gray-100">

            <tr>

              <th className="text-left px-6 py-4">Teacher</th>

              <th className="text-left px-6 py-4">Qualification</th>

              <th className="text-left px-6 py-4">Experience</th>

              <th className="text-left px-6 py-4">Courses</th>

              <th className="text-left px-6 py-4">Status</th>

              <th className="text-center px-6 py-4">

                Actions

              </th>

            </tr>

          </thead>

          <tbody>

            {teachers.map((teacher) => (

              <tr
                key={teacher._id}
                className="border-b hover:bg-gray-50"
              >

                <td className="px-6 py-5">

                  <div className="flex items-center gap-4">

                    <Image
                      src={
                        teacher.profileImage ||
                        '/avatar.png'
                      }
                      alt={teacher.fullName}
                      width={55}
                      height={55}
                      className="rounded-full border object-cover"
                    />

                    <div>

                      <h3 className="font-semibold">

                        {teacher.fullName}

                      </h3>

                      <p className="text-sm text-gray-500">

                        {teacher.email}

                      </p>

                      <p className="text-xs text-gray-400">

                        {teacher.country}

                      </p>

                    </div>

                  </div>

                </td>

                <td className="px-6 py-5">

                  {teacher.qualification}

                </td>

                <td className="px-6 py-5">

                  {teacher.experience} Years

                </td>

                <td className="px-6 py-5">

                  <div className="flex flex-wrap gap-2">

                    {/* ✅ Safe access with fallback empty array */}
                    {(teacher.courses || []).map((course) => (

                      <span
                        key={course}
                        className="bg-green-100 text-green-700 px-2 py-1 rounded-lg text-xs"
                      >

                        {course}

                      </span>

                    ))}

                  </div>

                </td>

                <td className="px-6 py-5">

                  {teacher.isActive ? (

                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">

                      Active

                    </span>

                  ) : (

                    <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-semibold">

                      Inactive

                    </span>

                  )}

                </td>

                <td className="px-6 py-5">

                  <div className="flex justify-center gap-3">

                    <Link
                      href={`/admin/teachers/view/${teacher._id}`}
                      className="bg-blue-100 hover:bg-blue-200 text-blue-700 p-2 rounded-lg"
                    >

                      <Eye size={18} />

                    </Link>

                    <Link
                      href={`/admin/teachers/edit/${teacher._id}`}
                      className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 p-2 rounded-lg"
                    >

                      <Pencil size={18} />

                    </Link>

                    <button
                      onClick={() =>
                        deleteTeacher(teacher._id)
                      }
                      className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-lg"
                    >

                      <Trash2 size={18} />

                    </button>

                  </div>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>

  );

}