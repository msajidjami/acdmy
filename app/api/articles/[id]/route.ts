// app/api/articles/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { isValidObjectId } from 'mongoose';
import connectDB from '@/app/lib/dbConnect';
import Article from '@/app/models/Article';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!id || !isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'Invalid article ID' },
        { status: 400 }
      );
    }

    const article = await Article.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    ).lean();

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(article);
  } catch (error) {
    console.error('Error in GET /api/articles/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!id || !isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'Invalid article ID' },
        { status: 400 }
      );
    }

    const body = await req.json();

    const article = await Article.findByIdAndUpdate(
      id,
      {
        title: body.title,
        content: body.content,
        language: body.language,
        category: body.category,
        author: body.author,
        thumbnail: body.thumbnail,
        tags: body.tags || [],
        links: body.links || [],
      },
      { new: true, runValidators: true }
    );

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(article);
  } catch (error: any) {
    console.error('Error in PUT /api/articles/[id]:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json({ error: messages.join(', ') }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to update article' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!id || !isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'Invalid article ID' },
        { status: 400 }
      );
    }

    const article = await Article.findByIdAndDelete(id);

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'آرٹیکل کامیابی سے ڈیلیٹ ہو گیا',
    });
  } catch (error) {
    console.error('Error in DELETE /api/articles/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to delete article' },
      { status: 500 }
    );
  }
}