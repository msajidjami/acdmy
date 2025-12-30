'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function AdmissionForm({ initialRef }: { initialRef: string }) {
  const [referralCode, setReferralCode] = useState(initialRef);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);

    const data = {
      name: formData.get('name') as string,
      fatherName: formData.get('fatherName') as string,
      gender: formData.get('gender') as string,
      country: formData.get('country') as string,
      email: formData.get('email') as string,
      contactNumber: (formData.get('contactNumber') as string).trim(),
      dateOfBirth: formData.get('dateOfBirth') as string,
      feeAmount: formData.get('feeAmount') as string,
      feeCurrency: formData.get('feeCurrency') as string,
      preferredTiming: formData.get('preferredTiming') as string,
      selectedCourse: formData.get('selectedCourse') as string,
      referralCode: referralCode || undefined,
    };

    try {
      const res = await fetch('/api/admission/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      setError('Unable to connect to server. Check your internet or try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-green-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-10 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Thank You!</h1>
          <p className="text-lg text-gray-600">
            Your admission application has been successfully submitted.
            <br />
            Our team will contact you shortly via WhatsApp, InshaAllah.
          </p>
        </div>
      </div>
    );
  }

  return (
    // باقی پورا JSX وہی رہے گا، صرف {initialRef && (...)} والا حصہ اور referral input
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-green-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-teal-600 to-green-600 p-8 text-center">
          <h1 className="text-4xl font-bold text-white">Quran & Islamic Academy</h1>
          <p className="text-teal-100 mt-2 text-xl">Admission Form 2025</p>
        </div>

        <div className="p-8 lg:p-12">
          {initialRef && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
              <p className="text-green-800 font-medium">
                Referral Code Applied: <span className="font-bold">{initialRef}</span>
              </p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-center">
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6">
            {/* سارا فارم وہی رہے گا جو پہلے تھا */}
            {/* ... باقی inputs ... */}

            {!initialRef && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Referral Code (Optional)</label>
                <input
                  type="text"
                  placeholder="Enter referral code if you have one"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
            )}

            <div className="md:col-span-2 text-center mt-8">
              <button
                type="submit"
                disabled={loading}
                className="w-full md:w-auto px-12 py-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-lg rounded-lg disabled:opacity-70 disabled:cursor-not-allowed transition"
              >
                {loading ? <Loader2 className="animate-spin mx-auto h-6 w-6" /> : 'Submit Application'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}