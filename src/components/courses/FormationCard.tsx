import Link from "next/link";
import { BookOpen, Clock } from "lucide-react";
import Badge from "@/components/ui/Badge";

interface FormationCardProps {
  slug: string;
  title: string;
  description: string;
  thumbnail?: string | null;
  price?: number | null;
  courseCount: number;
  totalDuration: number;
}

export default function FormationCard({
  slug,
  title,
  description,
  thumbnail,
  price,
  courseCount,
  totalDuration,
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

          {/* Price */}
          <div className="absolute top-3 right-3">
            {price ? (
              <Badge variant="premium">{price} €</Badge>
            ) : (
              <Badge variant="premium">Inclus dans l&apos;abonnement</Badge>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3">
          <h3 className="font-heading text-xl font-semibold text-heading group-hover:text-button transition-colors">
            {title}
          </h3>
          <p className="text-sm text-text line-clamp-2">{description}</p>
          <div className="flex items-center gap-4 text-sm text-muted">
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" />
              {courseCount} cours
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {totalDuration} min
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
