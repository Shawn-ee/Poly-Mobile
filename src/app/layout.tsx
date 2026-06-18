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
      <body className="bg-[var(--poly-bg)] text-[var(--poly-text)] antialiased">
        <div className="min-h-screen bg-[var(--poly-bg)]">
          <TopNav />
          {children}
        </div>
      </body>
    </html>
  );
}
