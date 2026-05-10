import type { Metadata } from "next";
import { Inter, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
});

const notoSansDevanagari = Noto_Sans_Devanagari({
  weight: ['400', '500', '600', '700'],
  subsets: ["devanagari"],
  variable: '--font-noto-devanagari',
});

export const metadata: Metadata = {
  title: "UP Geo Intelligence Map | उत्तर प्रदेश जियो मैप",
  description: "Advanced Interactive Geo Intelligence Map Platform for Uttar Pradesh",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hi">
      <body className={`${inter.variable} ${notoSansDevanagari.variable} font-sans antialiased bg-gray-50 text-gray-900`}>
        {children}
      </body>
    </html>
  );
}
