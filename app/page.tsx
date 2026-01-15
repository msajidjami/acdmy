// app/page.tsx (اب یہ پروڈکشن میں چل جائے گا - cookies ہٹا دیا گیا)

import { Suspense } from 'react';
import HomeContent from './components/HomeContent';
import UserDashboard from './components/UserDashboard';
import connectDB from '@/app/lib/dbConnect';
import Review from '@/app/models/Review';
import Admission from '@/app/models/Admission';

async function getReviews() {
  try {
    await connectDB();
    
    const reviews = await Review.find({})
      .sort({ date: -1 })
      .limit(6)
      .lean();

    return reviews.map((review: any) => ({
      ...review,
      _id: review._id.toString(),
      date: review.date?.toISOString() || new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }
}

async function getArticles() {
  try {
    await connectDB();
    
    try {
      const Article = require('@/app/models/Article').default;
      
      const articles = await Article.find({})
        .sort({ createdAt: -1 })
        .limit(6)
        .lean();

      return articles.map((article: any) => ({
        ...article,
        _id: article._id.toString(),
        createdAt: article.createdAt?.toISOString() || new Date().toISOString(),
      }));
    } catch {
      console.log('Article model not available, using static data');
      return getStaticArticles();
    }
  } catch (error) {
    console.error('Error fetching articles:', error);
    return getStaticArticles();
  }
}

function getStaticArticles() {
  return [
    {
      _id: '1',
      title: 'نماز کی اہمیت اور اس کے فضائل',
      excerpt: 'نماز اسلام کا دوسرا رکن ہے اور اس کی اہمیت قرآن و حدیث میں بہت واضح ہے۔',
      thumbnail: 'https://images.unsplash.com/photo-1567958451986-2c8f4eb6b2b3?w=800&auto=format&fit=crop',
      category: 'نماز',
      author: 'مولانا عبدالرحمٰن',
      views: 1500,
      createdAt: '2024-01-15T10:30:00Z',
      tags: ['نماز', 'فرض', 'اسلام'],
    },
    // ... باقی 5 آرٹیکلز (آپ اپنے اصل کوڈ سے پورا پیسٹ کر لیں)
  ];
}

async function getCounter() {
  try {
    await connectDB();

    const enrolledCount = await Admission.countDocuments({
      currentStatus: { $in: ['enrolled', 'in-progress', 'completed'] }
    });

    const completedCount = await Admission.countDocuments({
      currentStatus: ['completed', 'dropped']
    });

    return {
      enrolled: enrolledCount || 0,
      completed: completedCount || 0,
      teachers: 25
    };
  } catch (error) {
    console.error('Error fetching counters:', error);
    return { enrolled: 500, completed: 1000, teachers: 25 };
  }
}

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [reviews, counter, articles] = await Promise.all([
    getReviews(),
    getCounter(),
    getArticles(),
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* ڈیبگ انفو */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 right-4 z-50 bg-yellow-100 border border-yellow-300 rounded-lg p-4 text-xs shadow-lg max-w-sm">
          <div className="font-bold mb-2 text-amber-800">🔧 Debug Info</div>
          <div>Articles: {articles?.length || 0}</div>
          <div>Reviews: {reviews?.length || 0}</div>
          <div className="mt-2 pt-2 border-t border-yellow-300">
            <div className="font-bold">Live Counters:</div>
            <div>Enrolled: {counter.enrolled}+</div>
            <div>Completed: {counter.completed}+</div>
            <div>Teachers: {counter.teachers}+</div>
          </div>
        </div>
      )}

      <section className="py-8 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200">
        <div className="container mx-auto px-6">
          <UserDashboard user={undefined} />
        </div>
      </section>

      <div className="fixed bottom-8 right-8 z-50 flex flex-col space-y-4">
        <a
          href="/login"
          className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-full shadow-lg font-medium flex items-center justify-center space-x-2 transition-all hover:shadow-xl hover:scale-105"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
          <span>لاگ ان / سائن اپ</span>
        </a>
      </div>

      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">لوڈ ہو رہا ہے...</div>}>
        <HomeContent 
          reviews={reviews} 
          counter={counter} 
          articles={articles}
        />
      </Suspense>
    </div>
  );
}