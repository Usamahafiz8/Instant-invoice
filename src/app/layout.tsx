import type { Metadata } from "next";
import { Geist } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import ThemeProvider, { THEME_SCRIPT } from "@/components/ThemeProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Instant Invoice",
  description: "Create invoices in a few simple steps.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} h-full antialiased`}
    >
      <body className="min-h-full" suppressHydrationWarning>
        {/* Anti-flash theme script — server-rendered so it never re-renders on
            the client (avoids React's "script tag" warning). */}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }}
        />
        <ThemeProvider>
          <NextTopLoader
            color="#6366f1"
            height={3}
            shadow="0 0 10px #6366f1,0 0 5px #6366f1"
            showSpinner={false}
          />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
