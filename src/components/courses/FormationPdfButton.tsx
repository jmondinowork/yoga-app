"use client";

import { useState } from "react";
import { Loader2, FileText, Eye, X } from "lucide-react";
import Button from "@/components/ui/Button";

interface FormationPdfButtonProps {
  slug: string;
}

export default function FormationPdfButton({ slug }: FormationPdfButtonProps) {
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showViewer, setShowViewer] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch(`/api/formations/${slug}/guide-url`, {
        method: "POST",
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json();
      setPdfUrl(data.url);
      setShowViewer(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleClick} disabled={loading}>
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Eye className="w-4 h-4" />
        )}
        Consulter
      </Button>

      {showViewer && pdfUrl && (
        <div
          className="fixed inset-0 z-50 bg-heading/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowViewer(false)}
        >
          <div
            className="relative w-full max-w-5xl h-[90vh] bg-card rounded-2xl border border-border overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border bg-primary/20">
              <div className="flex items-center gap-2 text-heading">
                <FileText className="w-5 h-5" />
                <span className="font-heading font-semibold">Livret de formation</span>
              </div>
              <button
                onClick={() => setShowViewer(false)}
                className="p-2 rounded-lg hover:bg-primary/50 transition-colors text-muted hover:text-heading cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <iframe
              src={`${pdfUrl}#toolbar=0&navpanes=0`}
              className="w-full h-[calc(90vh-65px)]"
              title="Livret de formation"
            />
          </div>
        </div>
      )}
    </>
  );
}
