import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  to: string;
  className?: string;
  imageWrapperClassName?: string;
  imageClassName?: string;
  textClassName?: string;
  showText?: boolean;
}

export function BrandLogo({
  to,
  className,
  imageWrapperClassName,
  imageClassName,
  textClassName,
  showText = false,
}: BrandLogoProps) {
  return (
    <Link to={to} className={cn("flex items-center gap-2", className)}>
      <div className={cn(imageWrapperClassName)}>
        <img
          src="/projektmarkt-logo.png"
          alt="ProjektMarkt"
          className={cn("h-10 w-auto object-contain", imageClassName)}
        />
      </div>
      {showText && (
        <span className={cn("font-display text-lg font-bold text-foreground", textClassName)}>
          Projekt<span className="text-accent">Markt</span>
        </span>
      )}
    </Link>
  );
}
