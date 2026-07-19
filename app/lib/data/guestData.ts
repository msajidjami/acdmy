import connectDB from '@/app/lib/dbConnect';
import Review from '@/app/models/Review';
import Article from '@/app/models/Article';
import Admission from '@/app/models/Admission';

export async function fetchGuestData() {
  await connectDB();
  const [reviews, articles, enrolledCount] = await Promise.all([
    Review.find({}).sort({ date: -1 }).limit(6).lean(),
    Article.find({}).sort({ createdAt: -1 }).limit(6).lean(),
    Admission.countDocuments({ currentStatus: { $in: ['enrolled', 'in-progress', 'completed'] } }),
  ]);
  return {
    reviews: reviews.map((r: any) => ({ ...r, _id: r._id.toString() })),
    articles: articles.map((a: any) => ({ ...a, _id: a._id.toString() })),
    stats: { enrolled: enrolledCount || 450, completed: 1200, teachers: 35 },
  };
}