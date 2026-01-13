'use client';

import { useState, useEffect, useRef } from 'react';

export default function AdminArticles() {
  const [articles, setArticles] = useState<any[]>([]);
  const [form, setForm] = useState({
    id: '',
    title: '',
    content: '',
    language: 'en',
    category: '',
    author: '',
    thumbnail: '', // یہ اب URL ہوگا (اپ لوڈ کے بعد)
    tags: '',
    links: '',
  });
  const [thumbnailPreview, setThumbnailPreview] = useState<string>(''); // پیش نظارہ کے لیے
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null); // اپ لوڈ کے لیے فائل
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const res = await fetch('/api/articles');
      if (!res.ok) throw new Error('Failed to fetch articles');
      
      const response = await res.json();
      
      // API response کو process کریں - مختلف فارمیٹس کے لیے
      let dataArray: any[] = [];
      
      if (Array.isArray(response)) {
        // Direct array response
        dataArray = response;
      } else if (response && typeof response === 'object') {
        // Object with data property
        if (response.success && Array.isArray(response.data)) {
          dataArray = response.data;
        } else if (Array.isArray(response.data)) {
          dataArray = response.data;
        } else {
          console.error('Unexpected response format:', response);
        }
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

    // ٹیکسٹ فیلڈز
    formData.append('title', form.title);
    formData.append('content', form.content);
    formData.append('language', form.language);
    formData.append('category', form.category);
    formData.append('author', form.author);
    formData.append('tags', JSON.stringify(form.tags.split(',').map(t => t.trim()).filter(Boolean)));
    formData.append('links', JSON.stringify(form.links.split(',').map(l => l.trim()).filter(Boolean)));

    // ایڈٹ موڈ میں ID
    if (isEditing && form.id) {
      formData.append('id', form.id);
    }

    // تصویر اگر نئی منتخب کی گئی ہو
    if (thumbnailFile) {
      formData.append('thumbnail', thumbnailFile);
    } else if (form.thumbnail && !thumbnailFile) {
      // اگر کوئی نئی فائل نہیں ہے لیکن existing thumbnail ہے تو اسے بھیجیں
      formData.append('existingThumbnail', form.thumbnail);
    }

    try {
      const method = isEditing ? 'PUT' : 'POST';
      const res = await fetch('/api/articles', {
        method,
        body: formData, // FormData استعمال کریں (multipart)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save article');
      }

      setMessage(data.message || (isEditing ? 'آرٹیکل کامیابی سے اپ ڈیٹ ہو گیا!' : 'آرٹیکل کامیابی سے شامل ہو گیا!'));
      resetForm();
      fetchArticles();
    } catch (err: any) {
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
      thumbnail: article.thumbnail || '', // موجودہ URL
      tags: article.tags?.join(', ') || '',
      links: article.links?.join(', ') || '',
    });
    setThumbnailPreview(article.thumbnail || ''); // موجودہ تھمبنل کا پیش نظارہ
    setThumbnailFile(null); // نئی فائل ابھی نہیں
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
    if (fileInputRef.current) fileInputRef.current.value = ''; // فائل ان پٹ صاف
  };

  return (
    <div className="container mx-auto pt-20 px-4 py-12">
      <h1 className="text-4xl font-extrabold text-green-800 mb-10 text-center">
        ایڈمن پینل - آرٹیکلز کا انتظام
      </h1>

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
              placeholder="آرٹیکل کا ٹائٹل"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">کیٹگری</label>
            <input
              type="text"
              placeholder="مثال: قرآن، حدیث، رمضان"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">مصنف کا نام</label>
            <input
              type="text"
              placeholder="مصنف کا نام"
              value={form.author}
              onChange={(e) => setForm({ ...form, author: e.target.value })}
              className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">تھمبنل تصویر اپ لوڈ کریں</label>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleThumbnailChange}
              className="border border-gray-300 rounded-lg p-3 w-full file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
            />
            {/* پیش نظارہ */}
            {(thumbnailPreview || form.thumbnail) && (
              <div className="mt-3">
                <p className="text-sm text-gray-600 mb-2">پیش نظارہ:</p>
                <img
                  src={thumbnailPreview || form.thumbnail}
                  alt="Thumbnail Preview"
                  className="w-40 h-32 object-cover rounded-lg border border-gray-300 shadow-sm"
                />
              </div>
            )}
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">مواد (HTML سپورٹڈ) *</label>
          <textarea
            placeholder="آرٹیکل کا مکمل مواد یہاں لکھیں..."
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            required
            rows={10}
            className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none resize-y"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">زبان</label>
            <select
              value={form.language}
              onChange={(e) => setForm({ ...form, language: e.target.value })}
              className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            >
              <option value="en">English</option>
              <option value="ur">Urdu</option>
              <option value="ar">Arabic</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ٹیگز (کوما سے الگ)</label>
            <input
              type="text"
              placeholder="مثال: رمضان, قرآن, تجوید"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">لنکس (کوما سے الگ URLs)</label>
          <input
            type="text"
            placeholder="مثال: https://example.com, https://youtube.com/..."
            value={form.links}
            onChange={(e) => setForm({ ...form, links: e.target.value })}
            className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
          />
        </div>

        <div className="mt-8 flex justify-end gap-4">
          <button
            type="submit"
            disabled={loading}
            className={`px-8 py-3 rounded-lg font-medium transition flex items-center gap-2 ${
              loading 
                ? 'bg-green-400 text-white cursor-not-allowed' 
                : 'bg-green-600 text-white hover:bg-green-700'
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
      <div>
        <h2 className="text-2xl font-bold text-green-800 mb-6">موجودہ آرٹیکلز ({articles.length})</h2>
        
        {articles.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-xl">
            <div className="text-5xl mb-4">📝</div>
            <p className="text-gray-500 text-lg">ابھی کوئی آرٹیکل موجود نہیں ہے۔</p>
            <p className="text-gray-400 mt-2">پہلا آرٹیکل شامل کرنے کے لیے اوپر فارم استعمال کریں۔</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <div
                key={article._id || article.id}
                className="bg-white shadow-lg rounded-xl p-6 flex flex-col justify-between hover:shadow-xl transition-shadow border border-green-100"
              >
                <div>
                  <h3 className="text-xl font-bold text-green-700 mb-2 line-clamp-2">{article.title}</h3>
                  {article.thumbnail && (
                    <img
                      src={article.thumbnail}
                      alt={article.title}
                      className="w-full h-48 object-cover rounded-lg mb-3"
                    />
                  )}
                  <div className="space-y-2 mb-4">
                    <p className="text-gray-600">
                      <span className="font-medium">کیٹگری:</span> {article.category || 'General'}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">مصنف:</span> {article.author || 'Admin'}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">زبان:</span> {article.language === 'ur' ? 'اردو' : article.language === 'ar' ? 'عربی' : 'انگریزی'}
                    </p>
                    <p className="text-gray-500 text-sm">
                      <span className="font-medium">تاریخ:</span> {new Date(article.createdAt).toLocaleDateString('ur-PK')}
                    </p>
                    {article.views && (
                      <p className="text-gray-500 text-sm">
                        <span className="font-medium">ویوز:</span> {article.views}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => handleEdit(article)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                    ایڈٹ
                  </button>
                  <button
                    onClick={() => handleDelete(article._id || article.id)}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    ڈیلیٹ
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}