import type { Metadata } from 'next';
import './globals.css';
import {AuthProvider} from '@/app/components/AuthProvider';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';

export const metadata: Metadata = {
  title: 'Academy Hub',
  description: 'Online Academy Marketplace',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {/* نیویگیشن بار - ہر صفحے پر شامل */}
          <Navbar />
          {/* مرکزی مواد */}
          <main>{children}</main>
          {/* فوٹر - ہر صفحے پر شامل */}
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}