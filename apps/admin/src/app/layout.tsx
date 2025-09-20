import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/header';
import { WSProvider } from '@repo/ws';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'HackUTA Admin',
  description: 'Admin panel for HackUTA',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="min-h-screen bg-gray-100 flex flex-col">
          <Header />
          <main className="flex-1 p-4 sm:p-8">
            <WSProvider
              baseUrl={process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8090'}
            >
              <div className="max-w-7xl mx-auto">{children}</div>
            </WSProvider>
          </main>
        </div>
      </body>
    </html>
  );
}
