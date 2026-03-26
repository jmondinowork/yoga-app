"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

interface PurchaseButtonProps {
  type: "course" | "formation" | "subscription";
  itemId?: string;
  planId?: string;
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export default function PurchaseButton({
  type,
  itemId,
  planId,
  children,
  className,
  variant = "primary",
  size = "lg",
}: PurchaseButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handlePurchase = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          ...(type === "subscription" ? { planId } : { courseId: itemId }),
        }),
      });

      const data = await res.json();

      if (res.status === 401) {
        router.push(`/connexion?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
        return;
      }

      if (!res.ok) {
        setError(data.error || "Une erreur est survenue");
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button
        onClick={handlePurchase}
        loading={loading}
        className={className}
        variant={variant}
        size={size}
      >
        {children}
      </Button>
      {error && (
        <p className="text-sm text-red-500 mt-2 text-center">{error}</p>
      )}
    </div>
  );
}
