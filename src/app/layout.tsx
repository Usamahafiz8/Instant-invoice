import type { Metadata } from "next";
import { Geist } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import { auth } from "@/auth";
import ThemeProvider from "@/components/ThemeProvider";
import DashboardShell from "@/components/DashboardShell";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Instant Invoice",
  description: "Create invoices in a few simple steps.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} h-full antialiased`}
    >
      <body className="min-h-full" suppressHydrationWarning>
        <ThemeProvider>
          <NextTopLoader
            color="#6366f1"
            height={3}
            shadow="0 0 10px #6366f1,0 0 5px #6366f1"
            showSpinner={false}
          />
          <DashboardShell user={session?.user}>{children}</DashboardShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
