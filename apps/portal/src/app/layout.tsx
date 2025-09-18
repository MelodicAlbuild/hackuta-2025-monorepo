import type { Metadata } from 'next';
import { Roboto, Fira_Code } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/header';
import { ThemeProvider } from '@/components/theme-provider';

const roboto = Roboto({
  variable: '--font-roboto',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
});

const firaCode = Fira_Code({
  variable: '--font-fira-code',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
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
    <html lang="en" suppressHydrationWarning>
      <body className={`${roboto.variable} ${firaCode.variable} antialiased`}>
        <ThemeProvider>
          <div className="min-h-screen bg-background text-foreground flex flex-col">
            <Header />
            <main className="flex-1 p-4 sm:p-8">
              <div className="max-w-7xl mx-auto">{children}</div>
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
