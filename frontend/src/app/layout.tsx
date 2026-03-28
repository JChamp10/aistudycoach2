import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { UpgradeModal } from '@/components/layout/UpgradeModal';

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
        <UpgradeModal />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--toast-bg)',
              color: 'var(--toast-text)',
              border: '1px solid var(--toast-border)',
              borderRadius: '12px',
              fontFamily: 'Syne, sans-serif',
            },
          }}
        />
      </body>
    </html>
  );
}
