// app/api/teachers/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/dbConnect'; // اپنی DB کنکشن کے مطابق تبدیل کریں
import Teacher from '@/models/Teacher'; // اپنے ماڈل کے مطابق

// ============ GET (Fetch single teacher) ============
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    // 🔥 IMPORTANT: params کو await کریں
    const { id } = await params;

    const teacher = await Teacher.findById(id);

    if (!teacher) {
      return NextResponse.json(
        { success: false, message: 'Teacher not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, teacher });
  } catch (error: any) {
    console.error('Error fetching teacher:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Server error' },
      { status: 500 }
    );
  }
}

// ============ PUT (Update teacher) ============
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    // FormData سے ڈیٹا نکالیں (کیونکہ ہم files بھی بھیج رہے ہیں)
    const formData = await request.formData();
    const updateData: any = {};

    // صرف text fields کو جمع کریں، files کو بعد میں ہینڈل کریں
    for (const [key, value] of formData.entries()) {
      // اگر value string ہے اور key files نہیں ہے تو object میں ڈالیں
      if (typeof value === 'string' && !['avatar', 'introAudio', 'introVideo', 'certificates'].includes(key)) {
        // اگر key array ہے تو JSON parse کریں (اگر آپ نے array بھیجا ہے)
        if (key === 'languages' || key === 'subjects') {
          try {
            updateData[key] = JSON.parse(value);
          } catch {
            updateData[key] = value.split(','); // comma-separated string
          }
        } else if (key === 'experience') {
          updateData[key] = parseFloat(value);
        } else if (key === 'isVerified' || key === 'active') {
          updateData[key] = value === 'true';
        } else {
          updateData[key] = value;
        }
      }
    }

    // 🖼️ Files کو ہینڈل کریں (یہاں آپ Cloudinary/UploadThing وغیرہ استعمال کریں)
    // مثال کے طور پر:
    // const avatarFile = formData.get('avatar') as File | null;
    // if (avatarFile) {
    //   const uploadResult = await uploadToCloudinary(avatarFile);
    //   updateData.avatar = uploadResult.secure_url;
    // }
    // اسی طرح audio, video, certificates کے لیے

    const teacher = await Teacher.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!teacher) {
      return NextResponse.json(
        { success: false, message: 'Teacher not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, teacher });
  } catch (error: any) {
    console.error('Error updating teacher:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Server error' },
      { status: 500 }
    );
  }
}

// ============ DELETE (اگر نہیں بنایا تو) ============
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const teacher = await Teacher.findByIdAndDelete(id);
    if (!teacher) {
      return NextResponse.json(
        { success: false, message: 'Teacher not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Server error' },
      { status: 500 }
    );
  }
}