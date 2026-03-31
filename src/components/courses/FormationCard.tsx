import Link from "next/link";
import { BookOpen, Clock, Video, FileText } from "lucide-react";
import Badge from "@/components/ui/Badge";

interface FormationCardProps {
  slug: string;
  title: string;
  description: string;
  thumbnail?: string | null;
  price?: number | null;
  videoCount: number;
  totalDuration: number;
  hasBooklet?: boolean;
}

export default function FormationCard({
  slug,
  title,
  description,
  thumbnail,
  price,
  videoCount,
  totalDuration,
  hasBooklet,
}: FormationCardProps) {
  return (
    <Link href={`/formations/${slug}`} className="group block">
      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
        {/* Thumbnail */}
        <div className="relative aspect-[21/9] bg-primary/30 overflow-hidden">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-button/20 to-primary/40 flex items-center justify-center">
              <BookOpen className="w-12 h-12 text-button/40" />
            </div>
          )}

        </div>

        {/* Content */}
        <div className="p-5 space-y-3">
          <h3 className="font-heading text-xl font-semibold text-heading group-hover:text-button transition-colors">
            {title}
          </h3>
          <p className="text-sm text-text line-clamp-2">{description}</p>
          <div className="flex items-center gap-4 text-sm text-muted">
            <span className="flex items-center gap-1.5">
              <Video className="w-4 h-4" />
              {videoCount} vidéo{videoCount > 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {Math.floor(totalDuration / 60) > 0
                ? `${Math.floor(totalDuration / 60)}h${totalDuration % 60 > 0 ? `${totalDuration % 60}` : ""}`
                : `${totalDuration}min`}
            </span>
            {hasBooklet && (
              <span className="flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                Livret PDF
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
