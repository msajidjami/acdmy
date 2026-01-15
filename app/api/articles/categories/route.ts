// app/api/articles/categories/route.ts
import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('MONGODB_URI is not defined');
}

const client = new MongoClient(uri);
let cachedCategories: string[] | null = null;

const defaultCategories = [
  'عبادات',
  'سیرت النبی',
  'قرآن پاک',
  'حدیث',
  'فقہ',
  'اخلاق',
  'تاریخ',
  'سائنس اور اسلام',
];

export const revalidate = 3600; // 1 گھنٹہ — بہت مناسب کیٹیگریز کے لیے
// یا export const dynamic = 'force-static'; اگر بالکل static چاہیے (تجویز نہیں)

export async function GET() {
  // اگر پہلے سے کیش ہے تو واپس کر دیں (in-memory cache)
  if (cachedCategories) {
    return NextResponse.json(cachedCategories);
  }

  try {
    await client.connect();
    const db = client.db();

    const categories = await db.collection('articles')
      .distinct('category', {
        category: { $nin: [null, '', undefined] }
      })
      .then(cats => cats.filter(Boolean).sort() as string[]);

    await client.close();

    cachedCategories = categories.length > 0 ? categories : defaultCategories;

    return NextResponse.json(cachedCategories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(defaultCategories);
  }
}