import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  to: string;
  className?: string;
  imageClassName?: string;
  textClassName?: string;
  showText?: boolean;
}

export function BrandLogo({
  to,
  className,
  imageClassName,
  textClassName,
  showText = true,
}: BrandLogoProps) {
  return (
    <Link to={to} className={cn("flex items-center gap-2", className)}>
      <img
        src="/projektmarkt-logo.png"
        alt="ProjektMarkt"
        className={cn("h-8 w-auto object-contain", imageClassName)}
      />
      {showText && (
        <span className={cn("font-display text-lg font-bold text-foreground", textClassName)}>
          Projekt<span className="text-accent">Markt</span>
        </span>
      )}
    </Link>
  );
}
