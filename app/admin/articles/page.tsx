'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface Article {
  _id?: string;
  id?: string;
  title: string;
  content: string;
  language: 'en' | 'ur' | 'ar';
  category: string;
  author: string;
  tags: string[];
  links: string[];
  thumbnail?: string;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    canonicalUrl?: string;
  };
  createdAt?: string | Date;
}

interface FormState {
  id: string;
  title: string;
  content: string;
  language: 'en' | 'ur' | 'ar';
  category: string;
  author: string;
  tags: string;
  links: string;
  thumbnail: string;
  // ✅ ایڈوانسڈ کسٹم SEO فیلڈز
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
}

export default function AdminArticles() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [form, setForm] = useState<FormState>({
    id: '',
    title: '',
    content: '',
    language: 'en',
    category: '',
    author: '',
    tags: '',
    links: '',
    thumbnail: '',
    metaTitle: '',
    metaDescription: '',
    canonicalUrl: '',
  });
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [debugError, setDebugError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ڈائریکشن ہینڈلر (RTL / LTR)
  const isRtl = form.language === 'ur' || form.language === 'ar';

  const checkAdminStatus = async () => {
    try {
      const res = await fetch('/api/auth/session', { credentials: 'include' });
      if (!res.ok) {
        router.replace('/login');
        return;
      }
      const data = await res.json();

      if (data?.success && data?.user?.role) {
        const adminRoles = ['admin', 'owner', 'super-admin', 'education-admin', 'darul-ifta-admin'] as const;
        if (adminRoles.includes(data.user.role)) {
          setIsAdmin(true);
          return;
        }
      }
      router.replace('/');
    } catch (error) {
      console.error('Admin check failed:', error);
      router.replace('/login');
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
      const res = await fetch('/api/articles', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch articles');
      const response = await res.json();
      if (response.success && Array.isArray(response.data)) {
        setArticles(response.data);
      } else {
        setArticles([]);
      }
    } catch (err) {
      console.error('Fetch articles error:', err);
      setMessage('آرٹیکلز لوڈ کرنے میں ناکامی');
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setDebugError('');
    setLoading(true);

    if (!form.title.trim() || !form.content.trim()) {
      setMessage('براہ کرم لازمی فیلڈز (ٹائٹل اور مواد) درج کریں');
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('title', form.title.trim());
    formData.append('content', form.content.trim());
    formData.append('language', form.language);
    formData.append('category', form.category.trim() || 'General');
    formData.append('author', form.author.trim() || 'Admin');

    // کسٹم SEO ڈیٹا اپینڈ کریں
    formData.append('metaTitle', form.metaTitle.trim());
    formData.append('metaDescription', form.metaDescription.trim());
    formData.append('canonicalUrl', form.canonicalUrl.trim());

    const tagsArray = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    const linksArray = form.links.split(',').map(l => l.trim()).filter(Boolean);
    formData.append('tags', JSON.stringify(tagsArray));
    formData.append('links', JSON.stringify(linksArray));

    if (isEditing && form.id) formData.append('id', form.id);

    if (thumbnailFile) {
      formData.append('thumbnail', thumbnailFile);
    } else if (isEditing && form.thumbnail) {
      formData.append('existingThumbnail', form.thumbnail);
    }

    try {
      const method = isEditing ? 'PUT' : 'POST';
      const res = await fetch('/api/articles', {
        method,
        body: formData,
        credentials: 'include',
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorMsg = data.error || data.message || `HTTP ${res.status}`;
        setDebugError(`Full error: ${JSON.stringify(data)}`);
        throw new Error(errorMsg);
      }

      setMessage(data.message || (isEditing ? 'آرٹیکل کامیابی سے اپ ڈیٹ ہو گیا!' : 'آرٹیکل کامیابی سے شامل ہو گیا!'));
      resetForm();
      await fetchArticles();
    } catch (err: any) {
      console.error('Submit error:', err);
      setMessage('غلطی: ' + (err.message || 'آرٹیکل محفوظ کرنے میں ناکامی'));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (article: Article) => {
    setForm({
      id: article._id || article.id || '',
      title: article.title || '',
      content: article.content || '',
      language: article.language || 'en',
      category: article.category || '',
      author: article.author || '',
      thumbnail: article.thumbnail || '',
      tags: Array.isArray(article.tags) ? article.tags.join(', ') : '',
      links: Array.isArray(article.links) ? article.links.join(', ') : '',
      // محفوظ شدہ کسٹم SEO ڈیٹا لوڈ کریں
      metaTitle: article.seo?.metaTitle || '',
      metaDescription: article.seo?.metaDescription || '',
      canonicalUrl: article.seo?.canonicalUrl || '',
    });
    setThumbnailPreview(article.thumbnail || '');
    setThumbnailFile(null);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('کیا آپ واقعی اس آرٹیکل کو ڈیلیٹ کرنا چاہتے ہیں؟')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/articles?id=${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Delete failed');
      setMessage('آرٹیکل کامیابی سے ڈیلیٹ ہو گیا!');
      await fetchArticles();
    } catch {
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
      metaTitle: '',
      metaDescription: '',
      canonicalUrl: '',
    });
    setThumbnailPreview('');
    setThumbnailFile(null);
    setIsEditing(false);
    setMessage('');
    setDebugError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

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

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 text-5xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">رسائی ممنوع</h2>
          <button onClick={() => router.push('/')} className="mt-4 px-8 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition">ہوم پیج پر جائیں</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto pt-20 px-4 py-12 max-w-7xl" dir="rtl">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-2xl p-6 mb-10 shadow-xl text-right">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">ایڈمن پینل - آرٹیکلز کا انتظام</h1>
            <p className="text-teal-100 mt-2">انٹرنیشنل SEO اور عالمی ملٹی لنگول اسٹرکچر کے مطابق تشکیل شدہ سسٹم</p>
          </div>
          <div className="flex gap-4" dir="ltr">
            <button onClick={() => router.push('/admin/dashboard')} className="bg-white/20 hover:bg-white/30 text-white px-5 py-2 rounded-lg transition">ڈیش بورڈ</button>
            <button onClick={() => router.push('/')} className="bg-white text-teal-800 hover:bg-gray-100 px-5 py-2 rounded-lg transition font-medium">ہوم پیج</button>
          </div>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className={`p-4 mb-8 rounded-xl text-center font-medium border shadow-sm ${message.includes('غلطی') || message.includes('ناکامی') ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
          {message}
          {debugError && (
            <details className="mt-2 text-sm text-left bg-red-100 p-2 rounded" dir="ltr">
              <summary className="cursor-pointer font-medium text-right">تفصیلی خرابی</summary>
              <pre className="text-xs处理 whitespace-pre-wrap break-all mt-1">{debugError}</pre>
            </details>
          )}
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white shadow-2xl rounded-2xl p-8 mb-12 text-right">
        <h3 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2 text-teal-700">✍️ آرٹیکل کی بنیادی معلومات</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ٹائٹل *</label>
            <input
              type="text"
              placeholder="آرٹیکل کا ٹائٹل درج کریں"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              required
              dir={isRtl ? 'rtl' : 'ltr'}
              className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">زبان کا انتخاب (System Locale)</label>
            <select
              value={form.language}
              onChange={e => setForm({ ...form, language: e.target.value as 'en' | 'ur' | 'ar' })}
              className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition bg-white"
            >
              <option value="ur">Urdu (اردو - RTL)</option>
              <option value="ar">Arabic (عربی - RTL)</option>
              <option value="en">English (انگریزی - LTR)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">کیٹگری</label>
            <input
              type="text"
              placeholder="مثال: قرآن، حدیث، فقہ"
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
              className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">مصنف کا نام</label>
            <input
              type="text"
              placeholder="مصنف کا نام لکھیں"
              value={form.author}
              onChange={e => setForm({ ...form, author: e.target.value })}
              className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
            />
          </div>
        </div>

        {/* Content Field */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">آرٹیکل کا مواد *</label>
          <textarea
            placeholder="یہاں مکمل آرٹیکل لکھیں..."
            value={form.content}
            onChange={e => setForm({ ...form, content: e.target.value })}
            required
            rows={12}
            dir={isRtl ? 'rtl' : 'ltr'}
            className="border border-gray-300 rounded-lg p-5 w-full focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-y text-base leading-relaxed whitespace-pre-wrap"
          />
        </div>

        {/* Media & Meta Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">فیچرڈ تھمبنل تصویر (1200x630 Optimized)</label>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleThumbnailChange}
              className="block w-full text-sm text-gray-500 file:ml-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 transition"
            />
            {(thumbnailPreview || form.thumbnail) && (
              <div className="mt-4">
                <img src={thumbnailPreview || form.thumbnail} alt="Preview" className="w-40 h-24 object-cover rounded-lg border shadow-sm" />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ٹیگز (کوما سے الگ کریں)</label>
            <input
              type="text"
              placeholder="رمضان, اسلام, تجوید"
              value={form.tags}
              onChange={e => setForm({ ...form, tags: e.target.value })}
              className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
            />
          </div>
        </div>

        {/* ✅ ڈیڈیکیٹڈ انٹرنیشنل SEO سیکشن */}
        <div className="mt-10 bg-gray-50 p-6 rounded-2xl border border-gray-200">
          <h4 className="text-lg font-bold text-emerald-800 mb-4 flex items-center gap-2">🚀 کسٹم انٹرنیشنل SEO میٹا ٹیگز (اختیاری)</h4>
          <p className="text-xs text-gray-500 mb-4">اگر آپ یہ سیکشن خالی چھوڑیں گے، تو سسٹم خودکار طور پر اوپر والے ٹائٹل اور مواد سے گوگل فرینڈلی میٹا رینڈر کر لے گا۔</p>
          
          <div className="grid grid-cols-1 gap-5">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">سرچ انجن میٹا ٹائٹل (Meta Title)</label>
                <span className={`text-xs ${form.metaTitle.length > 60 ? 'text-red-500 font-bold' : 'text-gray-400'}`}>{form.metaTitle.length} / 60 حروف</span>
              </div>
              <input
                type="text"
                placeholder="گوگل سرچ رزلٹ میں دکھانے کا مخصوص ٹائٹل"
                value={form.metaTitle}
                onChange={e => setForm({ ...form, metaTitle: e.target.value })}
                className="border border-gray-300 bg-white rounded-lg p-3 w-full focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">سرچ انجن میٹا ڈیسکرپشن (Meta Description)</label>
                <span className={`text-xs ${form.metaDescription.length > 160 ? 'text-red-500 font-bold' : 'text-gray-400'}`}>{form.metaDescription.length} / 160 حروف</span>
              </div>
              <textarea
                placeholder="گوگل کے سرچ رزلٹ پیج کے نیچے نظر آنے والا 2 لائنوں کا خلاصہ..."
                value={form.metaDescription}
                onChange={e => setForm({ ...form, metaDescription: e.target.value })}
                rows={3}
                className="border border-gray-300 bg-white rounded-lg p-3 w-full focus:ring-2 focus:ring-emerald-500 outline-none text-sm resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">کینونیکل یو آر ایل (Canonical URL)</label>
              <input
                type="url"
                placeholder="https://yourwebsite.com/articles/custom-slug"
                value={form.canonicalUrl}
                onChange={e => setForm({ ...form, canonicalUrl: e.target.value })}
                dir="ltr"
                className="border border-gray-300 bg-white rounded-lg p-3 w-full focus:ring-2 focus:ring-emerald-500 outline-none text-sm text-left"
              />
            </div>
          </div>
        </div>

        {/* Links input */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">ریفرنس لنکس (کوما سے الگ URLs)</label>
          <input
            type="text"
            placeholder="https://example.com"
            value={form.links}
            onChange={e => setForm({ ...form, links: e.target.value })}
            dir="ltr"
            className="border border-gray-300 rounded-lg p-3 w-full text-left focus:ring-2 focus:ring-teal-500 outline-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="mt-10 flex justify-end gap-4" dir="ltr">
          <button
            type="submit"
            disabled={loading}
            className={`px-10 py-3 rounded-xl font-medium flex items-center gap-2 transition shadow-md ${loading ? 'bg-teal-400 text-white cursor-not-allowed' : 'bg-teal-600 text-white hover:bg-teal-700'}`}
          >
            {loading ? 'محفوظ ہو رہا ہے...' : isEditing ? 'اپ ڈیٹ کریں' : 'شامل کریں'}
          </button>
          {isEditing && (
            <button type="button" onClick={resetForm} className="px-10 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl transition shadow-md">منسوخ کریں</button>
          )}
        </div>
      </form>

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-xl p-6 text-right">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-2xl font-bold text-teal-800">موجودہ آرٹیکلز ({articles.length})</h2>
          <button onClick={fetchArticles} className="bg-teal-100 text-teal-700 hover:bg-teal-200 px-5 py-2 rounded-lg transition flex items-center gap-2">ریفریش</button>
        </div>

        {articles.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <p className="text-gray-600 text-xl">ابھی کوئی آرٹیکل موجود نہیں ہے</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200" dir="rtl">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">ٹائٹل</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">کیٹگری</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">زبان</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تاریخ</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">عمل</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {articles.map(article => (
                  <tr key={article._id || article.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {article.thumbnail && (
                          <img className="h-10 w-10 rounded-full object-cover" src={article.thumbnail} alt="" />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">{article.title || 'بلا عنوان'}</div>
                          <div className="text-sm text-gray-500">{article.author || 'ایڈمن'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-teal-100 text-teal-800">{article.category || 'عام'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {article.language === 'ur' ? 'اردو' : article.language === 'ar' ? 'عربی' : 'انگریزی'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {article.createdAt ? new Date(article.createdAt).toLocaleDateString('ur-PK') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-3" dir="ltr">
                        <button onClick={() => handleEdit(article)} className="text-blue-600 hover:text-blue-800 transition">ایڈٹ</button>
                        <button onClick={() => handleDelete(article._id || article.id || '')} className="text-red-600 hover:text-red-800 transition">ڈیلیٹ</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}