import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/header';
import { WSProvider } from '@repo/ws';
import { ChatWidget } from '@/components/chat-widget';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'HackUTA Portal',
  description: 'Your gateway to HackUTA!',
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
        <WSProvider
          baseUrl={process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8090'}
        >
          <Header />
          {children}
          <ChatWidget />
        </WSProvider>
      </body>
    </html>
  );
}
