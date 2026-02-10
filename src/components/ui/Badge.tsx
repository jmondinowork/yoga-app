interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "premium" | "free";
  className?: string;
}

const variantClasses = {
  default: "bg-primary/50 text-heading",
  success: "bg-green-100 text-green-800",
  warning: "bg-amber-100 text-amber-800",
  premium: "bg-button/10 text-button",
  free: "bg-accent-light text-button",
};

export default function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5
        text-xs font-medium rounded-full
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
