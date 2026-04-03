import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Sidebar } from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "PaperPulse — Auto Research Digest",
  description: "Stay up to date with the latest arXiv research papers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-gray-50 antialiased">
        <Providers>
          <div className="flex h-full">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
