import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'AMITDIED | Dark Melodic Beats',
  description: 'Music producer portfolio and beat selling platform for Amitdied.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Space+Grotesk:wght@300..700&display=swap"
        />
      </head>
      <body className="bg-black text-zinc-100 font-sans antialiased selection:bg-red-900/50 selection:text-red-200" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
