// src/components/ZoomEmbed.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ZoomMeetingResponse } from '@/types';

interface ZoomEmbedProps {
  classroomId: string;
}

const ZoomEmbed: React.FC<ZoomEmbedProps> = ({ classroomId }) => {
  const [joinUrl, setJoinUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const fetchOrCreateMeeting = async (): Promise<void> => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post<ZoomMeetingResponse>(
        `/api/zoom/create-or-get/${classroomId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setJoinUrl(res.data.joinUrl);
      if (res.data.isNew) {
        toast.success('🎥 نئی Zoom میٹنگ بن گئی!');
      } else {
        toast.success('♻️ پہلے والا لنک دوبارہ استعمال ہو رہا ہے!');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Zoom لنک نہیں بن سکا');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (classroomId) {
      fetchOrCreateMeeting();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classroomId]);

  return (
    <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-lg">🎥 لائیو کلاس (Zoom)</h3>
        <button
          onClick={fetchOrCreateMeeting}
          disabled={loading}
          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {loading ? '⏳...' : '🔄 لنک ریفریش'}
        </button>
      </div>

      {joinUrl ? (
        <div className="mt-3">
          <div className="bg-gray-50 p-3 rounded border border-gray-200 break-all text-sm">
            🔗{' '}
            <a
              href={joinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {joinUrl}
            </a>
          </div>
          <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
            ✅ طلباء اس لنک کو بار بار استعمال کر سکتے ہیں (Meeting ID محفوظ ہے)۔
          </p>

          {/* Zoom ایمبیڈ (iframe) */}
          <div className="mt-3 border rounded-lg overflow-hidden bg-black" style={{ height: '250px' }}>
            <iframe
              src={joinUrl.replace('/join/', '/embed/')}
              className="w-full h-full"
              allow="camera; microphone; fullscreen"
              title="Zoom Meeting"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            ⚠️ بہتر تجربے کے لیے Zoom ایپ کھولیں۔
          </p>
        </div>
      ) : (
        <p className="text-gray-400 mt-2">⏳ میٹنگ لوڈ ہو رہی ہے...</p>
      )}
    </div>
  );
};

export default ZoomEmbed;