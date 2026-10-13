'use client';

import { usePathname } from 'next/navigation';
import Footer from './Footer';

const HIDE_ON = /^\/(teacher|student|owner|admin|dashboard|contacts|settings)(\/|$)/;

export default function RootFooter() {
  const pathname = usePathname();

  if (HIDE_ON.test(pathname)) {
    return null;
  }

  return <Footer />;
}