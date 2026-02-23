import type { ReactNode } from "react";

interface FormFieldProps {
  label: string;
  error?: string;
  children: ReactNode;
}

export const FormField = ({ label, error, children }: FormFieldProps) => (
  <div className="space-y-1.5">
    <label className="text-sm font-semibold text-brand-900">{label}</label>
    {children}
    {error ? <p className="text-xs font-medium text-swiss-red">{error}</p> : null}
  </div>
);
