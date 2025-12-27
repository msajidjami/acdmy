// app/actions/getHomeData.ts
'use server'; // یہ server action بناتا ہے

import { dbConnect } from '@/app/lib/dbConnect';
import Review from '@/app/models/Review';
import Counter from '@/app/models/Counter';

export async function getHomeData() {
  await dbConnect();
  const [reviews, counter] = await Promise.all([
    Review.find({}).sort({ date: -1 }).limit(6).lean(),
    Counter.findOne({}).lean(),
  ]);
  return { reviews, counter };
}