import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./tailwind.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "SLIMS | ABU Zaria - SIWES Logbook & Internship Management",
  description:
    "Digital SIWES logbook system for Ahmadu Bello University students",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetBrainsMono.variable}`}>
      <body className={`${inter.className} ${jetBrainsMono.className}`}>
        {children}
      </body>
    </html>
  );
}
