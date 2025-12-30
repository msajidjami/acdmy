import AdmissionForm from './AdmissionForm';

// یہ پیج اب server component ہے، کوئی 'use client' نہیں
export const dynamic = 'force-dynamic'; // یہ بھی رکھیں احتیاطاً

export default function AdmissionPage({
  searchParams,
}: {
  searchParams: { ref?: string };
}) {
  const initialRef = searchParams.ref || '';

  return <AdmissionForm initialRef={initialRef} />;
}