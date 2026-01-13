// app/api/articles/[id]/view/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { userId } = await request.json();
    
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      return NextResponse.json(
        { error: 'Database connection not configured' },
        { status: 500 }
      );
    }
    
    const client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db();
    
    // چیک کریں کہ یہ user پہلے ہی دیکھ چکا ہے
    const viewedCollection = db.collection('article_views');
    
    const existingView = await viewedCollection.findOne({
      articleId: new ObjectId(id),
      userId: userId
    });
    
    if (!existingView) {
      // Get IP address from headers
      const ip = request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'unknown';
      
      // نئی view record شامل کریں
      await viewedCollection.insertOne({
        articleId: new ObjectId(id),
        userId: userId,
        viewedAt: new Date(),
        ip: ip
      });
      
      // آرٹیکل کے view count کو update کریں
      const articlesCollection = db.collection('articles');
      
      // unique views کو increment کریں
      await articlesCollection.updateOne(
        { _id: new ObjectId(id) },
        { 
          $inc: { uniqueViews: 1 },
          $set: { updatedAt: new Date() }
        }
      );
    }
    
    await client.close();
    
    return NextResponse.json({
      success: true,
      message: 'View count updated'
    });
    
  } catch (error) {
    console.error('Error updating view count:', error);
    return NextResponse.json(
      { error: 'Failed to update view count' },
      { status: 500 }
    );
  }
}