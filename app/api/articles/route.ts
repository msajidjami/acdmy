// app/api/articles/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/dbConnect';
import Article from '@/app/models/Article';
import { v2 as cloudinary } from 'cloudinary';
import type { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
});

// Helper function to upload image to Cloudinary
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
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(new Error(`Cloudinary upload failed: ${error.message}`));
        } else if (result) {
          resolve(result.secure_url);
        } else {
          reject(new Error('Cloudinary upload failed: No result'));
        }
      }
    );
    
    uploadStream.end(buffer);
  });
}

// GET: Fetch all articles with filters
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const language = searchParams.get('language');
    const sort = searchParams.get('sort');
    const author = searchParams.get('author');
    const tag = searchParams.get('tag');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    
    // Build query
    const query: any = {};
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (language) {
      query.language = language;
    }
    
    if (author) {
      query.author = author;
    }
    
    if (tag) {
      query.tags = { $in: [tag] };
    }
    
    // Build sort options
    let sortOptions: any = { createdAt: -1 }; // Default: newest first
    
    if (sort === 'popular') {
      sortOptions = { uniqueViews: -1, views: -1, createdAt: -1 };
    } else if (sort === 'views') {
      sortOptions = { views: -1 };
    } else if (sort === 'latest') {
      sortOptions = { createdAt: -1 };
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Fetch articles with pagination
    const articles = await Article.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .select('-__v')
      .lean();
    
    // Get total count for pagination
    const totalArticles = await Article.countDocuments(query);
    const totalPages = Math.ceil(totalArticles / limit);
    
    // Convert _id to string and add safe defaults
    const serializedArticles = articles.map((article: any) => ({
      _id: article._id?.toString() || '',
      title: article.title || 'بلا عنوان',
      thumbnail: article.thumbnail,
      category: article.category || 'عام',
      language: article.language || 'ur',
      author: article.author || 'ایڈمن',
      excerpt: article.excerpt,
      content: article.content,
      createdAt: article.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: article.updatedAt?.toISOString() || new Date().toISOString(),
      views: article.views || 0,
      uniqueViews: article.uniqueViews || article.views || 0,
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
        hasPrevPage: page > 1
      }
    });
    
  } catch (error: any) {
    console.error('Error fetching articles:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch articles',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// POST: Create new article
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    console.log('POST request received for creating article');

    const formData = await req.formData();

    // Extract required fields
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;

    console.log('Received title:', title);

    // Validate required fields
    if (!title || !title.trim()) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Title is required' 
        }, 
        { status: 400 }
      );
    }

    if (!content || !content.trim()) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Content is required' 
        }, 
        { status: 400 }
      );
    }

    // Extract optional fields with defaults
    const language = (formData.get('language') as string) || 'ur';
    const category = (formData.get('category') as string) || 'عام';
    const author = (formData.get('author') as string) || 'ایڈمن';
    const excerpt = formData.get('excerpt') as string || '';

    // Parse tags and links
    let tags: string[] = [];
    const tagsInput = formData.get('tags') as string;
    if (tagsInput) {
      try {
        const parsedTags = JSON.parse(tagsInput);
        tags = Array.isArray(parsedTags) ? parsedTags : [];
      } catch (e) {
        console.error('Tags parse error:', e);
        tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag);
      }
    }

    let links: string[] = [];
    const linksInput = formData.get('links') as string;
    if (linksInput) {
      try {
        const parsedLinks = JSON.parse(linksInput);
        links = Array.isArray(parsedLinks) ? parsedLinks : [];
      } catch (e) {
        console.error('Links parse error:', e);
        links = linksInput.split(',').map(link => link.trim()).filter(link => link);
      }
    }

    // Handle thumbnail upload
    let thumbnailUrl = '';
    const thumbnailFile = formData.get('thumbnail') as File | null;

    if (thumbnailFile && thumbnailFile.size > 0) {
      console.log('Uploading thumbnail to Cloudinary... File size:', thumbnailFile.size);
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(thumbnailFile.type)) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' 
          }, 
          { status: 400 }
        );
      }
      
      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (thumbnailFile.size > maxSize) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'File size too large. Maximum size is 5MB.' 
          }, 
          { status: 400 }
        );
      }
      
      try {
        thumbnailUrl = await uploadToCloudinary(thumbnailFile);
        console.log('Upload success! URL:', thumbnailUrl);
      } catch (uploadError: any) {
        console.error('Thumbnail upload failed:', uploadError);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Failed to upload thumbnail',
            details: uploadError.message 
          }, 
          { status: 500 }
        );
      }
    }

    // Create article in database
    const articleData = {
      title: title.trim(),
      content: content.trim(),
      excerpt: excerpt.trim(),
      language,
      category: category.trim(),
      author: author.trim(),
      thumbnail: thumbnailUrl,
      tags,
      links,
      views: 0,
      uniqueViews: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const article = await Article.create(articleData);

    console.log('Article created successfully:', article._id);

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
          createdAt: article.createdAt
        }
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Full POST error:', error.message, error.stack);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'آرٹیکل کا عنوان پہلے سے موجود ہے',
          details: 'Duplicate title'
        },
        { status: 409 }
      );
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { 
          success: false, 
          error: 'ویلڈیشن غلطی',
          details: validationErrors 
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'آرٹیکل تخلیق کرنے میں ناکامی',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// PUT: Update article
export async function PUT(req: NextRequest) {
  try {
    await connectDB();

    const formData = await req.formData();

    const id = formData.get('id') as string;
    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'آرٹیکل آئی ڈی درکار ہے' 
        }, 
        { status: 400 }
      );
    }

    // Check if article exists
    const existingArticle = await Article.findById(id);
    if (!existingArticle) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'آرٹیکل نہیں ملا' 
        }, 
        { status: 404 }
      );
    }

    const updateData: any = { updatedAt: new Date() };

    // Update fields if provided
    if (formData.has('title')) {
      const title = formData.get('title') as string;
      if (title && title.trim()) {
        updateData.title = title.trim();
      }
    }

    if (formData.has('content')) {
      const content = formData.get('content') as string;
      if (content && content.trim()) {
        updateData.content = content.trim();
      }
    }

    if (formData.has('excerpt')) {
      updateData.excerpt = (formData.get('excerpt') as string) || '';
    }

    if (formData.has('language')) {
      updateData.language = formData.get('language') as string;
    }

    if (formData.has('category')) {
      const category = formData.get('category') as string;
      if (category && category.trim()) {
        updateData.category = category.trim();
      }
    }

    if (formData.has('author')) {
      const author = formData.get('author') as string;
      if (author && author.trim()) {
        updateData.author = author.trim();
      }
    }

    // Handle tags
    if (formData.has('tags')) {
      const tagsInput = formData.get('tags') as string;
      if (tagsInput) {
        try {
          const parsedTags = JSON.parse(tagsInput);
          updateData.tags = Array.isArray(parsedTags) ? parsedTags : [];
        } catch (e) {
          updateData.tags = tagsInput.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag);
        }
      }
    }

    // Handle links
    if (formData.has('links')) {
      const linksInput = formData.get('links') as string;
      if (linksInput) {
        try {
          const parsedLinks = JSON.parse(linksInput);
          updateData.links = Array.isArray(parsedLinks) ? parsedLinks : [];
        } catch (e) {
          updateData.links = linksInput.split(',').map((link: string) => link.trim()).filter((link: string) => link);
        }
      }
    }

    // Handle thumbnail upload if new file provided
    const thumbnailFile = formData.get('thumbnail') as File | null;
    if (thumbnailFile && thumbnailFile.size > 0) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(thumbnailFile.type)) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'غلط فائل قسم۔ صرف JPEG، PNG، WebP اور GIF کی اجازت ہے۔' 
          }, 
          { status: 400 }
        );
      }
      
      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (thumbnailFile.size > maxSize) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'فائل سائز بہت بڑا ہے۔ زیادہ سے زیادہ سائز 5MB ہے۔' 
          }, 
          { status: 400 }
        );
      }
      
      try {
        const thumbnailUrl = await uploadToCloudinary(thumbnailFile);
        updateData.thumbnail = thumbnailUrl;
      } catch (uploadError: any) {
        console.error('Thumbnail upload failed:', uploadError);
        return NextResponse.json(
          { 
            success: false, 
            error: 'تھمب نیل اپلوڈ کرنے میں ناکامی',
            details: uploadError.message 
          }, 
          { status: 500 }
        );
      }
    } else if (formData.has('thumbnail') && !thumbnailFile) {
      // If thumbnail field exists but empty, remove thumbnail
      updateData.thumbnail = '';
    }

    // Update article
    const updatedArticle = await Article.findByIdAndUpdate(
      id,
      { $set: updateData },
      {
        new: true,
        runValidators: true,
      }
    ).select('-__v').lean();

    return NextResponse.json({
      success: true,
      message: 'آرٹیکل کامیابی سے اپ ڈیٹ ہو گیا!',
      data: {
        ...updatedArticle,
        _id: updatedArticle?._id?.toString()
      }
    });

  } catch (error: any) {
    console.error('PUT Error:', error.message, error.stack);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { 
          success: false, 
          error: 'ویلڈیشن غلطی',
          details: validationErrors 
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'آرٹیکل اپ ڈیٹ کرنے میں ناکامی',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// DELETE: Delete article
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'آرٹیکل آئی ڈی درکار ہے' 
        }, 
        { status: 400 }
      );
    }

    // Check if article exists
    const article = await Article.findById(id);
    if (!article) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'آرٹیکل نہیں ملا' 
        }, 
        { status: 404 }
      );
    }

    // If article has thumbnail on Cloudinary, you might want to delete it too
    // Note: This would require additional Cloudinary setup
    const deletedArticle = await Article.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'آرٹیکل کامیابی سے حذف ہو گیا!',
      data: {
        _id: deletedArticle?._id?.toString(),
        title: deletedArticle?.title
      }
    });

  } catch (error: any) {
    console.error('DELETE Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'آرٹیکل حذف کرنے میں ناکامی',
        details: error.message 
      }, 
      { status: 500 }
    );
  }
}

// PATCH: Update specific fields (like view count)
export async function PATCH(req: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const action = searchParams.get('action');
    
    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'آرٹیکل آئی ڈی درکار ہے' 
        }, 
        { status: 400 }
      );
    }
    
    const article = await Article.findById(id);
    if (!article) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'آرٹیکل نہیں ملا' 
        }, 
        { status: 404 }
      );
    }
    
    let updateData: any = {};
    
    switch (action) {
      case 'increment-views':
        updateData = { 
          $inc: { views: 1 },
          updatedAt: new Date()
        };
        break;
        
      case 'increment-unique-views':
        updateData = { 
          $inc: { uniqueViews: 1 },
          updatedAt: new Date()
        };
        break;
        
      default:
        return NextResponse.json(
          { 
            success: false, 
            error: 'غلط ایکشن' 
          }, 
          { status: 400 }
        );
    }
    
    const updated = await Article.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).select('-__v').lean();
    
    return NextResponse.json({
      success: true,
      message: 'آرٹیکل کامیابی سے اپ ڈیٹ ہو گیا!',
      data: {
        ...updated,
        _id: updated?._id?.toString()
      }
    });
    
  } catch (error: any) {
    console.error('PATCH Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'آرٹیکل اپ ڈیٹ کرنے میں ناکامی',
        details: error.message 
      }, 
      { status: 500 }
    );
  }
}