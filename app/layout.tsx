import type { Metadata } from 'next';
import { NewUploadProvider } from '@/components/NewUploadContext';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import './globals.css';

export const metadata: Metadata = {
  title: '0up - encrypted file sharing',
  description: '0up is a free, open-source, encrypted file sharing service.',
  applicationName: '0up',
  icons: {
    icon: [
      { url: '/favicon.png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  openGraph: {
    title: '0up - encrypted file sharing',
    description: '0up is a free, open-source, encrypted file sharing service.',
    siteName: '0up',
    images: ['/social-share-home.jpg'],
    type: 'website',
  },
  twitter: {
    title: '0up - encrypted file sharing',
    card: 'summary_large_image',
    site: '0up_App',
    images: ['/social-share-home.jpg'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-zinc-900 bg-repeat" style={{ backgroundImage: 'url(/bg.jpg)' }}>
        <NewUploadProvider>
          <Nav />
          <main>{children}</main>
          <Footer />
        </NewUploadProvider>
      </body>
    </html>
  );
}
