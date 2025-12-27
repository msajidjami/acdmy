// app/types/searchParams.ts
export default interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'owner';
  isVerified: boolean;
  _id?: string;
  username?: string;
  verified?: boolean;
  isTempAdmin?: boolean; // Add this line
}