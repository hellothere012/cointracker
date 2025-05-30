import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../lib/authContext";
import Navbar from "../components/layout/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Arbitrage Tracker",
  description: "Track arbitrage opportunities",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        {/* AuthProvider must wrap everything that needs authentication context */}
        <AuthProvider>
          <Navbar />
          <main className="flex-grow">
            {children}
          </main>
          {/* Optional: Add a Footer component here later */}
        </AuthProvider>
      </body>
    </html>
  );
}