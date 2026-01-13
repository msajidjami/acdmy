// app/api/articles/authors/route.ts
import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

export async function GET() {
  try {
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      return NextResponse.json(['ایڈمن', 'مصنف 1', 'مصنف 2', 'مصنف 3']);
    }

    const client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db();
    
    // Correct way: Use $nin for multiple conditions
    const authors = await db.collection('articles')
      .distinct('author', { 
        author: { 
          $nin: [null, '', undefined] 
        } 
      })
      .then(auths => auths.filter(Boolean).sort());
    
    await client.close();
    
    // Return default authors if none found
    const defaultAuthors = ['ایڈمن', 'مصنف 1', 'مصنف 2', 'مصنف 3'];
    
    return NextResponse.json(
      authors && authors.length > 0 ? authors : defaultAuthors
    );
    
  } catch (error) {
    console.error('Error fetching authors:', error);
    return NextResponse.json(['ایڈمن', 'مصنف 1', 'مصنف 2', 'مصنف 3']);
  }
}