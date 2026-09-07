'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/components/AuthProvider';
import { toast } from 'react-hot-toast';

interface Teacher {
  _id: string;
  name: string;
  email: string;
  subjects: string[];
  isAvailable: boolean;
  profileImage?: string;
  bio?: string;
  audioUrl?: string; // ✅ نئی پراپرٹی
}

export default function OwnerTeachersPage() {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subjects: '',
    bio: '',
    audioFile: null as File | null, // ✅ آڈیو فائل
  });
  const [uploading, setUploading] = useState(false);

  const fetchTeachers = async () => {
    try {
      const res = await fetch('/api/owner/teachers');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setTeachers(data);
    } catch (error) {
      toast.error('Error loading teachers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  // Toggle availability
  const toggleAvailability = async (teacherId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/owner/teachers/${teacherId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !currentStatus }),
      });
      if (!res.ok) throw new Error('Update failed');
      toast.success('Availability updated');
      setTeachers((prev) =>
        prev.map((t) =>
          t._id === teacherId ? { ...t, isAvailable: !currentStatus } : t
        )
      );
    } catch (error) {
      toast.error('Error updating availability');
    }
  };

  const deleteTeacher = async (teacherId: string) => {
    if (!confirm('Are you sure you want to delete this teacher?')) return;
    try {
      const res = await fetch(`/api/owner/teachers/${teacherId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Delete failed');
      toast.success('Teacher deleted');
      setTeachers((prev) => prev.filter((t) => t._id !== teacherId));
    } catch (error) {
      toast.error('Error deleting teacher');
    }
  };

  // Handle form submit (with audio upload)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      // First, upload audio if selected
      let audioUrl = editingTeacher?.audioUrl || '';
      if (formData.audioFile) {
        const formDataAudio = new FormData();
        formDataAudio.append('audio', formData.audioFile);
        const uploadRes = await fetch('/api/upload-audio', {
          method: 'POST',
          body: formDataAudio,
        });
        if (!uploadRes.ok) throw new Error('Audio upload failed');
        const { url } = await uploadRes.json();
        audioUrl = url;
      }

      // Now save teacher data
      const payload = {
        name: formData.name,
        email: formData.email,
        subjects: formData.subjects.split(',').map((s) => s.trim()),
        bio: formData.bio,
        audioUrl,
      };

      const url = editingTeacher
        ? `/api/owner/teachers/${editingTeacher._id}`
        : '/api/owner/teachers';
      const method = editingTeacher ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Operation failed');

      toast.success(editingTeacher ? 'Teacher updated' : 'Teacher added');
      setShowModal(false);
      setEditingTeacher(null);
      setFormData({ name: '', email: '', subjects: '', bio: '', audioFile: null });
      fetchTeachers();
    } catch (error) {
      toast.error('Error saving teacher');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Manage Teachers</h1>
        <button
          onClick={() => {
            setEditingTeacher(null);
            setFormData({ name: '', email: '', subjects: '', bio: '', audioFile: null });
            setShowModal(true);
          }}
          className="bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 transition"
        >
          + Add New Teacher
        </button>
      </div>

      {/* Teachers Table */}
      <div className="bg-white rounded-2xl shadow overflow-hidden border border-gray-100">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subjects</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Audio</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Available</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {teachers.map((teacher) => (
              <tr key={teacher._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold">
                      {teacher.name.charAt(0)}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{teacher.name}</div>
                      <div className="text-sm text-gray-500">{teacher.bio || '—'}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{teacher.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {teacher.subjects.join(', ') || '—'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {teacher.audioUrl ? (
                    <audio controls className="h-8 w-32">
                      <source src={teacher.audioUrl} type="audio/mpeg" />
                    </audio>
                  ) : (
                    <span className="text-gray-400">No audio</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => toggleAvailability(teacher._id, teacher.isAvailable)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                      teacher.isAvailable ? 'bg-emerald-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        teacher.isAvailable ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className="ml-2 text-xs text-gray-500">
                    {teacher.isAvailable ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => {
                      setEditingTeacher(teacher);
                      setFormData({
                        name: teacher.name,
                        email: teacher.email,
                        subjects: teacher.subjects.join(', '),
                        bio: teacher.bio || '',
                        audioFile: null,
                      });
                      setShowModal(true);
                    }}
                    className="text-emerald-600 hover:text-emerald-900 mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteTeacher(teacher._id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {teachers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  No teachers found. Click "Add New Teacher" to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal for Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Subjects (comma separated)
                </label>
                <input
                  type="text"
                  value={formData.subjects}
                  onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
                  placeholder="e.g. Math, Physics, Quran"
                  className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Bio (optional)</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={2}
                  className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              {/* ✅ آڈیو اپ لوڈ کا انپٹ */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Audio (MP3)</label>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setFormData({ ...formData, audioFile: file });
                  }}
                  className="w-full mt-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
                {editingTeacher?.audioUrl && !formData.audioFile && (
                  <p className="text-xs text-gray-500 mt-1">
                    Current audio: <a href={editingTeacher.audioUrl} target="_blank" className="text-emerald-600 underline">Play</a>
                  </p>
                )}
                {formData.audioFile && (
                  <p className="text-xs text-emerald-600 mt-1">Selected: {formData.audioFile.name}</p>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-xl transition disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : editingTeacher ? 'Update' : 'Add'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-2 rounded-xl transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}