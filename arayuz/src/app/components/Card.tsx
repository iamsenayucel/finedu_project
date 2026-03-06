import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "success" | "info" | "warning";
}

export function Card({ children, className = "", variant = "default" }: CardProps) {
  const variantClasses = {
    default: "bg-card border-border",
    success: "bg-gradient-to-br from-emerald-50 to-green-50 border-success/20",
    info: "bg-gradient-to-br from-sky-50 to-blue-50 border-info/20",
    warning: "bg-gradient-to-br from-amber-50 to-orange-50 border-warning/20",
  };

  return (
    <div
      className={`rounded-xl border shadow-sm overflow-hidden ${variantClasses[variant]} ${className}`}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "success" | "info" | "warning";
}

export function CardHeader({ children, className = "", variant = "default" }: CardHeaderProps) {
  const variantClasses = {
    default: "bg-muted/50 text-foreground",
    success: "bg-success text-success-foreground",
    info: "bg-info text-info-foreground",
    warning: "bg-warning text-warning-foreground",
  };

  return (
    <div className={`px-6 py-4 border-b ${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  );
}

interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

export function CardBody({ children, className = "" }: CardBodyProps) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}
