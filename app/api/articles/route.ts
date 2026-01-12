import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/dbConnect';
import Article from '@/app/models/Article';
import { v2 as cloudinary } from 'cloudinary';

// Cloudinary سیٹ اپ
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET() {
  try {
    await connectDB();
    const articles = await Article.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json(articles);
  } catch (error) {
    console.error('Error fetching articles:', error);
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const formData = await req.formData();

    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const language = (formData.get('language') as string) || 'en';
    const category = (formData.get('category') as string) || 'General';
    const author = (formData.get('author') as string) || 'Admin';
    const tags = JSON.parse((formData.get('tags') as string) || '[]');
    const links = JSON.parse((formData.get('links') as string) || '[]');
    const thumbnailFile = formData.get('thumbnail') as File | null;

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    let thumbnailUrl = '';

    // اگر فائل اپ لوڈ کی گئی ہو تو Cloudinary پر اپ لوڈ کریں
    if (thumbnailFile && thumbnailFile.size > 0) {
      const arrayBuffer = await thumbnailFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            { resource_type: 'image', folder: 'articles' },
            (error, result) => (error ? reject(error) : resolve(result))
          )
          .end(buffer);
      });

      thumbnailUrl = (uploadResult as any).secure_url;
    }

    const article = await Article.create({
      title,
      content,
      language,
      category,
      author,
      thumbnail: thumbnailUrl,
      tags,
      links,
    });

    return NextResponse.json(
      { success: true, message: 'Article created successfully!', article },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('POST Error:', error);
    return NextResponse.json(
      { error: 'Failed to create article', details: error.message },
      { status: 500 }
    );
  }
}

// PUT (اپ ڈیٹ) - اگر نئی تصویر ہو تو اپ لوڈ کریں، پرانی رکھیں یا ڈیلیٹ کریں (اختیاری)
export async function PUT(req: NextRequest) {
  try {
    await connectDB();

    const formData = await req.formData();

    const id = formData.get('id') as string;
    if (!id) {
      return NextResponse.json({ error: 'Article ID is required for update' }, { status: 400 });
    }

    const updateData: any = {};

    // صرف جو فیلڈز آئیں ان کو اپ ڈیٹ کریں
    if (formData.has('title')) updateData.title = formData.get('title') as string;
    if (formData.has('content')) updateData.content = formData.get('content') as string;
    if (formData.has('language')) updateData.language = formData.get('language') as string;
    if (formData.has('category')) updateData.category = formData.get('category') as string;
    if (formData.has('author')) updateData.author = formData.get('author') as string;
    if (formData.has('tags')) updateData.tags = JSON.parse(formData.get('tags') as string || '[]');
    if (formData.has('links')) updateData.links = JSON.parse(formData.get('links') as string || '[]');

    // اگر نئی تصویر ہو تو اپ لوڈ کریں
    const thumbnailFile = formData.get('thumbnail') as File | null;
    if (thumbnailFile && thumbnailFile.size > 0) {
      const arrayBuffer = await thumbnailFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            { resource_type: 'image', folder: 'articles' },
            (error, result) => (error ? reject(error) : resolve(result))
          )
          .end(buffer);
      });

      updateData.thumbnail = (uploadResult as any).secure_url;
    }

    const updated = await Article.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    return NextResponse.json(
      { success: true, message: 'Article updated successfully!', article: updated },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('PUT Error:', error);
    return NextResponse.json({ error: 'Failed to update article' }, { status: 500 });
  }
}

// DELETE (اختیاری)
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 });
  }

  try {
    await connectDB();
    await Article.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}