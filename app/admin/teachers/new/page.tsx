'use client';

import { useRouter } from 'next/navigation';
import TeacherForm from '@/app/components/admin/teachers/TeacherForm';

export default function NewTeacherPage() {
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    try {
      const formData = new FormData();

      formData.append('fullName', data.fullName);
      formData.append('email', data.email);
      formData.append('phone', data.phone || '');
      formData.append('gender', data.gender);
      formData.append('country', data.country || '');
      formData.append('city', data.city || '');
      formData.append('timezone', data.timezone || '');
      formData.append('qualification', data.qualification || '');
      formData.append('experience', String(data.experience || 0));
      formData.append('bio', data.bio || '');
      formData.append('zoomEmail', data.zoomEmail || '');

      formData.append(
        'isVerified',
        String(data.isVerified)
      );

      formData.append(
        'active',
        String(data.active)
      );

      formData.append(
        'languages',
        JSON.stringify(data.languages || [])
      );

      formData.append(
        'subjects',
        JSON.stringify(data.subjects || [])
      );

      // Profile Image
      if (data.avatar instanceof File) {
        formData.append('avatar', data.avatar);
      }

      // Intro Audio
      if (data.introAudio instanceof File) {
        formData.append('introAudio', data.introAudio);
      }

      // Intro Video
      if (data.introVideo instanceof File) {
        formData.append('introVideo', data.introVideo);
      }

      // Certificates
      if (Array.isArray(data.certificates)) {
        data.certificates.forEach((file: File) => {
          if (file instanceof File) {
            formData.append('certificates', file);
          }
        });
      }

      const res = await fetch('/api/teachers', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();

      console.log(result);

      if (result.success) {
        alert('Teacher Created Successfully');
        router.push('/teachers');
      } else {
        alert(result.message);
      }
    } catch (err) {
      console.error(err);
      alert('Something went wrong');
    }
  };

  return (
    <TeacherForm
      onSubmit={handleSubmit}
      languageOptions={[
        { label: 'English', value: 'English' },
        { label: 'Urdu', value: 'Urdu' },
      ]}
      subjectOptions={[
        { label: 'Quran', value: 'Quran' },
        { label: 'Hadith', value: 'Hadith' },
      ]}
    />
  );
}