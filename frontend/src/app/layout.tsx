import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'AI Study Coach – Learn Smarter',
  description: 'AI-powered study platform using spaced repetition, free recall, and personalized learning plans.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#181d2a',
              color: '#ffffff',
              border: '1px solid #252b3b',
              borderRadius: '12px',
              fontFamily: 'Syne, sans-serif',
            },
          }}
        />
      </body>
    </html>
  );
}
