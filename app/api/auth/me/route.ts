import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'xK9mP2vL8qR4nA7cE5hF1jM3bU6wY0zX8tC2vB5nM7kL9pQ2rS4tU6wY8zA0';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return NextResponse.json({ user: decoded }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}