// app/api/articles/[id]/view/route.ts - Dynamic solution
import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

// Dynamic function that works with both Next.js 14 and 15
export async function POST(request: NextRequest, context: any) {
  try {
    // Handle both Promise and non-Promise params
    const params = context.params;
    const { id } = params.then ? await params : params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Article ID is required' },
        { status: 400 }
      );
    }

    // باقی کوڈ وہی رہے گا...
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error('MONGODB_URI is not configured');
      return NextResponse.json(
        { error: 'Database connection not configured' },
        { status: 500 }
      );
    }
    
    let client: MongoClient | null = null;
    
    try {
      client = new MongoClient(uri);
      await client.connect();
      
      const db = client.db();
      const viewedCollection = db.collection('article_views');
      
      const existingView = await viewedCollection.findOne({
        articleId: new ObjectId(id),
        userId: userId
      });
      
      if (!existingView) {
        const ip = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown';
        
        await viewedCollection.insertOne({
          articleId: new ObjectId(id),
          userId: userId,
          viewedAt: new Date(),
          ip: ip,
          userAgent: request.headers.get('user-agent') || 'unknown'
        });
        
        const articlesCollection = db.collection('articles');
        
        await articlesCollection.updateOne(
          { _id: new ObjectId(id) },
          { 
            $inc: { 
              uniqueViews: 1,
              views: 1 
            },
            $set: { updatedAt: new Date() }
          }
        );
        
        await client.close();
        
        return NextResponse.json({
          success: true,
          message: 'View count updated',
          data: {
            uniqueViewAdded: true
          }
        });
      } else {
        await client.close();
        
        return NextResponse.json({
          success: true,
          message: 'User has already viewed this article',
          data: {
            uniqueViewAdded: false
          }
        });
      }
      
    } catch (dbError) {
      console.error('Database error:', dbError);
      if (client) {
        await client.close();
      }
      return NextResponse.json(
        { error: 'Database operation failed' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Error updating view count:', error);
    return NextResponse.json(
      { error: 'Failed to update view count' },
      { status: 500 }
    );
  }
}