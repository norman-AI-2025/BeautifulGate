import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { Header } from '@/components/Header';
import { LanguageSelector } from '@/components/LanguageSelector';

export const metadata: Metadata = {
  title: 'Beautiful Gate | Assisted Mobility & Artisan Workshop Platform',
  description: 'Production-grade Apple HIG platform for accessible hospital transit and OKU artisan workshop management.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-[#fbfbfd] text-[#1d1d1f]">
        <LanguageProvider>
          <AppProvider>
            <Header />
            {children}
            {/* Universal Floating Language Button at Bottom Right with Globe Icon */}
            <LanguageSelector floating />
          </AppProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
