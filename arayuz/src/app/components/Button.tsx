import { ReactNode, ButtonHTMLAttributes } from "react";
import { motion } from "motion/react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "success" | "info" | "warning" | "destructive" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  ...props
}: ButtonProps) {
  const baseClasses = "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

  const variantClasses = {
    primary: "bg-gradient-to-r from-primary to-info text-primary-foreground shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 hover:brightness-105",
    success: "bg-gradient-to-r from-success to-emerald-400 text-success-foreground shadow-md shadow-success/25 hover:shadow-lg hover:shadow-success/30 hover:brightness-105",
    info: "bg-gradient-to-r from-info to-sky-300 text-info-foreground shadow-md shadow-info/25 hover:shadow-lg hover:shadow-info/30 hover:brightness-105",
    warning: "bg-gradient-to-r from-warning to-amber-400 text-warning-foreground shadow-md shadow-warning/25 hover:shadow-lg hover:shadow-warning/30 hover:brightness-105",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm hover:shadow-md",
    outline: "border-2 border-primary/30 bg-transparent text-foreground hover:bg-primary/5 hover:border-primary/60",
    ghost: "hover:bg-muted",
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-lg",
  };

  const widthClass = fullWidth ? "w-full" : "";

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}
