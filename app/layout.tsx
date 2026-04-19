import type { Metadata } from 'next';
import { Inter, Space_Grotesk, Lora } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-lora',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
});

export const metadata: Metadata = {
  title: {
    default: 'Cordneed — AI-Powered Mobile App Builder',
    template: '%s | Cordneed',
  },
  description:
    'Build Android & iOS apps instantly with AI. Just describe your app in plain English and Cordneed generates production-ready React Native Expo code.',
  keywords: [
    'AI app builder',
    'React Native generator',
    'no-code mobile apps',
    'Expo app generator',
    'AI mobile development',
  ],
  openGraph: {
    type: 'website',
    title: 'Cordneed — AI-Powered Mobile App Builder',
    description:
      'Build Android & iOS apps instantly with AI. Just describe your app in plain English.',
    siteName: 'Cordneed',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cordneed — AI-Powered Mobile App Builder',
    description: 'Build Android & iOS apps instantly with AI.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${lora.variable} font-inter antialiased bg-[#040816] text-white`}
      >
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#0f1629',
              border: '1px solid rgba(99,102,241,0.3)',
              color: '#e2e8f0',
            },
          }}
        />
      </body>
    </html>
  );
}
