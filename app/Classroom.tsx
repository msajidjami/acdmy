// src/pages/Classroom.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import PDFViewer from '../components/PDFViewer';
import AIWhiteboard from '../components/AIWhiteboard';
import ZoomEmbed from '../components/ZoomEmbed';
import { Classroom as ClassroomType } from '../types';

const Classroom: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [classroom, setClassroom] = useState<ClassroomType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchClassroom = async (): Promise<void> => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get<ClassroomType>(`/api/classrooms/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setClassroom(res.data);
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'کلاس روم نہیں ملا');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchClassroom();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="text-xl">⏳ لوڈ ہو رہا ہے...</span>
      </div>
    );
  }

  if (!classroom) {
    return (
      <div className="text-center text-red-500 mt-10">
        کلاس روم موجود نہیں
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 bg-gray-50 min-h-screen">
      {/* ہیڈر */}
      <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-wrap justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{classroom.title}</h1>
          <p className="text-gray-500">
            📚 {classroom.course} | 👨‍🏫 استاد: {classroom.teacher?.name || 'نامعلوم'}
          </p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 transition"
        >
          واپس جائیں
        </button>
      </div>

      {/* کلاس روم کا گرڈ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* بائیں کالم */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-2 h-[500px] overflow-hidden border border-gray-200">
            <PDFViewer fileUrl={classroom.bookUrl} />
          </div>
          <AIWhiteboard />
        </div>

        {/* دائیں کالم */}
        <div className="lg:col-span-1 space-y-6">
          <ZoomEmbed classroomId={classroom._id} />
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-sm">
            <p className="font-bold text-blue-800">🎯 استاد کے لیے نوٹ:</p>
            <p className="text-blue-700">
              آپ ویب سائٹ پر آکر یہاں سے کلاس شروع کریں۔ طلباء کو اوپر والا Zoom لنک بھیج دیں۔
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Classroom;