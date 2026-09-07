import { NextResponse } from 'next/server';
import cloudinary from '@/app/lib/cloudinary';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('audio') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log(`📁 File received: ${file.name}, Size: ${file.size} bytes, Type: ${file.type}`);

    // فائل کا سائز چیک کریں (مثلاً 20MB سے زیادہ ہو تو وارننگ دیں)
    if (file.size > 20 * 1024 * 1024) {
      console.warn('⚠️ File size exceeds 20MB, may take longer to upload.');
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw', // ✅ یہ کلیدی تبدیلی ہے
          folder: 'teachers_audio',
          timeout: 120000, // 2 منٹ کا ٹائم آؤٹ (بڑی فائلوں کے لیے)
          // raw فائل کے لیے کوئی اور آپشنز درکار نہیں
        },
        (error, result) => {
          if (error) {
            console.error('❌ Cloudinary upload error:', error);
            reject(error);
          } else if (!result) {
            reject(new Error('Upload result is undefined'));
          } else {
            console.log('✅ Cloudinary upload success:', result.secure_url);
            resolve(result);
          }
        }
      );

      uploadStream.end(buffer);

      // ٹائم آؤٹ ہینڈلر
      const timeoutId = setTimeout(() => {
        uploadStream.destroy();
        reject(new Error('Upload timeout after 120 seconds'));
      }, 120000);

      uploadStream.on('finish', () => clearTimeout(timeoutId));
      uploadStream.on('error', () => clearTimeout(timeoutId));
    });

    return NextResponse.json({ url: uploadResult.secure_url });
  } catch (error: any) {
    console.error('🔥 Audio upload API error:', error);
    return NextResponse.json(
      { 
        error: 'Upload failed', 
        details: error.message || 'Unknown error' 
      },
      { status: 500 }
    );
  }
}