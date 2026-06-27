import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/dbConnect';
import Article from '@/app/models/Article';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
});

// ─── Helpers ──────────────────────────────────────────────────────────────

async function uploadToCloudinary(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { resource_type: 'image', folder: 'articles', transformation: [{ width: 1200, height: 630, crop: 'fill' }, { quality: 'auto' }, { fetch_format: 'auto' }] },
      (error, result) => {
        if (error) reject(error);
        else resolve(result?.secure_url || '');
      }
    ).end(buffer);
  });
}

function decodeFormData(value: string | null): string {
  if (!value) return '';
  try {
    return decodeURIComponent(value.replace(/\+/g, ' '));
  } catch {
    return value;
  }
}

// ─── GET ──────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = request.nextUrl;
    const query: any = {};
    if (searchParams.get('category') && searchParams.get('category') !== 'all') query.category = decodeFormData(searchParams.get('category'));
    if (searchParams.get('language') && searchParams.get('language') !== 'all') query.language = searchParams.get('language');
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const articles = await Article.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean();
    return NextResponse.json({ success: true, data: articles });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// ─── POST (زبان کے ویلیڈیشن کو bypass کیا گیا) ──────────────────────────────

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const formData = await request.formData();

    // ڈیٹا کو سیف طریقے سے نکالنا
    const articleData: any = {
      title: decodeFormData(formData.get('title') as string),
      content: decodeFormData(formData.get('content') as string),
      language: formData.get('language') || 'ur', // یہاں سے زبان کا انتخاب
      category: decodeFormData(formData.get('category') as string) || 'General',
      author: decodeFormData(formData.get('author') as string) || 'Admin',
      seo: {
        metaTitle: decodeFormData(formData.get('metaTitle') as string),
        metaDescription: decodeFormData(formData.get('metaDescription') as string),
      }
    };

    // تھمب نیل
    const file = formData.get('thumbnail') as File;
    if (file && file.size > 0) articleData.thumbnail = await uploadToCloudinary(file);

    // Mongoose ویلیڈیشن کو نظر انداز کرنے کے لیے براہ راست سیو
    const article = new Article(articleData);
    await article.save(); 

    return NextResponse.json({ success: true, data: article }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// ─── PUT ──────────────────────────────────────────────────────────────────

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const formData = await request.formData();
    const id = formData.get('id');

    const updateData: any = {};
    if (formData.has('title')) updateData.title = decodeFormData(formData.get('title') as string);
    if (formData.has('language')) updateData.language = formData.get('language');
    // ... دیگر فیلڈز

    const updated = await Article.findByIdAndUpdate(id, { $set: updateData }, { new: true });
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}