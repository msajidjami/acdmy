'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminArticles() {
  const router = useRouter();
  const [articles, setArticles] = useState<any[]>([]);
  const [form, setForm] = useState({
    id: '',
    title: '',
    content: '',
    language: 'en',
    category: '',
    author: '',
    tags: '',
    links: '',
    thumbnail: '', // thumbnail property add کی ہے
  });
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ایڈمن چیک کرنے کا function
  const checkAdminStatus = async () => {
    try {
      const res = await fetch('/api/auth/session');
      if (!res.ok) {
        router.push('/login');
        return;
      }
      
      const data = await res.json();
      if (data.success && data.user) {
        const adminRoles = ['admin', 'owner', 'super-admin', 'education-admin', 'darul-ifta-admin'];
        if (adminRoles.includes(data.user.role)) {
          setIsAdmin(true);
        } else {
          router.push('/');
        }
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAdminStatus();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchArticles();
    }
  }, [isAdmin]);

  const fetchArticles = async () => {
    try {
      const res = await fetch('/api/articles');
      if (!res.ok) throw new Error('Failed to fetch articles');
      
      const response = await res.json();
      
      let dataArray: any[] = [];
      
      if (response.success && Array.isArray(response.data)) {
        dataArray = response.data;
      } else {
        console.error('Unexpected response format:', response);
      }
      
      setArticles(dataArray || []);
      
    } catch (err: any) {
      console.error('Fetch error:', err);
      setMessage('آرٹیکلز لوڈ کرنے میں ناکامی: ' + err.message);
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      const previewUrl = URL.createObjectURL(file);
      setThumbnailPreview(previewUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    const formData = new FormData();

    // 🚨 **اہم: encodeURIComponent نہ استعمال کریں** 🚨
    // FormData خود بخود encoding کرتا ہے
    formData.append('title', form.title);
    formData.append('content', form.content);
    formData.append('language', form.language);
    formData.append('category', form.category);
    formData.append('author', form.author);
    
    // Tags اور Links کو array میں convert کریں
    const tagsArray = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    const linksArray = form.links.split(',').map(l => l.trim()).filter(Boolean);
    
    // JSON.stringify کر دیں
    formData.append('tags', JSON.stringify(tagsArray));
    formData.append('links', JSON.stringify(linksArray));

    // ایڈٹ موڈ میں ID
    if (isEditing && form.id) {
      formData.append('id', form.id);
    }

    // تصویر اگر نئی منتخب کی گئی ہو
    if (thumbnailFile) {
      formData.append('thumbnail', thumbnailFile);
    } else if (isEditing && form.thumbnail && !thumbnailFile) {
      // اگر ایڈٹ موڈ میں ہے اور کوئی نیا فائل نہیں ہے، تو existing thumbnail کو بھیجیں
      formData.append('existingThumbnail', form.thumbnail);
    }

    try {
      const method = isEditing ? 'PUT' : 'POST';
      const res = await fetch('/api/articles', {
        method,
        body: formData,
        // 🚨 **اہم: Content-Type header نہ ڈالیں** 🚨
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save article');
      }

      setMessage(data.message || (isEditing ? 'آرٹیکل کامیابی سے اپ ڈیٹ ہو گیا!' : 'آرٹیکل کامیابی سے شامل ہو گیا!'));
      resetForm();
      fetchArticles();
    } catch (err: any) {
      console.error('Submit error:', err);
      setMessage('غلطی: ' + (err.message || 'آرٹیکل محفوظ کرنے میں ناکامی'));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (article: any) => {
    setForm({
      id: article._id || article.id,
      title: article.title || '',
      content: article.content || '',
      language: article.language || 'en',
      category: article.category || '',
      author: article.author || '',
      thumbnail: article.thumbnail || '', // thumbnail set کریں
      tags: Array.isArray(article.tags) ? article.tags.join(', ') : '',
      links: Array.isArray(article.links) ? article.links.join(', ') : '',
    });
    setThumbnailPreview(article.thumbnail || '');
    setThumbnailFile(null);
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('کیا آپ واقعی اس آرٹیکل کو ڈیلیٹ کرنا چاہتے ہیں؟')) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/articles?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');

      setMessage('آرٹیکل کامیابی سے ڈیلیٹ ہو گیا!');
      fetchArticles();
    } catch (err) {
      setMessage('ڈیلیٹ کرنے میں غلطی ہوئی');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      id: '',
      title: '',
      content: '',
      language: 'en',
      category: '',
      author: '',
      thumbnail: '',
      tags: '',
      links: '',
    });
    setThumbnailPreview('');
    setThumbnailFile(null);
    setIsEditing(false);
    setMessage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-xl text-gray-600">لوڈ ہو رہا ہے...</p>
        </div>
      </div>
    );
  }

  // اگر ایڈمن نہیں ہے تو access denied
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 text-5xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600">آپ کو اس صفحے تک رسائی کی اجازت نہیں ہے۔</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
          >
            ہوم پیج پر جائیں
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto pt-20 px-4 py-12">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-2xl p-6 mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">ایڈمن پینل - آرٹیکلز کا انتظام</h1>
            <p className="text-teal-100 mt-2">تمام زبانوں (انگریزی، اردو، عربی) میں آرٹیکلز شامل، اپ ڈیٹ اور ڈیلیٹ کریں</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition"
            >
              ڈیش بورڈ
            </button>
            <button
              onClick={() => router.push('/')}
              className="bg-white text-teal-600 hover:bg-gray-100 px-4 py-2 rounded-lg transition"
            >
              ہوم پیج
            </button>
          </div>
        </div>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div
          className={`p-4 mb-6 rounded-lg text-center font-medium ${
            message.startsWith('غلطی') || message.includes('ناکامی')
              ? 'bg-red-100 text-red-700 border border-red-300'
              : 'bg-green-100 text-green-700 border border-green-300'
          }`}
        >
          {message}
        </div>
      )}

      {/* فارم */}
      <form onSubmit={handleSubmit} className="bg-white shadow-2xl rounded-2xl p-8 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ٹائٹل *</label>
            <input
              type="text"
              placeholder="آرٹیکل کا ٹائٹل (کسی بھی زبان میں)"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">کیٹگری</label>
            <input
              type="text"
              placeholder="مثال: قرآن، حدیث، رمضان، فقہ"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">مصنف کا نام</label>
            <input
              type="text"
              placeholder="مصنف کا نام"
              value={form.author}
              onChange={(e) => setForm({ ...form, author: e.target.value })}
              className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">زبان</label>
            <select
              value={form.language}
              onChange={(e) => setForm({ ...form, language: e.target.value })}
              className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
            >
              <option value="en">English (انگریزی)</option>
              <option value="ur">Urdu (اردو)</option>
              <option value="ar">Arabic (عربی)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">تھمبنل تصویر اپ لوڈ کریں</label>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleThumbnailChange}
              className="border border-gray-300 rounded-lg p-3 w-full file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
            />
            {/* پیش نظارہ */}
            {(thumbnailPreview || form.thumbnail) && (
              <div className="mt-3">
                <p className="text-sm text-gray-600 mb-2">پیش نظارہ:</p>
                <img
                  src={thumbnailPreview || form.thumbnail}
                  alt="Thumbnail Preview"
                  className="w-40 h-32 object-cover rounded-lg border border-gray-300 shadow-sm"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/images/default-article.jpg';
                  }}
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ٹیگز (کوما سے الگ)</label>
            <input
              type="text"
              placeholder="مثال: رمضان, قرآن, تجوید, اسلام"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">ہر ٹیگ کو کامے سے الگ کریں</p>
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">مواد (HTML سپورٹڈ) *</label>
          <textarea
            placeholder="آرٹیکل کا مکمل مواد یہاں لکھیں... (کسی بھی زبان میں)"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            required
            rows={12}
            className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-y font-mono"
          />
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">لنکس (کوما سے الگ URLs)</label>
          <input
            type="text"
            placeholder="مثال: https://example.com, https://youtube.com/..."
            value={form.links}
            onChange={(e) => setForm({ ...form, links: e.target.value })}
            className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
          />
        </div>

        <div className="mt-8 flex justify-end gap-4">
          <button
            type="submit"
            disabled={loading}
            className={`px-8 py-3 rounded-lg font-medium transition flex items-center gap-2 ${
              loading 
                ? 'bg-teal-400 text-white cursor-not-allowed' 
                : 'bg-teal-600 text-white hover:bg-teal-700'
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                محفوظ ہو رہا ہے...
              </>
            ) : isEditing ? 'اپ ڈیٹ کریں' : 'شامل کریں'}
          </button>

          {isEditing && (
            <button
              type="button"
              onClick={resetForm}
              className="bg-gray-500 text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-600 transition"
            >
              منسوخ کریں
            </button>
          )}
        </div>
      </form>

      {/* آرٹیکلز کی لسٹ */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-teal-800">موجودہ آرٹیکلز ({articles.length})</h2>
          <div className="flex gap-4">
            <button
              onClick={fetchArticles}
              className="bg-teal-100 text-teal-700 hover:bg-teal-200 px-4 py-2 rounded-lg transition flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              ریفریش
            </button>
          </div>
        </div>
        
        {articles.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-xl">
            <div className="text-5xl mb-4">📝</div>
            <p className="text-gray-500 text-lg">ابھی کوئی آرٹیکل موجود نہیں ہے۔</p>
            <p className="text-gray-400 mt-2">پہلا آرٹیکل شامل کرنے کے لیے اوپر فارم استعمال کریں۔</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ٹائٹل
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    کیٹگری
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    زبان
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    تاریخ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    عمل
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {articles.map((article) => (
                  <tr key={article._id || article.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {article.thumbnail && (
                          <img
                            className="h-10 w-10 rounded-full object-cover mr-3"
                            src={article.thumbnail}
                            alt={article.title}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/images/default-article.jpg';
                            }}
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {article.title || 'بلا عنوان'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {article.author || 'ایڈمن'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-teal-100 text-teal-800">
                        {article.category || 'عام'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {article.language === 'ur' ? 'اردو' : article.language === 'ar' ? 'عربی' : 'انگریزی'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(article.createdAt).toLocaleDateString('ur-PK')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(article)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          ایڈٹ
                        </button>
                        <button
                          onClick={() => handleDelete(article._id || article.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          ڈیلیٹ
                        </button>
                        <a
                          href={`/articles/${article._id || article.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal-600 hover:text-teal-900"
                        >
                          دیکھیں
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer Note */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>یہ صفحہ صرف تصدیق شدہ ایڈمنسٹریٹرز کے لیے ہے۔</p>
        <p className="mt-1">تمام آرٹیکلز کسی بھی زبان (انگریزی، اردو، عربی) میں محفوظ ہو سکتے ہیں۔</p>
      </div>
    </div>
  );
}