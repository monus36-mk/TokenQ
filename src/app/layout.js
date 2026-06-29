import { DM_Sans, DM_Mono } from 'next/font/google';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-dm-mono',
  display: 'swap',
});

export const metadata = {
  title: 'TokenQ - Smart Clinic Booking & Live Queue Tracker',
  description: 'Book doctor appointments, retrieve tokens, and track live queues in real-time. Direct admin dashboard access for clinical staff.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmMono.variable}`}>
      <head>
        {/* We can import fonts directly or fallback to system fonts if needed */}
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
