import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import Navigation from "@/components/Navigation";
import RouteGuard from "@/components/RouteGuard";
import { Toaster } from 'sonner';

import { LanguageProvider } from "@/components/LanguageProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "My Meals",
  description: "Advanced POS system for Hospital Orders and Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} transition-colors duration-300`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <LanguageProvider>
            <AuthProvider>
              <RouteGuard>
                <Navigation />
                <main className="flex-1">
                  {children}
                </main>
                <footer className="py-6 border-t border-zinc-200 dark:border-zinc-800 text-center opacity-50 print:hidden">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">created by Unit SIMRS Hermina Pasuruan</p>
                </footer>
              </RouteGuard>
              <Toaster position="top-center" richColors />
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
