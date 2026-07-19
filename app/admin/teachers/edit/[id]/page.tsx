// app/admin/teachers/edit/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import TeacherForm from '@/app/components/admin/teachers/TeacherForm';

// Language & Subject options (آپ API سے بھی لا سکتے ہیں)
const languageOptions = [
  { label: 'English', value: 'English' },
  { label: 'Urdu', value: 'Urdu' },
  { label: 'Arabic', value: 'Arabic' },
  { label: 'French', value: 'French' },
  { label: 'Spanish', value: 'Spanish' },
];

const subjectOptions = [
  { label: 'Mathematics', value: 'Mathematics' },
  { label: 'Physics', value: 'Physics' },
  { label: 'Chemistry', value: 'Chemistry' },
  { label: 'Biology', value: 'Biology' },
  { label: 'English Literature', value: 'English Literature' },
];

export default function EditTeacherPage() {
  const params = useParams();
  const id = params.id as string;

  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetch(`/api/teachers/${id}`)
        .then((res) => {
          if (!res.ok) throw new Error('Failed to fetch');
          return res.json();
        })
        .then((data) => {
          setInitialData(data.teacher);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [id]);

  const handleSubmit = async (data: any) => {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (key === 'avatar' || key === 'introAudio' || key === 'introVideo') {
        if (data[key] instanceof File) {
          formData.append(key, data[key]);
        }
      } else if (key === 'certificates' && Array.isArray(data[key])) {
        data[key].forEach((file: File | string) => {
          if (file instanceof File) {
            formData.append('certificates', file);
          }
        });
      } else if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, String(data[key]));
      }
    });

    const res = await fetch(`/api/teachers/${id}`, {
      method: 'PUT',
      body: formData,
    });

    if (res.ok) {
      alert('Teacher updated successfully!');
      // یہاں ری ڈائریکٹ کریں اگر چاہیں
      // window.location.href = '/admin/teachers';
    } else {
      const error = await res.json();
      alert(error.message || 'Update failed');
    }
  };

  if (loading) return <div className="p-12 text-center">Loading...</div>;
  if (!initialData) return <div className="p-12 text-center">Teacher not found</div>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Teacher</h1>
      <TeacherForm
        initialData={initialData}
        onSubmit={handleSubmit}
        languageOptions={languageOptions}
        subjectOptions={subjectOptions}
      />
    </div>
  );
}