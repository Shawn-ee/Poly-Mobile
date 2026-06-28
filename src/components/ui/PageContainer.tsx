import type { ReactNode } from "react";
import { cn } from "./cn";

export default function PageContainer({
  children,
  className,
  size = "wide",
}: {
  children: ReactNode;
  className?: string;
  size?: "wide" | "default";
}) {
  return (
    <main className={cn("mx-auto w-full px-4 py-8 sm:px-6 lg:py-10", size === "wide" ? "max-w-7xl" : "max-w-6xl", className)}>
      {children}
    </main>
  );
}
