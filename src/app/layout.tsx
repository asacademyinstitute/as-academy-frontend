import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import PushNotificationManager from "@/components/PushNotificationManager";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#3b82f6",
};

export const metadata: Metadata = {
  title: "AS Academy - Learning Management System",
  description: "Leading MSBTE Computer Engineering courses platform offering comprehensive diploma courses, question papers, and video lectures. Founded by M Saad Shaikh.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192x192.png",
    shortcut: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AS Academy",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "name": "AS Academy",
    "url": "https://asacademy.in",
    "logo": "https://asacademy.in/logo.png",
    "description": "Leading MSBTE Computer Engineering courses platform offering comprehensive diploma courses, question papers, and video lectures. Founded by M Saad Shaikh.",
    "founder": {
      "@type": "Person",
      "name": "M Saad Shaikh"
    },
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "IN"
    },
    "sameAs": [
      "https://www.instagram.com/asacademy_india/",
      "https://www.youtube.com/@ASAcademyIndia"
    ]
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          storageKey="as-academy-theme"
        >
          <PushNotificationManager />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

