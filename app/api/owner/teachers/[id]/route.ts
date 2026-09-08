import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/app/lib/dbConnect';
import Teacher from '@/models/Teacher';
import Academy from '@/models/Academy';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET;

type RouteContext = {
params: Promise<{
id: string;
}>;
};

async function getUserFromRequest(
req: NextRequest
) {
const token = req.cookies.get('token')?.value;

if (!token) {
return null;
}

if (!JWT_SECRET) {
console.error('JWT_SECRET is not configured');
return null;
}

try {
const decoded = jwt.verify(token, JWT_SECRET) as {
userId: string;
};


await connectDB();

const user = await User.findById(decoded.userId).select(
  '-password'
);

return user;


} catch (error) {
console.error('JWT verification error:', error);
return null;
}
}

export async function PUT(
req: NextRequest,
{ params }: RouteContext
) {
try {
const user = await getUserFromRequest(req);


if (!user) {
  return NextResponse.json(
    { error: 'Unauthorized' },
    { status: 401 }
  );
}

await connectDB();

const academy = await Academy.findOne({
  ownerId: user._id,
});

if (!academy) {
  return NextResponse.json(
    { error: 'No academy found' },
    { status: 404 }
  );
}

// Next.js 16: params is a Promise
const { id } = await params;

const teacher = await Teacher.findOne({
  _id: id,
  academyId: academy._id,
});

if (!teacher) {
  return NextResponse.json(
    { error: 'Teacher not found' },
    { status: 404 }
  );
}

const body = await req.json();

const {
  name,
  email,
  subjects,
  bio,
  isAvailable,
  audioUrl,
} = body;

if (name !== undefined) {
  teacher.name = name;
}

if (email !== undefined) {
  teacher.email = email;
}

if (subjects !== undefined) {
  teacher.subjects = subjects;
}

if (bio !== undefined) {
  teacher.bio = bio;
}

if (typeof isAvailable === 'boolean') {
  teacher.isAvailable = isAvailable;
}

if (audioUrl !== undefined) {
  teacher.audioUrl = audioUrl;
}

await teacher.save();

return NextResponse.json(teacher);


} catch (error) {
console.error(
'PUT /api/owner/teachers/[id] error:',
error
);


return NextResponse.json(
  { error: 'Server error' },
  { status: 500 }
);


}
}

export async function DELETE(
req: NextRequest,
{ params }: RouteContext
) {
try {
const user = await getUserFromRequest(req);


if (!user) {
  return NextResponse.json(
    { error: 'Unauthorized' },
    { status: 401 }
  );
}

await connectDB();

const academy = await Academy.findOne({
  ownerId: user._id,
});

if (!academy) {
  return NextResponse.json(
    { error: 'No academy found' },
    { status: 404 }
  );
}

// Next.js 16: params is a Promise
const { id } = await params;

const teacher = await Teacher.findOneAndDelete({
  _id: id,
  academyId: academy._id,
});

if (!teacher) {
  return NextResponse.json(
    { error: 'Teacher not found' },
    { status: 404 }
  );
}

return NextResponse.json({
  message: 'Teacher deleted',
});


} catch (error) {
console.error(
'DELETE /api/owner/teachers/[id] error:',
error
);


return NextResponse.json(
  { error: 'Server error' },
  { status: 500 }
);


}
}
