// app/admin/articles/page.tsx
'use client';

import { useState, useEffect } from 'react';
// import { useAuth } from '@/context/AuthContext'; // اگر auth ہے تو uncomment

export default function AdminArticles() {
  // const { isAdmin } = useAuth();
  // if (!isAdmin) return <div className="text-center py-20 text-red-600 text-xl">Access Denied</div>;

  const [articles, setArticles] = useState([]);
  const [form, setForm] = useState({
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
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    const res = await fetch('/api/articles');
    const data = await res.json();
    setArticles(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = {
      ...form,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      links: form.links.split(',').map((l) => l.trim()).filter(Boolean),
    };

    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing ? `/api/articles/${form.id}` : '/api/articles';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    resetForm();
    fetchArticles();
  };

  const handleEdit = (article: any) => {
    setForm({
      id: article._id,
      title: article.title,
      content: article.content,
      language: article.language,
      category: article.category || '',
      author: article.author || '',
      thumbnail: article.thumbnail || '',
      tags: article.tags.join(', '),
      links: article.links.join(', '),
    });
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('اس آرٹیکل کو ڈیلیٹ کریں؟')) {
      await fetch(`/api/articles/${id}`, { method: 'DELETE' });
      fetchArticles();
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
    setIsEditing(false);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-extrabold text-green-800 mb-10 text-center">
        ایڈمن پینل - آرٹیکلز کا انتظام
      </h1>

      {/* فارم */}
      <form onSubmit={handleSubmit} className="bg-white shadow-2xl rounded-2xl p-8 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ٹائٹل</label>
            <input
              type="text"
              placeholder="آرٹیکل کا ٹائٹل"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">کیٹگری</label>
            <input
              type="text"
              placeholder="کیٹگری (e.g., Quran, Hadith)"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">مصنف کا نام</label>
            <input
              type="text"
              placeholder="مصنف کا نام"
              value={form.author}
              onChange={(e) => setForm({ ...form, author: e.target.value })}
              className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">تھمبنل URL</label>
            <input
              type="url"
              placeholder="تھمبنل تصویر کا URL"
              value={form.thumbnail}
              onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
              className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">مواد (HTML سپورٹ)</label>
          <textarea
            placeholder="آرٹیکل کا مواد"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            required
            rows={8}
            className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">زبان</label>
            <select
              value={form.language}
              onChange={(e) => setForm({ ...form, language: e.target.value })}
              className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-green-500"
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
              placeholder="ٹیگز (comma separated)"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">لنکس (کوما سے الگ URLs)</label>
          <input
            type="text"
            placeholder="لنکس (comma separated URLs)"
            value={form.links}
            onChange={(e) => setForm({ ...form, links: e.target.value })}
            className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div className="mt-8 flex justify-end gap-4">
          <button
            type="submit"
            className="bg-green-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-700 transition"
          >
            {isEditing ? 'اپ ڈیٹ کریں' : 'شامل کریں'}
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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {articles.map((article: any) => (
          <div
            key={article._id}
            className="bg-white shadow-md rounded-lg p-6 flex flex-col justify-between"
          >
            <div>
              <h3 className="text-xl font-bold text-green-700 mb-2">{article.title}</h3>
              <p className="text-gray-600 text-sm mb-1">کیٹگری: {article.category || 'General'}</p>
              <p className="text-gray-600 text-sm mb-1">مصنف: {article.author || 'Admin'}</p>
              <p className="text-gray-600 text-sm mb-4">
                {article.language.toUpperCase()} • {article.views} دیکھا گیا
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => handleEdit(article)}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
              >
                ایڈٹ
              </button>
              <button
                onClick={() => handleDelete(article._id)}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
              >
                ڈیلیٹ
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}