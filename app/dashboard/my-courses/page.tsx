'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/hooks/useAuth';
import {
  BookOpen,
  CheckCircle,
  Clock,
  PlusCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  FileText,
  UserCircle,
  X,
  UserPlus,
  UserMinus,
} from 'lucide-react';

type Course = {
  _id: string;
  title: string;
  description: string;
  level: string;
  thumbnail?: string;
  syllabus?: any[];
  syllabusFiles?: any[];
  syllabusDescription?: string;
};

type Teacher = {
  _id: string;
  fullName: string;
  email: string;
  avatar?: string;
};

type Enrollment = {
  course: Course;
  enrolledAt: string;
  progress: number;
  completed: boolean;
};

export default function MyCoursesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [expandedSyllabus, setExpandedSyllabus] = useState<string | null>(null);

  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalMode, setModalMode] = useState<'enroll' | 'assign'>('enroll');

  const [assignedTeacherName, setAssignedTeacherName] = useState<string>('');
  const [assignedTeacherId, setAssignedTeacherId] = useState<string | null>(null);

  // ✅ آپ کا دیا ہوا fetchCurrentUser
  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/user/me', {
        cache: 'no-store',
      });

      if (!res.ok) {
        console.error('Failed to fetch current user');
        return;
      }

      const data = await res.json();

      if (data.assignedTeacherData) {
        setAssignedTeacherId(data.assignedTeacherData._id);
        setAssignedTeacherName(
          data.assignedTeacherData.fullName ||
          data.assignedTeacherData.email ||
          'Teacher'
        );
      } else {
        setAssignedTeacherId(null);
        setAssignedTeacherName('');
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
      setAssignedTeacherId(null);
      setAssignedTeacherName('');
    }
  };

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
      // ✅ پہلے موجودہ صارف کی معلومات حاصل کریں
      await fetchCurrentUser();

      // Enrollments
      const enrollRes = await fetch('/api/enrollments');
      let enrollmentsData: Enrollment[] = [];
      if (enrollRes.ok) {
        const data = await enrollRes.json();
        enrollmentsData = Array.isArray(data) ? data : [];
        setEnrollments(enrollmentsData);
      }

      // Courses
      const coursesRes = await fetch('/api/courses?active=true');
      if (coursesRes.ok) {
        const allCourses = await coursesRes.json();
        const coursesArray = Array.isArray(allCourses) ? allCourses : [];
        const enrolledIds = new Set(
          enrollmentsData.map((e) => e.course?._id).filter(Boolean)
        );
        const available = coursesArray.filter(
          (c: Course) => !enrolledIds.has(c._id)
        );
        setAvailableCourses(available);
      } else {
        setAvailableCourses([]);
      }

      // Teachers
      const teachersRes = await fetch('/api/teachers?active=true');
      if (teachersRes.ok) {
        const teachersData = await teachersRes.json();
        setTeachers(Array.isArray(teachersData) ? teachersData : []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setAvailableCourses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnrollClick = (courseId: string) => {
    if (assignedTeacherId) {
      handleEnroll(courseId, assignedTeacherId);
    } else {
      setModalMode('enroll');
      setSelectedCourseId(courseId);
      setSelectedTeacherId('');
      setShowTeacherModal(true);
    }
  };

  const handleAssignTeacherClick = () => {
    setModalMode('assign');
    setSelectedCourseId(null);
    setSelectedTeacherId('');
    setShowTeacherModal(true);
  };

  const handleEnroll = async (courseId: string, teacherId?: string) => {
    setEnrolling(courseId);
    try {
      const res = await fetch('/api/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, teacherId }),
      });
      if (res.ok) {
        await fetchData();
        setShowTeacherModal(false);
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to enroll');
      }
    } catch (error) {
      alert('Error enrolling');
    } finally {
      setEnrolling(null);
      setIsSubmitting(false);
    }
  };

  const handleAssignTeacher = async (teacherId: string) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/users/assign-teacher', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Teacher assigned successfully!');
        await fetchData();
        setShowTeacherModal(false);
      } else {
        alert(data.error || 'Failed to assign teacher');
      }
    } catch (error) {
      alert('Error assigning teacher');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnassignTeacher = async () => {
    if (!confirm('Are you sure you want to unassign your teacher?')) return;
    try {
      const res = await fetch('/api/users/assign-teacher', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId: null }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Teacher unassigned successfully');
        await fetchData();
      } else {
        alert(data.error || 'Failed to unassign teacher');
      }
    } catch (error) {
      alert('Error unassigning teacher');
    }
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherId) {
      alert('Please select a teacher');
      return;
    }
    if (modalMode === 'enroll') {
      await handleEnroll(selectedCourseId!, selectedTeacherId);
    } else {
      await handleAssignTeacher(selectedTeacherId);
    }
  };

  const toggleSyllabus = (courseId: string) => {
    setExpandedSyllabus(expandedSyllabus === courseId ? null : courseId);
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!user) return null;

  const completedCount = enrollments.filter((e) => e.completed).length;
  const inProgressCount = enrollments.filter(
    (e) => !e.completed && e.progress > 0
  ).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">My Courses</h1>
        <p className="text-gray-500 mt-1">
          Manage your enrolled courses and discover new ones.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-4">
          {assignedTeacherName ? (
            <div className="flex items-center gap-2">
              <span className="text-emerald-600 text-sm flex items-center gap-1">
                <CheckCircle size={16} /> Assigned Teacher: <strong>{assignedTeacherName}</strong>
              </span>
              <button
                onClick={handleUnassignTeacher}
                className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded-lg transition flex items-center gap-1"
              >
                <UserMinus size={14} /> Remove
              </button>
            </div>
          ) : (
            <p className="text-amber-600 text-sm flex items-center gap-1">
              <UserPlus size={16} /> No teacher assigned yet.
            </p>
          )}
          <button
            onClick={handleAssignTeacherClick}
            className="text-sm bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-lg transition"
          >
            {assignedTeacherName ? 'Change Teacher' : 'Assign Teacher'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow p-6">
          <BookOpen className="text-blue-600 mb-3" size={28} />
          <h3 className="text-2xl font-bold">{enrollments.length}</h3>
          <p className="text-gray-500">Total Enrolled</p>
        </div>
        <div className="bg-white rounded-2xl shadow p-6">
          <CheckCircle className="text-green-600 mb-3" size={28} />
          <h3 className="text-2xl font-bold">{completedCount}</h3>
          <p className="text-gray-500">Completed</p>
        </div>
        <div className="bg-white rounded-2xl shadow p-6">
          <Clock className="text-yellow-600 mb-3" size={28} />
          <h3 className="text-2xl font-bold">{inProgressCount}</h3>
          <p className="text-gray-500">In Progress</p>
        </div>
      </div>

      {/* Enrolled Courses */}
      <section>
        <h2 className="text-2xl font-bold mb-5">Your Enrolled Courses</h2>
        {enrollments.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-500">
            <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p>You haven't enrolled in any course yet.</p>
            <p className="text-sm">Browse available courses below to get started.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrollments.map((enrollment) => (
              <div
                key={enrollment.course?._id || Math.random()}
                className="bg-white rounded-2xl shadow hover:shadow-xl transition p-6 flex flex-col"
              >
                <h3 className="text-xl font-bold text-gray-800">
                  {enrollment.course?.title || 'Unknown Course'}
                </h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                  {enrollment.course?.description || ''}
                </p>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progress</span>
                    <span>{enrollment.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full mt-1">
                    <div
                      className="h-2 bg-emerald-600 rounded-full transition-all"
                      style={{ width: `${enrollment.progress}%` }}
                    />
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span
                    className={`text-xs font-medium px-3 py-1 rounded-full ${
                      enrollment.completed
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {enrollment.completed ? 'Completed ✅' : 'In Progress'}
                  </span>
                  <span className="text-xs text-gray-400">
                    Enrolled: {new Date(enrollment.enrolledAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Assign Teacher Button inside card */}
                {assignedTeacherName ? (
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm text-gray-700 flex items-center gap-1">
                      <UserCircle size={16} className="text-emerald-600" />
                      {assignedTeacherName}
                    </span>
                    <button
                      onClick={() => {
                        setModalMode('assign');
                        setSelectedCourseId(null);
                        setSelectedTeacherId('');
                        setShowTeacherModal(true);
                      }}
                      className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1 rounded-lg transition"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setModalMode('assign');
                      setSelectedCourseId(null);
                      setSelectedTeacherId('');
                      setShowTeacherModal(true);
                    }}
                    className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
                  >
                    <UserPlus size={16} />
                    Assign Teacher
                  </button>
                )}

                {/* Syllabus Section */}
                {enrollment.course?.syllabus && enrollment.course.syllabus.length > 0 && (
                  <div className="mt-4 border-t pt-3">
                    <button
                      onClick={() => toggleSyllabus(enrollment.course._id)}
                      className="flex items-center justify-between w-full text-sm font-medium text-gray-700 hover:text-emerald-600 transition"
                    >
                      <span className="flex items-center gap-2">
                        <FileText size={16} />
                        Syllabus
                      </span>
                      {expandedSyllabus === enrollment.course._id ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </button>
                    {expandedSyllabus === enrollment.course._id && (
                      <div className="mt-3 space-y-2 text-sm">
                        {enrollment.course.syllabusDescription && (
                          <p className="text-gray-600 text-xs">
                            {enrollment.course.syllabusDescription}
                          </p>
                        )}
                        <ul className="list-disc list-inside space-y-1 text-gray-600">
                          {enrollment.course.syllabus.map((unit: any, index: number) => (
                            <li key={index}>
                              <span className="font-medium">Unit {unit.unitNumber}:</span> {unit.title}
                              {unit.description && (
                                <p className="text-xs text-gray-500 ml-6">{unit.description}</p>
                              )}
                            </li>
                          ))}
                        </ul>
                        {enrollment.course.syllabusFiles && enrollment.course.syllabusFiles.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-gray-700">Files:</p>
                            <ul className="list-disc list-inside text-xs text-blue-600">
                              {enrollment.course.syllabusFiles.map((file: any, idx: number) => (
                                <li key={idx}>
                                  <a href={file.fileUrl} target="_blank" rel="noopener noreferrer">
                                    {file.fileName}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Available Courses */}
      <section>
        <h2 className="text-2xl font-bold mb-5">Available Courses</h2>
        {availableCourses.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-500">
            <PlusCircle className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p>No new courses available at the moment.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableCourses.map((course) => (
              <div
                key={course._id}
                className="bg-white rounded-2xl shadow hover:shadow-xl transition p-6 flex flex-col"
              >
                <h3 className="text-xl font-bold text-gray-800">
                  {course.title}
                </h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                  {course.description}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    {course.level || 'Beginner'}
                  </span>
                </div>
                <button
                  onClick={() => handleEnrollClick(course._id)}
                  disabled={enrolling === course._id}
                  className="mt-4 w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
                >
                  {enrolling === course._id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <PlusCircle size={16} />
                  )}
                  {enrolling === course._id ? 'Enrolling...' : 'Enroll Now'}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Teacher Selection Modal */}
      {showTeacherModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {modalMode === 'enroll' ? 'Select a Teacher' : 'Assign Teacher'}
              </h2>
              <button
                onClick={() => setShowTeacherModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleModalSubmit} className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                {modalMode === 'enroll'
                  ? 'Please select a teacher to guide you through this course.'
                  : 'Choose a teacher to assign to your account.'}
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Choose Teacher
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500"
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  required
                >
                  <option value="">-- Select --</option>
                  {teachers.map((teacher) => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.fullName} ({teacher.email})
                    </option>
                  ))}
                </select>
                {teachers.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    No teachers available. Please contact admin.
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={isSubmitting || teachers.length === 0}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-lg font-medium transition disabled:opacity-50"
              >
                {isSubmitting
                  ? 'Processing...'
                  : modalMode === 'enroll'
                  ? 'Enroll with this Teacher'
                  : 'Assign Teacher'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}