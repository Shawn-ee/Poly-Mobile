import type { Metadata } from "next";
import "./globals.css";
import TopNav from "@/components/TopNav";

export const metadata: Metadata = {
  title: "Poly Market MVP",
  description: "USDC (U) prediction market MVP.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-neutral-50 text-neutral-900">
        <div className="min-h-screen">
          <TopNav />
          {children}
        </div>
      </body>
    </html>
  );
}
