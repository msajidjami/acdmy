// app/api/articles/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/dbConnect';
import Article from '@/app/models/Article';
import { v2 as cloudinary } from 'cloudinary';
import mongoose from 'mongoose';

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
      (error, result) => {
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

// Helper function to decode UTF-8 text
function decodeUTF8(text: string): string {
  if (!text) return '';
  
  try {
    // Try to decode if it's encoded
    return decodeURIComponent(escape(text));
  } catch (e) {
    // If already properly encoded or not encoded, return as is
    return text;
  }
}

// Helper function to sanitize and validate text
function sanitizeText(text: string): string {
  if (!text) return '';
  
  // Remove any invalid characters
  return text.trim().replace(/[^\p{L}\p{N}\p{P}\p{Z}\p{Sm}\p{Sc}\p{Sk}\p{So}]/gu, '');
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
      query.category = decodeUTF8(category);
    }
    
    if (language && language !== 'all') {
      query.language = language;
    }
    
    if (author) {
      query.author = decodeUTF8(author);
    }
    
    if (tag) {
      query.tags = { $in: [decodeUTF8(tag)] };
    }
    
    // Build sort options
    let sortOptions: any = { createdAt: -1 };
    
    if (sort === 'popular' || sort === 'views') {
      sortOptions = { views: -1, createdAt: -1 };
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
      thumbnail: article.thumbnail || '',
      category: article.category || 'عام',
      language: article.language || 'ur',
      author: article.author || 'ایڈمن',
      excerpt: article.excerpt || '',
      content: article.content || '',
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
    }, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
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
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        }
      }
    );
  }
}

// POST: Create new article - JSON فارمیٹ استعمال کریں
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Try to parse as JSON first (نیا طریقہ)
    let jsonData: any;
    let thumbnailFile: File | null = null;
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      // JSON فارمیٹ میں ڈیٹا
      jsonData = await request.json();
    } else if (contentType.includes('multipart/form-data')) {
      // پرانا FormData طریقہ - compatibility کے لیے
      const formData = await request.formData();
      
      // FormData سے JSON بنائیں
      jsonData = {
        title: formData.get('title'),
        content: formData.get('content'),
        excerpt: formData.get('excerpt'),
        language: formData.get('language'),
        category: formData.get('category'),
        author: formData.get('author'),
        tags: formData.get('tags'),
        links: formData.get('links'),
      };
      
      // thumbnail file کو الگ variable میں محفوظ کریں
      thumbnailFile = formData.get('thumbnail') as File | null;
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: 'غلط Content-Type. JSON یا FormData استعمال کریں' 
        }, 
        { status: 400 }
      );
    }

    // Extract and sanitize required fields
    const title = jsonData.title ? sanitizeText(decodeUTF8(jsonData.title.toString())) : '';
    const content = jsonData.content ? decodeUTF8(jsonData.content.toString()) : '';
    const excerpt = jsonData.excerpt ? sanitizeText(decodeUTF8(jsonData.excerpt.toString())) : '';
    const language = jsonData.language ? jsonData.language.toString() : 'ur';
    const category = jsonData.category ? sanitizeText(decodeUTF8(jsonData.category.toString())) : 'عام';
    const author = jsonData.author ? sanitizeText(decodeUTF8(jsonData.author.toString())) : 'ایڈمن';

    // Validate required fields
    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'عنوان درکار ہے' 
        }, 
        { status: 400 }
      );
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'مواد درکار ہے' 
        }, 
        { status: 400 }
      );
    }

    // Parse tags and links
    let tags: string[] = [];
    if (jsonData.tags) {
      try {
        if (typeof jsonData.tags === 'string') {
          // Try to parse as JSON
          try {
            const parsedTags = JSON.parse(jsonData.tags);
            tags = Array.isArray(parsedTags) 
              ? parsedTags.map((tag: any) => sanitizeText(decodeUTF8(tag.toString())))
              : [];
          } catch (e) {
            // Comma separated string
            tags = jsonData.tags.toString().split(',')
              .map((tag: string) => sanitizeText(decodeUTF8(tag.trim())))
              .filter((tag: string) => tag.length > 0);
          }
        } else if (Array.isArray(jsonData.tags)) {
          tags = jsonData.tags.map((tag: any) => sanitizeText(decodeUTF8(tag.toString())));
        }
      } catch (e) {
        console.error('Error parsing tags:', e);
        tags = [];
      }
    }

    let links: string[] = [];
    if (jsonData.links) {
      try {
        if (typeof jsonData.links === 'string') {
          try {
            const parsedLinks = JSON.parse(jsonData.links);
            links = Array.isArray(parsedLinks) ? parsedLinks : [];
          } catch (e) {
            links = jsonData.links.toString().split(',')
              .map((link: string) => link.trim())
              .filter((link: string) => link.length > 0);
          }
        } else if (Array.isArray(jsonData.links)) {
          links = jsonData.links;
        }
      } catch (e) {
        console.error('Error parsing links:', e);
        links = [];
      }
    }

    // Handle thumbnail
    let thumbnailUrl = '';
    
    // Check if thumbnail is provided as base64 or file
    if (thumbnailFile && thumbnailFile.size > 0) {
      // Handle file upload (FormData case)
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(thumbnailFile.type)) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'غلط فائل قسم۔ صرف JPEG, PNG, WebP اور GIF کی اجازت ہے۔' 
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
        thumbnailUrl = await uploadToCloudinary(thumbnailFile);
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
    } else if (jsonData.thumbnail && typeof jsonData.thumbnail === 'string') {
      // Check if it's a base64 image (JSON case)
      if (jsonData.thumbnail.startsWith('data:image')) {
        try {
          // Convert base64 to buffer
          const base64Data = jsonData.thumbnail.replace(/^data:image\/\w+;base64,/, '');
          const buffer = Buffer.from(base64Data, 'base64');
          
          // Convert buffer to file-like object
          const file = new File([buffer], 'thumbnail.jpg', { type: 'image/jpeg' });
          thumbnailUrl = await uploadToCloudinary(file);
        } catch (uploadError: any) {
          console.error('Base64 thumbnail upload failed:', uploadError);
          // If upload fails, use the URL directly if it's already a URL
          if (jsonData.thumbnail.startsWith('http')) {
            thumbnailUrl = jsonData.thumbnail;
          }
        }
      } else if (jsonData.thumbnail.startsWith('http')) {
        // Already a URL
        thumbnailUrl = jsonData.thumbnail;
      }
    }

    // Check for duplicate title (case insensitive)
    const existingArticle = await Article.findOne({ 
      title: { $regex: new RegExp(`^${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    });

    if (existingArticle) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'آرٹیکل کا عنوان پہلے سے موجود ہے' 
        },
        { status: 409 }
      );
    }

    // Create article in database
    const articleData = {
      title: title.trim(),
      content: content.trim(),
      excerpt: excerpt.trim(),
      language: language,
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
      { 
        status: 201,
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        }
      }
    );
  } catch (error: any) {
    console.error('POST error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'آرٹیکل کا عنوان پہلے سے موجود ہے'
        },
        { 
          status: 409,
          headers: {
            'Content-Type': 'application/json; charset=utf-8'
          }
        }
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
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json; charset=utf-8'
          }
        }
      );
    }
    
    // Handle CastError (invalid ObjectId)
    if (error.name === 'CastError') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'غلط آرٹیکل ID'
        },
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json; charset=utf-8'
          }
        }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'آرٹیکل تخلیق کرنے میں ناکامی',
        details: error.message 
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        }
      }
    );
  }
}

// PUT: Update article - JSON فارمیٹ استعمال کریں
export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    // Try to parse as JSON first
    let jsonData: any;
    let thumbnailFile: File | null = null;
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      jsonData = await request.json();
    } else if (contentType.includes('multipart/form-data')) {
      // Compatibility کے لیے
      const formData = await request.formData();
      jsonData = {
        id: formData.get('id'),
        title: formData.get('title'),
        content: formData.get('content'),
        excerpt: formData.get('excerpt'),
        language: formData.get('language'),
        category: formData.get('category'),
        author: formData.get('author'),
        tags: formData.get('tags'),
        links: formData.get('links'),
      };
      
      // thumbnail file کو الگ variable میں محفوظ کریں
      thumbnailFile = formData.get('thumbnail') as File | null;
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: 'غلط Content-Type. JSON یا FormData استعمال کریں' 
        }, 
        { status: 400 }
      );
    }

    const id = jsonData.id ? jsonData.id.toString() : '';
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'درست آرٹیکل آئی ڈی درکار ہے' 
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
    if (jsonData.title !== undefined) {
      const title = jsonData.title ? sanitizeText(decodeUTF8(jsonData.title.toString())) : '';
      if (title && title.trim()) {
        updateData.title = title.trim();
        
        // Check for duplicate title (excluding current article)
        const duplicateArticle = await Article.findOne({ 
          title: { $regex: new RegExp(`^${updateData.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
          _id: { $ne: id }
        });

        if (duplicateArticle) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'آرٹیکل کا عنوان پہلے سے موجود ہے' 
            },
            { status: 409 }
          );
        }
      }
    }

    if (jsonData.content !== undefined) {
      const content = jsonData.content ? decodeUTF8(jsonData.content.toString()) : '';
      if (content && content.trim()) {
        updateData.content = content.trim();
      }
    }

    if (jsonData.excerpt !== undefined) {
      updateData.excerpt = jsonData.excerpt ? sanitizeText(decodeUTF8(jsonData.excerpt.toString())) : '';
    }

    if (jsonData.language !== undefined) {
      updateData.language = jsonData.language ? jsonData.language.toString() : existingArticle.language;
    }

    if (jsonData.category !== undefined) {
      const category = jsonData.category ? sanitizeText(decodeUTF8(jsonData.category.toString())) : '';
      if (category && category.trim()) {
        updateData.category = category.trim();
      }
    }

    if (jsonData.author !== undefined) {
      const author = jsonData.author ? sanitizeText(decodeUTF8(jsonData.author.toString())) : '';
      if (author && author.trim()) {
        updateData.author = author.trim();
      }
    }

    // Handle tags
    if (jsonData.tags !== undefined) {
      let tags: string[] = [];
      if (jsonData.tags) {
        try {
          if (typeof jsonData.tags === 'string') {
            try {
              const parsedTags = JSON.parse(jsonData.tags);
              tags = Array.isArray(parsedTags) 
                ? parsedTags.map((tag: any) => sanitizeText(decodeUTF8(tag.toString())))
                : [];
            } catch (e) {
              tags = jsonData.tags.toString().split(',')
                .map((tag: string) => sanitizeText(decodeUTF8(tag.trim())))
                .filter((tag: string) => tag.length > 0);
            }
          } else if (Array.isArray(jsonData.tags)) {
            tags = jsonData.tags.map((tag: any) => sanitizeText(decodeUTF8(tag.toString())));
          }
        } catch (e) {
          console.error('Error parsing tags:', e);
          tags = [];
        }
      }
      updateData.tags = tags;
    }

    // Handle links
    if (jsonData.links !== undefined) {
      let links: string[] = [];
      if (jsonData.links) {
        try {
          if (typeof jsonData.links === 'string') {
            try {
              const parsedLinks = JSON.parse(jsonData.links);
              links = Array.isArray(parsedLinks) ? parsedLinks : [];
            } catch (e) {
              links = jsonData.links.toString().split(',')
                .map((link: string) => link.trim())
                .filter((link: string) => link.length > 0);
            }
          } else if (Array.isArray(jsonData.links)) {
            links = jsonData.links;
          }
        } catch (e) {
          console.error('Error parsing links:', e);
          links = [];
        }
      }
      updateData.links = links;
    }

    // Handle thumbnail
    if (thumbnailFile && thumbnailFile.size > 0) {
      // Handle file upload (FormData case)
      
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
            error: 'تھمب نیل اپلوڈ کرنے میں ناکامی'
          }, 
          { status: 500 }
        );
      }
    } else if (jsonData.thumbnail === '' || jsonData.thumbnail === null) {
      // If empty string or null, remove thumbnail
      updateData.thumbnail = '';
    } else if (jsonData.thumbnail && typeof jsonData.thumbnail === 'string') {
      // Check if it's a new base64 image
      if (jsonData.thumbnail.startsWith('data:image')) {
        try {
          const base64Data = jsonData.thumbnail.replace(/^data:image\/\w+;base64,/, '');
          const buffer = Buffer.from(base64Data, 'base64');
          const file = new File([buffer], 'thumbnail.jpg', { type: 'image/jpeg' });
          const thumbnailUrl = await uploadToCloudinary(file);
          updateData.thumbnail = thumbnailUrl;
        } catch (uploadError: any) {
          console.error('Base64 thumbnail upload failed:', uploadError);
          // Keep existing thumbnail if upload fails
        }
      } else if (jsonData.thumbnail.startsWith('http')) {
        // Already a URL
        updateData.thumbnail = jsonData.thumbnail;
      }
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
    }, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      }
    });

  } catch (error: any) {
    console.error('PUT Error:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { 
          success: false, 
          error: 'ویلڈیشن غلطی',
          details: validationErrors 
        },
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json; charset=utf-8'
          }
        }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'آرٹیکل اپ ڈیٹ کرنے میں ناکامی'
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        }
      }
    );
  }
}

// DELETE: Delete article
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'درست آرٹیکل آئی ڈی درکار ہے' 
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

    const deletedArticle = await Article.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'آرٹیکل کامیابی سے حذف ہو گیا!',
      data: {
        _id: deletedArticle?._id?.toString(),
        title: deletedArticle?.title
      }
    }, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      }
    });

  } catch (error: any) {
    console.error('DELETE Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'آرٹیکل حذف کرنے میں ناکامی'
      }, 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        }
      }
    );
  }
}

// PATCH: Update specific fields (like view count)
export async function PATCH(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const action = searchParams.get('action');
    
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'درست آرٹیکل آئی ڈی درکار ہے' 
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
    }, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      }
    });
    
  } catch (error: any) {
    console.error('PATCH Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'آرٹیکل اپ ڈیٹ کرنے میں ناکامی'
      }, 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        }
      }
    );
  }
}