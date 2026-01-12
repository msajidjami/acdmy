import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/dbConnect';
import Article from '@/app/models/Article';
import { v2 as cloudinary } from 'cloudinary';
import type { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

// Cloudinary config (env سے)
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
    console.log('POST request received');

    const formData = await req.formData();

    const title = formData.get('title') as string;
    const content = formData.get('content') as string;

    console.log('Received title:', title);

    const language = (formData.get('language') as string) || 'en';
    const category = (formData.get('category') as string) || 'General';
    const author = (formData.get('author') as string) || 'Admin';

    let tags: string[] = [];
    try {
      tags = JSON.parse((formData.get('tags') as string) || '[]');
    } catch (e) {
      console.error('Tags parse error:', e);
      tags = [];
    }

    let links: string[] = [];
    try {
      links = JSON.parse((formData.get('links') as string) || '[]');
    } catch (e) {
      console.error('Links parse error:', e);
      links = [];
    }

    const thumbnailFile = formData.get('thumbnail') as File | null;

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    let thumbnailUrl = '';

    if (thumbnailFile && thumbnailFile.size > 0) {
      console.log('Uploading thumbnail to Cloudinary... File size:', thumbnailFile.size);

      const arrayBuffer = await thumbnailFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            { resource_type: 'image', folder: 'articles' },
            (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
              if (error) {
                console.error('Cloudinary upload error:', error);
                reject(error);
              } else if (result) {
                resolve(result);
              }
            }
          )
          .end(buffer);
      });

      thumbnailUrl = uploadResult.secure_url;
      console.log('Upload success! URL:', thumbnailUrl);
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
    console.error('Full POST error:', error.message, error.stack);
    return NextResponse.json(
      { error: 'Failed to create article', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectDB();

    const formData = await req.formData();

    const id = formData.get('id') as string;
    if (!id) {
      return NextResponse.json({ error: 'Article ID is required for update' }, { status: 400 });
    }

    const updateData: Partial<{
      title: string;
      content: string;
      language: string;
      category: string;
      author: string;
      tags: string[];
      links: string[];
      thumbnail: string;
    }> = {};

    if (formData.has('title')) updateData.title = formData.get('title') as string;
    if (formData.has('content')) updateData.content = formData.get('content') as string;
    if (formData.has('language')) updateData.language = formData.get('language') as string;
    if (formData.has('category')) updateData.category = formData.get('category') as string;
    if (formData.has('author')) updateData.author = formData.get('author') as string;

    if (formData.has('tags')) {
      try {
        updateData.tags = JSON.parse(formData.get('tags') as string || '[]');
      } catch {}
    }

    if (formData.has('links')) {
      try {
        updateData.links = JSON.parse(formData.get('links') as string || '[]');
      } catch {}
    }

    const thumbnailFile = formData.get('thumbnail') as File | null;
    if (thumbnailFile && thumbnailFile.size > 0) {
      const arrayBuffer = await thumbnailFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            { resource_type: 'image', folder: 'articles' },
            (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
              if (error) reject(error);
              else if (result) resolve(result);
            }
          )
          .end(buffer);
      });

      updateData.thumbnail = uploadResult.secure_url;
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
    console.error('PUT Error:', error.message, error.stack);
    return NextResponse.json({ error: 'Failed to update article' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const deleted = await Article.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Article deleted' });
  } catch (error) {
    console.error('DELETE Error:', error);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}