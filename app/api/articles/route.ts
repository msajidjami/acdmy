// app/api/articles/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/dbConnect';
import Article from '@/app/models/Article';
import { v2 as cloudinary } from 'cloudinary';

// Cloudinary config
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
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        folder: 'articles',
        transformation: [
          { width: 1200, height: 630, crop: 'fill' },
          { quality: 'auto' },
          { fetch_format: 'auto' }
        ]
      },
      (error, result) => {
        if (error) reject(new Error(`Cloudinary upload failed: ${error.message}`));
        else if (result) resolve(result.secure_url);
        else reject(new Error('Cloudinary upload failed: No result'));
      }
    );
    uploadStream.end(buffer);
  });
}

function decodeFormData(value: string): string {
  if (!value) return '';
  try {
    if (value.includes('%') || value.includes('+')) {
      return decodeURIComponent(value.replace(/\+/g, ' '));
    }
    return value;
  } catch {
    return value;
  }
}

// ─── GET ──────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const language = searchParams.get('language');
    const sort = searchParams.get('sort');
    const author = searchParams.get('author');
    const tag = searchParams.get('tag');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);

    const query: any = {};
    if (category && category !== 'all') query.category = decodeFormData(category);
    if (language && language !== 'all') query.language = language;
    if (author) query.author = decodeFormData(author);
    if (tag) query.tags = { $in: [decodeFormData(tag)] };

    let sortOptions: any = { createdAt: -1 };
    if (sort === 'views' || sort === 'popular') sortOptions = { views: -1, createdAt: -1 };
    else if (sort === 'latest') sortOptions = { createdAt: -1 };

    const skip = (page - 1) * limit;
    const articles = await Article.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .select('-__v')
      .lean();

    const totalArticles = await Article.countDocuments(query);
    const totalPages = Math.ceil(totalArticles / limit);

    const serializedArticles = articles.map((article: any) => ({
      _id: article._id?.toString() || '',
      title: article.title || 'بلا عنوان',
      thumbnail: article.thumbnail || '',
      category: article.category || 'عام',
      language: article.language || 'ur',
      author: article.author || 'ایڈمن',
      excerpt: article.excerpt || '',
      content: article.content || '',
      createdAt: article.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: article.updatedAt?.toISOString() || new Date().toISOString(),
      views: article.views || 0,
      uniqueViews: article.uniqueViews || 0,
      tags: article.tags || [],
      links: article.links || [],
    }));

    return NextResponse.json({
      success: true,
      data: serializedArticles,
      pagination: {
        page,
        limit,
        total: totalArticles,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error: any) {
    console.error('GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch articles', details: error.message },
      { status: 500 }
    );
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const formData = await request.formData();

    // 1. Extract and decode fields
    const title = decodeFormData(formData.get('title') as string || '').trim();
    const content = decodeFormData(formData.get('content') as string || '').trim();
    const language = (formData.get('language') as string) || 'ur';
    const category = decodeFormData(formData.get('category') as string || '').trim() || 'General';
    const author = decodeFormData(formData.get('author') as string || '').trim() || 'Admin';
    const tagsInput = formData.get('tags') as string || '';
    const linksInput = formData.get('links') as string || '';
    const thumbnailFile = formData.get('thumbnail') as File | null;

    // 2. Validate required fields
    if (!title) {
      return NextResponse.json(
        { success: false, error: 'عنوان درکار ہے' },
        { status: 400 }
      );
    }
    if (!content) {
      return NextResponse.json(
        { success: false, error: 'مواد درکار ہے' },
        { status: 400 }
      );
    }

    // 3. Auto‑generate excerpt from content (first 160 characters, strip HTML)
    const plainText = content.replace(/<[^>]+>/g, '');
    const excerpt = plainText.substring(0, 160) + (plainText.length > 160 ? '…' : '');

    // 4. Parse tags
    let tags: string[] = [];
    if (tagsInput) {
      try {
        const parsed = JSON.parse(tagsInput);
        if (Array.isArray(parsed)) {
          tags = parsed.map((t: string) => decodeFormData(t).trim()).filter(Boolean);
        }
      } catch {
        tags = tagsInput.split(',').map(t => decodeFormData(t.trim())).filter(Boolean);
      }
    }

    // 5. Parse links
    let links: string[] = [];
    if (linksInput) {
      try {
        const parsed = JSON.parse(linksInput);
        if (Array.isArray(parsed)) {
          links = parsed.map((l: string) => l.trim()).filter(Boolean);
        }
      } catch {
        links = linksInput.split(',').map(l => l.trim()).filter(Boolean);
      }
    }

    // 6. Upload thumbnail if provided
    let thumbnailUrl = '';
    if (thumbnailFile && thumbnailFile.size > 0) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(thumbnailFile.type)) {
        return NextResponse.json(
          { success: false, error: 'غلط فائل قسم۔ صرف JPEG, PNG, WebP اور GIF کی اجازت ہے۔' },
          { status: 400 }
        );
      }
      const maxSize = 5 * 1024 * 1024;
      if (thumbnailFile.size > maxSize) {
        return NextResponse.json(
          { success: false, error: 'فائل سائز بہت بڑا ہے۔ زیادہ سے زیادہ سائز 5MB ہے۔' },
          { status: 400 }
        );
      }
      try {
        thumbnailUrl = await uploadToCloudinary(thumbnailFile);
      } catch (uploadError: any) {
        console.error('Thumbnail upload failed:', uploadError);
        // Continue without thumbnail
      }
    }

    // 7. Create article
    const articleData = {
      title,
      content,
      excerpt,
      language,
      category,
      author,
      thumbnail: thumbnailUrl,
      tags,
      links,
      views: 0,
      uniqueViews: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const article = await Article.create(articleData);

    return NextResponse.json(
      {
        success: true,
        message: 'آرٹیکل کامیابی سے تخلیق ہو گیا!',
        data: {
          _id: article._id.toString(),
          title: article.title,
          category: article.category,
          author: article.author,
          thumbnail: article.thumbnail,
          createdAt: article.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('POST error:', error);

    // Handle duplicate key error (if title has unique index)
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'آرٹیکل کا عنوان پہلے سے موجود ہے' },
        { status: 409 }
      );
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { success: false, error: 'ویلڈیشن غلطی', details: messages.join(', ') },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'آرٹیکل تخلیق کرنے میں ناکامی',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// ─── PUT ──────────────────────────────────────────────────────────────────

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const formData = await request.formData();
    const id = formData.get('id') as string;
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'آرٹیکل آئی ڈی درکار ہے' },
        { status: 400 }
      );
    }

    const existing = await Article.findById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'آرٹیکل نہیں ملا' },
        { status: 404 }
      );
    }

    const updateData: any = { updatedAt: new Date() };

    // Update fields if provided
    if (formData.has('title')) {
      const val = decodeFormData(formData.get('title') as string || '').trim();
      if (val) updateData.title = val;
    }
    if (formData.has('content')) {
      const val = decodeFormData(formData.get('content') as string || '').trim();
      if (val) {
        updateData.content = val;
        // Re‑generate excerpt
        const plain = val.replace(/<[^>]+>/g, '');
        updateData.excerpt = plain.substring(0, 160) + (plain.length > 160 ? '…' : '');
      }
    }
    if (formData.has('language')) updateData.language = formData.get('language') as string;
    if (formData.has('category')) {
      const val = decodeFormData(formData.get('category') as string || '').trim();
      if (val) updateData.category = val;
    }
    if (formData.has('author')) {
      const val = decodeFormData(formData.get('author') as string || '').trim();
      if (val) updateData.author = val;
    }

    // Tags
    if (formData.has('tags')) {
      const input = formData.get('tags') as string || '';
      let tags: string[] = [];
      if (input) {
        try {
          const parsed = JSON.parse(input);
          if (Array.isArray(parsed)) tags = parsed.map((t: string) => decodeFormData(t).trim()).filter(Boolean);
        } catch {
          tags = input.split(',').map(t => decodeFormData(t.trim())).filter(Boolean);
        }
      }
      updateData.tags = tags;
    }

    // Links
    if (formData.has('links')) {
      const input = formData.get('links') as string || '';
      let links: string[] = [];
      if (input) {
        try {
          const parsed = JSON.parse(input);
          if (Array.isArray(parsed)) links = parsed.map((l: string) => l.trim()).filter(Boolean);
        } catch {
          links = input.split(',').map(l => l.trim()).filter(Boolean);
        }
      }
      updateData.links = links;
    }

    // Thumbnail
    const thumbnailFile = formData.get('thumbnail') as File | null;
    if (thumbnailFile && thumbnailFile.size > 0) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(thumbnailFile.type)) {
        return NextResponse.json(
          { success: false, error: 'غلط فائل قسم۔ صرف JPEG, PNG, WebP اور GIF کی اجازت ہے۔' },
          { status: 400 }
        );
      }
      const maxSize = 5 * 1024 * 1024;
      if (thumbnailFile.size > maxSize) {
        return NextResponse.json(
          { success: false, error: 'فائل سائز بہت بڑا ہے۔ زیادہ سے زیادہ سائز 5MB ہے۔' },
          { status: 400 }
        );
      }
      try {
        updateData.thumbnail = await uploadToCloudinary(thumbnailFile);
      } catch (uploadError: any) {
        console.error('Thumbnail upload failed:', uploadError);
      }
    }

    const updated = await Article.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true });

    return NextResponse.json({
      success: true,
      message: 'آرٹیکل کامیابی سے اپ ڈیٹ ہو گیا!',
      data: { _id: updated?._id?.toString(), title: updated?.title },
    });
  } catch (error: any) {
    console.error('PUT error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { success: false, error: 'ویلڈیشن غلطی', details: messages.join(', ') },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'آرٹیکل اپ ڈیٹ کرنے میں ناکامی' },
      { status: 500 }
    );
  }
}

// ─── DELETE ──────────────────────────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'آرٹیکل آئی ڈی درکار ہے' },
        { status: 400 }
      );
    }

    const deleted = await Article.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'آرٹیکل نہیں ملا' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'آرٹیکل کامیابی سے حذف ہو گیا!',
    });
  } catch (error: any) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'آرٹیکل حذف کرنے میں ناکامی' },
      { status: 500 }
    );
  }
}

// ─── PATCH ─────────────────────────────────────────────────────────────────

export async function PATCH(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const action = searchParams.get('action');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'آرٹیکل آئی ڈی درکار ہے' },
        { status: 400 }
      );
    }

    let updateData: any = {};
    if (action === 'increment-views') {
      updateData = { $inc: { views: 1 }, updatedAt: new Date() };
    } else if (action === 'increment-unique-views') {
      updateData = { $inc: { uniqueViews: 1 }, updatedAt: new Date() };
    } else {
      return NextResponse.json(
        { success: false, error: 'غلط ایکشن' },
        { status: 400 }
      );
    }

    const updated = await Article.findByIdAndUpdate(id, updateData, { new: true });
    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'آرٹیکل نہیں ملا' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'آرٹیکل کامیابی سے اپ ڈیٹ ہو گیا!',
      data: { _id: updated._id.toString(), views: updated.views, uniqueViews: updated.uniqueViews },
    });
  } catch (error: any) {
    console.error('PATCH error:', error);
    return NextResponse.json(
      { success: false, error: 'آرٹیکل اپ ڈیٹ کرنے میں ناکامی' },
      { status: 500 }
    );
  }
}