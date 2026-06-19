// app/contact/page.tsx

'use client';

import { useState } from 'react';
import { Mail, Phone, Clock, Send } from 'lucide-react';
import Link from 'next/link';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setStatusMessage('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setStatusMessage('Your message has been sent successfully! We\'ll get back to you soon.');
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        setStatus('error');
        setStatusMessage(data.error || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      setStatus('error');
      setStatusMessage('Network error. Please check your connection.');
    } finally {
      setTimeout(() => setStatus('idle'), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans antialiased">

      {/* Hero */}
      <section className="relative bg-slate-900 pt-28 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-700 via-slate-900 to-black opacity-60"></div>
        <div className="container mx-auto px-6 relative z-10 text-center max-w-3xl">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
            Get in <span className="text-teal-400">Touch</span>
          </h1>
          <p className="text-lg text-slate-300 leading-relaxed">
            We’d love to hear from you. Reach out with any questions, feedback, or to book your free trial.
          </p>
        </div>
      </section>

      {/* Contact Info & Form */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

            {/* Left Column: Info */}
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Contact Information</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-teal-700" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800">Phone / WhatsApp</h4>
                    <p className="text-slate-600 text-lg">+92 302 9151107</p>
                    <p className="text-sm text-slate-500">Available 24/7 for urgent queries</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-blue-700" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800">Email</h4>
                    <p className="text-slate-600 text-lg">msajidjami063@gmail.com</p>
                    <p className="text-sm text-slate-500">We respond within 24 hours</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-amber-700" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800">Working Hours</h4>
                    <p className="text-slate-600">Monday – Saturday: 7:00 AM – 11:00 PM (EST)</p>
                    <p className="text-sm text-slate-500">Flexible scheduling available for all time zones</p>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="mt-8">
                <h4 className="font-semibold text-slate-800 mb-3">Follow Us</h4>
                <div className="flex gap-4">
                  <Link href="#" className="w-12 h-12 bg-slate-100 hover:bg-teal-100 rounded-full flex items-center justify-center transition-colors text-xl">
                    📘
                  </Link>
                  <Link href="#" className="w-12 h-12 bg-slate-100 hover:bg-teal-100 rounded-full flex items-center justify-center transition-colors text-xl">
                    📸
                  </Link>
                  <Link href="#" className="w-12 h-12 bg-slate-100 hover:bg-teal-100 rounded-full flex items-center justify-center transition-colors text-xl">
                    ▶️
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Column: Form */}
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Send Us a Message</h2>

              {/* Status messages */}
              {status === 'success' && (
                <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700">
                  {statusMessage}
                </div>
              )}
              {status === 'error' && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  {statusMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="bg-slate-50 p-8 rounded-xl border border-slate-200">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Your Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
                      placeholder="How can we help?"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Message *</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={5}
                      required
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition resize-none"
                      placeholder="Tell us about your inquiry..."
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full bg-teal-600 hover:bg-teal-500 text-white font-semibold py-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {status === 'loading' ? 'Sending...' : (
                      <>
                        <Send className="w-5 h-5" />
                        Send Message
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-900 text-white py-16">
        <div className="container mx-auto px-6 text-center max-w-3xl">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Learning?</h2>
          <p className="text-slate-300 mb-8 text-lg">
            Book your free trial class today and experience our teaching excellence.
          </p>
          <Link
            href="/register"
            className="bg-teal-600 hover:bg-teal-500 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors inline-block shadow-lg"
          >
            Start Your Free Trial
          </Link>
        </div>
      </section>
    </div>
  );
}