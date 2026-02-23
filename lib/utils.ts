import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat("de-CH", {
    style: "currency",
    currency: "CHF",
    maximumFractionDigits: 0,
  }).format(amount);

export const formatDate = (dateIso: string): string =>
  new Intl.DateTimeFormat("de-CH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(dateIso));

export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));
