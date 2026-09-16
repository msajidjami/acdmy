// app/owner/enrollments/[id]/page.tsx
import { redirect } from 'next/navigation';
import EnrollmentDetailClient from './EnrollmentDetailClient';

export const dynamic = 'force-dynamic';

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!id) redirect('/owner/enrollments');
  return <EnrollmentDetailClient id={id} />;
}