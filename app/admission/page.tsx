'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AdmissionForm() {
  const searchParams = useSearchParams();
  const initialRef = searchParams.get('ref') || '';
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

    // Debug (you can remove later)
    console.log('Sending data to API:', data);

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

  // Success message
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
            {/* Name and Father's Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Student Name *</label>
              <input
                name="name"
                type="text"
                required
                placeholder="e.g. Ahmed Ali"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Father's Name *</label>
              <input
                name="fatherName"
                type="text"
                required
                placeholder="e.g. Muhammad Yusuf"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Gender and Country */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gender *</label>
              <select
                name="gender"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Country *</label>
              <input
                name="country"
                type="text"
                required
                defaultValue="Pakistan"
                placeholder="e.g. Pakistan, Saudi Arabia"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Email and WhatsApp */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
              <input
                name="email"
                type="email"
                required
                placeholder="example@gmail.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp Number *</label>
              <input
                name="contactNumber"
                type="text"
                required
                placeholder="+923001234567"
                dir="ltr"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-left"
              />
            </div>

            {/* Date of Birth and Course */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth *</label>
              <input
                name="dateOfBirth"
                type="date"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Course *</label>
              <select
                name="selectedCourse"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Choose a Course</option>
                <option value="Quran Nazra">Quran Nazra (Reading)</option>
                <option value="Quran Hifz">Quran Hifz (Memorization)</option>
                <option value="Tajweed">Tajweed</option>
                <option value="Islamic Studies">Islamic Studies</option>
                <option value="Arabic Language">Arabic Language</option>
              </select>
            </div>

            {/* Fee Amount and Currency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Fee (in PKR) *</label>
              <input
                name="feeAmount"
                type="number"
                required
                min="0"
                placeholder="5000"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Currency *</label>
              <select
                name="feeCurrency"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              >
                <option value="PKR">PKR (Pakistani Rupee)</option>
                <option value="USD">USD (US Dollar)</option>
                <option value="SAR">SAR (Saudi Riyal)</option>
                <option value="GBP">GBP (British Pound)</option>
              </select>
            </div>

            {/* Preferred Timing */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Class Timing *</label>
              <select
                name="preferredTiming"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Select Preferred Time</option>
                <option value="Morning">Morning (8 AM - 12 PM)</option>
                <option value="Afternoon">Afternoon (12 PM - 5 PM)</option>
                <option value="Evening">Evening (5 PM - 10 PM)</option>
                <option value="Late Night">Late Night (10 PM - 2 AM)</option>
              </select>
            </div>

            {/* Referral Code (Manual Entry if not from link) */}
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

            {/* Submit Button */}
            <div className="md:col-span-2 text-center mt-8">
              <button
                type="submit"
                disabled={loading}
                className="w-full md:w-auto px-12 py-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-lg rounded-lg disabled:opacity-70 disabled:cursor-not-allowed transition"
              >
                {loading ? (
                  <Loader2 className="animate-spin mx-auto h-6 w-6" />
                ) : (
                  'Submit Application'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}