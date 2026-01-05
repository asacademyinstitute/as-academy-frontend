import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
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
    url: 'https://asacademy.site',
    title: 'AS Academy | Best Online Courses for JEE, NEET & Competitive Exams',
    description: 'Leading online learning platform for JEE, NEET, and competitive exam preparation. Expert-led courses with certificates and comprehensive study materials.',
    siteName: 'AS Academy',
    images: [
      {
        url: 'https://i.ibb.co/s9xkRzbw/favicon-ico.jpg',
        width: 1200,
        height: 630,
        alt: 'AS Academy - Online Learning Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AS Academy | Best Online Courses for JEE, NEET & Competitive Exams',
    description: 'Leading online learning platform for JEE, NEET, and competitive exam preparation with expert-led courses.',
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
      <body className={`${inter.variable} ${poppins.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
