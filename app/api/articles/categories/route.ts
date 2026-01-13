// app/api/articles/categories/route.ts
import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

export async function GET() {
  try {
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      return NextResponse.json([
        'عبادات', 
        'سیرت النبی', 
        'قرآن پاک', 
        'حدیث', 
        'فقہ', 
        'اخلاق', 
        'تاریخ', 
        'سائنس اور اسلام'
      ]);
    }

    const client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db();
    
    // Correct way: Use $nin for both null and empty string
    const categories = await db.collection('articles')
      .distinct('category', { 
        category: { 
          $nin: [null, '', undefined] 
        } 
      })
      .then(cats => cats.filter(Boolean).sort());
    
    await client.close();
    
    // Return default categories if none found
    const defaultCategories = [
      'عبادات', 
      'سیرت النبی', 
      'قرآن پاک', 
      'حدیث', 
      'فقہ', 
      'اخلاق', 
      'تاریخ', 
      'سائنس اور اسلام'
    ];
    
    return NextResponse.json(
      categories && categories.length > 0 ? categories : defaultCategories
    );
    
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json([
      'عبادات', 
      'سیرت النبی', 
      'قرآن پاک', 
      'حدیث', 
      'فقہ', 
      'اخلاق', 
      'تاریخ', 
      'سائنس اور اسلام'
    ]);
  }
}