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

// Helper function to decode form data
function decodeFormData(value: string): string {
  if (!value) return '';
  
  try {
    // Try to decode if it's URL encoded
    if (value.includes('%') || value.includes('+')) {
      return decodeURIComponent(value.replace(/\+/g, ' '));
    }
    return value;
  } catch (error) {
    console.error('Error decoding value:', error);
    return value;
  }
}

// GET: Fetch all articles
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
      query.category = decodeFormData(category);
    }
    
    if (language && language !== 'all') {
      query.language = language;
    }
    
    if (author) {
      query.author = decodeFormData(author);
    }
    
    if (tag) {
      query.tags = { $in: [decodeFormData(tag)] };
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
export async function POST(request: NextRequest) {
  try {
    console.log('=== POST REQUEST STARTED ===');
    await connectDB();

    const formData = await request.formData();
    console.log('FormData received');

    // Extract and decode fields
    const title = decodeFormData(formData.get('title') as string || '');
    const content = decodeFormData(formData.get('content') as string || '');
    const excerpt = decodeFormData(formData.get('excerpt') as string || '');
    const language = formData.get('language') as string || 'ur';
    const category = decodeFormData(formData.get('category') as string || 'عام');
    const author = decodeFormData(formData.get('author') as string || 'ایڈمن');
    const tagsInput = formData.get('tags') as string || '';
    const linksInput = formData.get('links') as string || '';
    const thumbnailFile = formData.get('thumbnail') as File | null;

    console.log('Decoded fields:', {
      titleLength: title.length,
      contentLength: content.length,
      language,
      category,
      author,
      hasTags: !!tagsInput,
      hasLinks: !!linksInput,
      hasThumbnail: !!thumbnailFile
    });

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

    // Parse tags (handle both JSON string and comma-separated)
    let tags: string[] = [];
    if (tagsInput) {
      try {
        // Try to parse as JSON array
        const parsedTags = JSON.parse(tagsInput);
        if (Array.isArray(parsedTags)) {
          tags = parsedTags.map(tag => decodeFormData(tag));
        }
      } catch (error) {
        // If not JSON, treat as comma-separated string
        tags = tagsInput.split(',')
          .map(tag => decodeFormData(tag.trim()))
          .filter(tag => tag.length > 0);
      }
    }

    // Parse links (handle both JSON string and comma-separated)
    let links: string[] = [];
    if (linksInput) {
      try {
        const parsedLinks = JSON.parse(linksInput);
        if (Array.isArray(parsedLinks)) {
          links = parsedLinks;
        }
      } catch (error) {
        links = linksInput.split(',')
          .map(link => link.trim())
          .filter(link => link.length > 0);
      }
    }

    console.log('Parsed tags and links:', { tags, links });

    // Handle thumbnail upload
    let thumbnailUrl = '';
    
    if (thumbnailFile && thumbnailFile.size > 0) {
      console.log('Uploading thumbnail...');
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
        console.log('Thumbnail uploaded:', thumbnailUrl);
      } catch (uploadError: any) {
        console.error('Thumbnail upload failed:', uploadError);
        // Continue without thumbnail if upload fails
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

    console.log('Saving article to database:', {
      title: articleData.title.substring(0, 50),
      language: articleData.language,
      category: articleData.category,
      tags: articleData.tags.length
    });

    const article = await Article.create(articleData);
    console.log('Article saved with ID:', article._id);

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
    console.error('=== POST ERROR ===', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'آرٹیکل کا عنوان پہلے سے موجود ہے'
        },
        { status: 409 }
      );
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      console.error('Validation errors:', validationErrors);
      return NextResponse.json(
        { 
          success: false, 
          error: 'ویلڈیشن غلطی',
          details: validationErrors.join(', ')
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'آرٹیکل تخلیق کرنے میں ناکامی',
        details: process.env.NODE_ENV === 'development' ? error.message : ''
      },
      { status: 500 }
    );
  }
}

// PUT: Update article
export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const formData = await request.formData();
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
      const title = decodeFormData(formData.get('title') as string || '');
      if (title.trim()) {
        updateData.title = title.trim();
      }
    }

    if (formData.has('content')) {
      const content = decodeFormData(formData.get('content') as string || '');
      if (content.trim()) {
        updateData.content = content.trim();
      }
    }

    if (formData.has('excerpt')) {
      updateData.excerpt = decodeFormData(formData.get('excerpt') as string || '');
    }

    if (formData.has('language')) {
      updateData.language = formData.get('language') as string;
    }

    if (formData.has('category')) {
      const category = decodeFormData(formData.get('category') as string || '');
      if (category.trim()) {
        updateData.category = category.trim();
      }
    }

    if (formData.has('author')) {
      const author = decodeFormData(formData.get('author') as string || '');
      if (author.trim()) {
        updateData.author = author.trim();
      }
    }

    // Handle tags
    if (formData.has('tags')) {
      const tagsInput = formData.get('tags') as string || '';
      let tags: string[] = [];
      
      if (tagsInput) {
        try {
          const parsedTags = JSON.parse(tagsInput);
          if (Array.isArray(parsedTags)) {
            tags = parsedTags.map(tag => decodeFormData(tag));
          }
        } catch (error) {
          tags = tagsInput.split(',')
            .map(tag => decodeFormData(tag.trim()))
            .filter(tag => tag.length > 0);
        }
      }
      updateData.tags = tags;
    }

    // Handle links
    if (formData.has('links')) {
      const linksInput = formData.get('links') as string || '';
      let links: string[] = [];
      
      if (linksInput) {
        try {
          const parsedLinks = JSON.parse(linksInput);
          if (Array.isArray(parsedLinks)) {
            links = parsedLinks;
          }
        } catch (error) {
          links = linksInput.split(',')
            .map(link => link.trim())
            .filter(link => link.length > 0);
        }
      }
      updateData.links = links;
    }

    // Handle thumbnail
    const thumbnailFile = formData.get('thumbnail') as File | null;
    if (thumbnailFile && thumbnailFile.size > 0) {
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
      }
    }

    // Update article
    const updatedArticle = await Article.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
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
    console.error('PUT Error:', error);
    
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
        error: 'آرٹیکل اپ ڈیٹ کرنے میں ناکامی'
      },
      { status: 500 }
    );
  }
}

// DELETE and PATCH methods remain the same...
// DELETE: Delete article
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
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

    await Article.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'آرٹیکل کامیابی سے حذف ہو گیا!',
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