import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  interactive?: boolean;
};

export default function Card({ children, className, interactive, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-[var(--poly-border)] bg-white shadow-[var(--poly-shadow-sm)]",
        interactive && "transition hover:border-[var(--poly-border-strong)] hover:shadow-[var(--poly-shadow-md)]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
