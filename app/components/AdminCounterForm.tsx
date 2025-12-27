// app/components/AdminCounterForm.tsx
'use client';

import { useState } from 'react';

export default function AdminCounterForm() {
  const [formData, setFormData] = useState({
    enrolled: 500,
    completed: 1000,
    teachers: 50
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  // Fetch current counter data on component mount
  useState(() => {
    const fetchCurrentCounter = async () => {
      try {
        const response = await fetch('/api/counter');
        const data = await response.json();
        
        if (data.success && data.data) {
          setFormData({
            enrolled: data.data.enrolled,
            completed: data.data.completed,
            teachers: data.data.teachers,
          });
        }
      } catch (error) {
        console.error('Error fetching current counter:', error);
      }
    };
    
    fetchCurrentCounter();
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch('/api/counter/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setStatus('success');
        setMessage('Counters updated successfully!');
        setTimeout(() => setStatus('idle'), 3000);
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to update counters');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Network error occurred. Please try again.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseInt(value) || 0
    }));
  };

  const handleIncrement = async (field: string) => {
    try {
      const response = await fetch('/api/counter/increment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ field, amount: 1 }),
      });

      const data = await response.json();
      
      if (data.success && data.data) {
        setFormData({
          enrolled: data.data.enrolled,
          completed: data.data.completed,
          teachers: data.data.teachers,
        });
        setStatus('success');
        setMessage(`${field} incremented successfully!`);
        setTimeout(() => setStatus('idle'), 2000);
      }
    } catch (error) {
      setStatus('error');
      setMessage('Failed to increment counter');
    }
  };

  return (
    <div className="w-full">
      <h3 className="text-2xl font-bold text-slate-800 mb-6 border-b pb-3">
        Update Academy Counters
      </h3>
      
      {status === 'success' && (
        <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl">
          <div className="flex items-center text-emerald-700">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{message}</span>
          </div>
        </div>
      )}
      
      {status === 'error' && (
        <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl">
          <div className="flex items-center text-red-700">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{message}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {[
          { label: 'Enrolled Students', name: 'enrolled', icon: '👨‍🎓', color: 'teal' },
          { label: 'Completed Classes', name: 'completed', icon: '✅', color: 'emerald' },
          { label: 'Expert Teachers', name: 'teachers', icon: '👩‍🏫', color: 'indigo' }
        ].map((field) => (
          <div key={field.name} className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-lg bg-${field.color}-100 flex items-center justify-center`}>
                  <span className="text-lg">{field.icon}</span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    {field.label}
                  </label>
                  <p className="text-xs text-slate-500">Current: {formData[field.name as keyof typeof formData]}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleIncrement(field.name)}
                className={`bg-${field.color}-100 hover:bg-${field.color}-200 text-${field.color}-700 px-4 py-2 rounded-lg text-sm font-medium transition`}
              >
                +1
              </button>
            </div>
            
            <div className="flex space-x-3">
              <input
                type="number"
                name={field.name}
                value={formData[field.name as keyof typeof formData]}
                onChange={handleChange}
                min="0"
                className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-200 text-lg transition outline-none"
                required
              />
            </div>
          </div>
        ))}

        <div className="pt-4">
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-4 rounded-xl font-bold hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-1"
          >
            {status === 'loading' ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Updating Counters...
              </span>
            ) : (
              'Update All Counters'
            )}
          </button>
          
          <div className="mt-4 text-center">
            <a 
              href="/"
              className="text-sm text-slate-500 hover:text-teal-600 transition"
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </form>
    </div>
  );
}