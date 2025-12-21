import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AS Academy | MSBTE K Scheme Computer Engineering Courses & Question Papers",
  description: "Leading platform for MSBTE K Scheme CO courses. Access diploma computer engineering courses, semester 6 papers, video lectures, and MSBTE question papers PDF for free.",
  keywords: [
    "MSBTE K Scheme",
    "MSBTE K Scheme Papers",
    "MSBTE CO Courses",
    "MSBTE Computer Engineering",
    "Diploma Computer Engineering MSBTE",
    "MSBTE Semester 6 CO",
    "MSBTE Question Papers PDF",
    "Computer Engineering Courses",
    "AS Academy"
  ],
  authors: [{ name: "AS Academy" }],
  creator: "AS Academy",
  publisher: "AS Academy",
  metadataBase: new URL('https://asacademy.in'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://asacademy.in',
    title: 'AS Academy | MSBTE K Scheme Computer Engineering Courses',
    description: 'Leading platform for MSBTE K Scheme CO courses. Access diploma computer engineering courses, semester 6 papers, and question papers PDF.',
    siteName: 'AS Academy',
    images: [
      {
        url: 'https://i.ibb.co/s9xkRzbw/favicon-ico.jpg',
        width: 1200,
        height: 630,
        alt: 'AS Academy - MSBTE K Scheme Courses',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AS Academy | MSBTE K Scheme Computer Engineering Courses',
    description: 'Leading platform for MSBTE K Scheme CO courses. Access diploma computer engineering courses and question papers.',
    images: ['https://i.ibb.co/s9xkRzbw/favicon-ico.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: "https://i.ibb.co/s9xkRzbw/favicon-ico.jpg",
    apple: "https://i.ibb.co/s9xkRzbw/favicon-ico.jpg",
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
