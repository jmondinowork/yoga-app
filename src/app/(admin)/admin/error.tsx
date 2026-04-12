"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <h2 className="font-heading text-xl font-bold text-heading">
        Une erreur est survenue
      </h2>
      <p className="text-muted text-sm max-w-md text-center">
        {error.message || "Erreur inattendue. Veuillez réessayer."}
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand/90 transition-colors"
      >
        Réessayer
      </button>
    </div>
  );
}
