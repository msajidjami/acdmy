'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, RefreshCw, Users, Search } from 'lucide-react';

import TeacherTable from '@/app/components/admin/teachers/TeacherTable';

interface Teacher {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  gender: string;
  country: string;
  city?: string;
  qualification: string;
  experience: number;
  courses: string[];
  languages: string[];
  profileImage?: string;
  isActive: boolean;  // ✅ correct field name
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadTeachers = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/teachers');

      if (!response.ok) {
        throw new Error('Failed to fetch teachers');
      }

      const data = await response.json();

      const teacherList: Teacher[] = data.teachers ?? [];

      setTeachers(teacherList);
      setFilteredTeachers(teacherList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  useEffect(() => {
    const keyword = search.toLowerCase().trim();

    setFilteredTeachers(
      teachers.filter((teacher) => {
        return (
          teacher.fullName.toLowerCase().includes(keyword) ||
          teacher.email.toLowerCase().includes(keyword) ||
          teacher.country.toLowerCase().includes(keyword) ||
          (teacher.city ?? '').toLowerCase().includes(keyword)
        );
      })
    );
  }, [search, teachers]);

  return (
    <div className="space-y-8 mt-30 ">

      <div className="flex flex-col  lg:flex-row lg:justify-between lg:items-center gap-5">

        <div>
          <h1 className="text-3xl font-bold">
            Teachers Management
          </h1>

          <p className="text-gray-500 mt-2">
            Manage all academy teachers from one place.
          </p>
        </div>

        <div className="flex gap-3">

          <button
            onClick={loadTeachers}
            className="flex items-center gap-2 border rounded-xl px-5 py-3 bg-white hover:bg-gray-100"
          >
            <RefreshCw size={18} />
            Refresh
          </button>

          <Link
            href="/admin/teachers/new"
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-xl px-5 py-3"
          >
            <Plus size={18} />
            Add Teacher
          </Link>

        </div>

      </div>

      <div className="grid md:grid-cols-3 gap-6">

        <div className="bg-white shadow rounded-xl p-6">
          <p className="text-gray-500">Total Teachers</p>
          <h2 className="text-4xl font-bold mt-2">
            {teachers.length}
          </h2>
        </div>

        <div className="bg-white shadow rounded-xl p-6">
          <p className="text-gray-500">Active Teachers</p>
          <h2 className="text-4xl font-bold text-green-600 mt-2">
            {teachers.filter((t) => t.isActive).length}
          </h2>
        </div>

        <div className="bg-white shadow rounded-xl p-6">
          <p className="text-gray-500">Inactive Teachers</p>
          <h2 className="text-4xl font-bold text-red-600 mt-2">
            {teachers.filter((t) => !t.isActive).length}
          </h2>
        </div>

      </div>

      <div className="bg-white rounded-xl shadow p-5">

        <div className="relative">

          <Search
            size={18}
            className="absolute left-4 top-4 text-gray-400"
          />

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teacher..."
            className="w-full border rounded-xl pl-11 py-3 pr-4 outline-none"
          />

        </div>

      </div>

      <TeacherTable
        teachers={filteredTeachers}
        loading={loading}
        onRefresh={loadTeachers}
      />

    </div>
  );
}