import type {Metadata} from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css'; // Global styles

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
});

export const metadata: Metadata = {
  title: 'AMITDIED | Dark Melodic Beats',
  description: 'Music producer portfolio and beat selling platform for Amitdied.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} dark`}>
      <body className="bg-black text-zinc-100 font-sans antialiased selection:bg-red-900/50 selection:text-red-200" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
