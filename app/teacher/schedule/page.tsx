'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Loader2, UserCircle, Mail, Phone, Calendar, Clock, Video, BookOpen } from 'lucide-react';

type Student = { _id: string; name: string; email: string; phone: string; avatar?: string };
type Course = { _id: string; title: string };

export default function ScheduleClassPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    course: '',
    title: '',
    date: '',
    time: '',
    duration: 30,
    meetingLink: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
    if (user) fetchData();
  }, [loading, user]);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/teacher/students');
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
      } else {
        console.error('Failed to fetch students');
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }

    try {
      const coursesRes = await fetch('/api/courses?active=true');
      if (coursesRes.ok) {
        const coursesData = await coursesRes.json();
        setCourses(Array.isArray(coursesData) ? coursesData : []);
      } else {
        console.error('Failed to fetch courses');
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const handleScheduleClick = (student: Student) => {
    setSelectedStudent(student);
    setShowForm(true);
    setForm(prev => ({
      ...prev,
      title: `Class with ${student.name}`,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        student: selectedStudent?._id,
        teacher: (user as any)?._id || user?.id,
        date: new Date(`${form.date}T${form.time}`).toISOString(),
      };
      // ✅ URL درست کریں: classes1 -> classes
      const res = await fetch('/api/classes1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        alert('Class scheduled successfully!');
        setShowForm(false);
        setSelectedStudent(null);
        router.push('/dashboard/classes');
      } else {
        const error = await res.json();
        alert(error.message || 'Failed to schedule class');
      }
    } catch (error) {
      alert('Error scheduling class');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Schedule Classes</h1>
          <p className="text-gray-500 mt-1">
            Select a student to schedule a class with them.
          </p>
        </div>
      </div>

      {/* Students Grid */}
      {students.length === 0 ? (
        <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-500">
          <UserCircle className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p>No students assigned to you yet.</p>
          <p className="text-sm">Students will appear here once they are assigned to you.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {students.map((student) => (
            <div
              key={student._id}
              className="bg-white rounded-2xl shadow hover:shadow-xl transition p-6 flex flex-col"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {student.avatar ? (
                    <img src={student.avatar} alt={student.name} className="w-full h-full object-cover" />
                  ) : (
                    <UserCircle className="w-8 h-8 text-emerald-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{student.name}</h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Mail size={14} /> {student.email}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm text-gray-600">
                {student.phone && (
                  <p className="flex items-center gap-2">
                    <Phone size={16} className="text-gray-400" />
                    {student.phone}
                  </p>
                )}
              </div>

              <button
                onClick={() => handleScheduleClick(student)}
                className="mt-4 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
              >
                <Calendar size={16} />
                Schedule Class
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Schedule Form Modal */}
      {showForm && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-4 border-b flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                Schedule Class with {selectedStudent.name}
              </h2>
              <button
                onClick={() => { setShowForm(false); setSelectedStudent(null); }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  value={form.course}
                  onChange={(e) => setForm({ ...form, course: e.target.value })}
                  required
                >
                  <option value="">Select Course</option>
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  placeholder="e.g., Quran Lesson 1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) })}
                  min="15"
                  max="180"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Zoom Meeting Link
                </label>
                <input
                  type="url"
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="https://zoom.us/j/123456789"
                  value={form.meetingLink}
                  onChange={(e) => setForm({ ...form, meetingLink: e.target.value })}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Optional: Add a Zoom meeting link for this class.
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Scheduling...
                  </span>
                ) : (
                  'Schedule Class'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}