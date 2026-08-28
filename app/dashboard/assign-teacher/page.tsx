'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/hooks/useAuth';
import { Loader2, Star, CheckCircle, UserCircle, Mail, Award, Users } from 'lucide-react';

type Teacher = {
  _id: string;
  fullName: string;
  email: string;
  avatar?: string;
  qualification?: string;
  experience?: number;
  rating?: number;
  totalStudents?: number;
  bio?: string;
};

export default function AssignTeacherPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [assignedTeacher, setAssignedTeacher] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
      return;
    }
    if (!loading && user) {
      fetchData();
    }
  }, [loading, user]);

  const fetchData = async () => {
    try {
      // Fetch all active teachers
      const teachersRes = await fetch('/api/teachers?active=true');
      if (teachersRes.ok) {
        const data = await teachersRes.json();
        setTeachers(Array.isArray(data) ? data : []);
      }

      // Fetch current assigned teacher (if any)
      // ✅ Fix: use (user as any) to access _id safely
      const userId = user?.id || (user as any)?._id;
      if (userId) {
        const userRes = await fetch(`/api/users/${userId}`);
        if (userRes.ok) {
          const userData = await userRes.json();
          setAssignedTeacher(userData.assignedTeacher || null);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssign = async (teacherId: string) => {
    setAssigning(teacherId);
    try {
      const res = await fetch('/api/assign-teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId }),
      });
      if (res.ok) {
        setAssignedTeacher(teacherId);
        alert('Teacher assigned successfully!');
        // Refresh to update the list
        await fetchData();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to assign teacher');
      }
    } catch (error) {
      alert('Error assigning teacher');
    } finally {
      setAssigning(null);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Assign a Teacher</h1>
        <p className="text-gray-500 mt-1">
          Choose a teacher to guide you through your learning journey.
        </p>
        {assignedTeacher && (
          <p className="text-emerald-600 mt-2 flex items-center gap-2">
            <CheckCircle size={18} />
            You have already assigned a teacher. You can change it anytime.
          </p>
        )}
      </div>

      {/* Teachers Grid */}
      {teachers.length === 0 ? (
        <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-500">
          <UserCircle className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p>No teachers available at the moment.</p>
          <p className="text-sm">Please check back later.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teachers.map((teacher) => {
            const isAssigned = assignedTeacher === teacher._id;
            const isAssigning = assigning === teacher._id;

            return (
              <div
                key={teacher._id}
                className={`bg-white rounded-2xl shadow hover:shadow-xl transition p-6 flex flex-col ${
                  isAssigned ? 'border-2 border-emerald-500' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {teacher.avatar ? (
                      <img
                        src={teacher.avatar}
                        alt={teacher.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserCircle className="w-10 h-10 text-emerald-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">
                      {teacher.fullName}
                    </h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Mail size={14} /> {teacher.email}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm text-gray-600">
                  {teacher.qualification && (
                    <p className="flex items-center gap-2">
                      <Award size={16} className="text-gray-400" />
                      <span className="font-medium">Qualification:</span>{' '}
                      {teacher.qualification}
                    </p>
                  )}
                  {teacher.experience !== undefined && teacher.experience > 0 && (
                    <p>
                      <span className="font-medium">Experience:</span>{' '}
                      {teacher.experience} years
                    </p>
                  )}
                  {teacher.rating !== undefined && teacher.rating > 0 && (
                    <p className="flex items-center gap-1">
                      <span className="font-medium">Rating:</span>
                      <span className="flex items-center">
                        {teacher.rating} <Star className="w-4 h-4 text-yellow-500 ml-1 fill-yellow-500" />
                      </span>
                    </p>
                  )}
                  {teacher.totalStudents !== undefined && (
                    <p className="flex items-center gap-2">
                      <Users size={16} className="text-gray-400" />
                      <span className="font-medium">Students:</span>{' '}
                      {teacher.totalStudents}
                    </p>
                  )}
                </div>

                {teacher.bio && (
                  <p className="mt-2 text-sm text-gray-500 line-clamp-3">
                    {teacher.bio}
                  </p>
                )}

                <button
                  onClick={() => handleAssign(teacher._id)}
                  disabled={isAssigning || isAssigned}
                  className={`mt-4 w-full py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 ${
                    isAssigned
                      ? 'bg-green-100 text-green-700 cursor-default'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-lg'
                  } disabled:opacity-70 disabled:cursor-not-allowed`}
                >
                  {isAssigning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Assigning...
                    </>
                  ) : isAssigned ? (
                    <>
                      <CheckCircle size={16} />
                      Assigned ✅
                    </>
                  ) : (
                    'Assign Teacher'
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}