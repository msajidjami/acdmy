// app/api/articles/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/dbConnect';
import Article from '@/app/models/Article';

export async function GET() {
  try {
    await connectDB();
    const articles = await Article.find({})
      .sort({ createdAt: -1 })
      .lean(); // lean() سے JSON serialization تیز ہو جاتی ہے

    return NextResponse.json(articles);
  } catch (error) {
    console.error('Error fetching articles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    // نئی فیلڈز کو بھی شامل کریں
    const article = await Article.create({
      title: body.title,
      content: body.content,
      language: body.language || 'en',
      category: body.category || 'General',
      author: body.author || 'Admin',
      thumbnail: body.thumbnail || '',
      tags: body.tags || [],
      links: body.links || [],
    });

    return NextResponse.json(article, { status: 201 });
  } catch (error: any) {
    console.error('Error creating article:', error);

    // اگر validation error ہو (مثلاً required فیلڈ خالی)
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json({ error: messages.join(', ') }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to create article' },
      { status: 500 }
    );
  }
}