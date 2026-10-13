'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';

/* Ye routes par global Navbar nahi dikhega */
const HIDE_ON = /^\/(teacher|student|owner|admin|dashboard|contacts|settings)(\/|$)/;

export default function RootNavbar() {
  const pathname = usePathname();

  if (HIDE_ON.test(pathname)) {
    return null;
  }

  return <Navbar />;
}