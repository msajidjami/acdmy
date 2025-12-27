'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AdmissionForm() {
  const searchParams = useSearchParams();
  const [referralCode, setReferralCode] = useState(searchParams.get('ref') || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      fatherName: formData.get('fatherName'),
      email: formData.get('email'),
      contactNumber: formData.get('contactNumber'),
      selectedCourse: formData.get('selectedCourse'),
      country: formData.get('country'),
      gender: formData.get('gender'),
      platform: formData.get('platform'),
      referralCode, // لنک سے آٹو سیٹ
    };

    try {
      const res = await fetch('/api/admission/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (result.success) setSuccess(true);
      else setError(result.message);
    } catch {
      setError('غلطی ہوئی');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow">
        <h1 className="text-3xl font-bold mb-6 text-center">داخلہ فارم</h1>
        {referralCode && <p className="text-center mb-4 text-green-600">ریفرل کوڈ: {referralCode}</p>}
        {/* باقی فارم فیلڈز جیسے پہلے والے (نام، والد کا نام وغیرہ) */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* فیلڈز یہاں */}
          {!referralCode && (
            <input
              name="referralCode"
              placeholder="ریفرل کوڈ درج کریں (اختیاری)"
              className="w-full p-3 border rounded"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
            />
          )}
          <button type="submit" disabled={loading} className="w-full bg-teal-600 text-white p-3 rounded">
            {loading ? <Loader2 className="animate-spin mx-auto" /> : 'جمع کروائیں'}
          </button>
        </form>
      </div>
    </div>
  );
}