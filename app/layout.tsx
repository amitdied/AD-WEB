import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { AudioProvider } from '@/lib/AudioContext';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
});

export const metadata: Metadata = {
  title: 'AMITDIED // Official Beat Store & Archive',
  description: 'Official music production archive, beat store, and sound engineering portfolio of AMITDIED.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} dark`}>
      <body className="bg-black text-white font-sans antialiased selection:bg-red-600 selection:text-white min-h-screen">
        <AudioProvider>
          {children}
        </AudioProvider>
      </body>
    </html>
  );
}
