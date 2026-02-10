import Link from "next/link";
import { Clock, BarChart3, Lock } from "lucide-react";
import Badge from "@/components/ui/Badge";
import ProgressBar from "@/components/ui/ProgressBar";

interface CourseCardProps {
  slug: string;
  title: string;
  thumbnail?: string | null;
  duration: number;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  theme: string;
  price?: number | null;
  isFree: boolean;
  isLocked?: boolean;
  progress?: number;
}

const levelLabels = {
  BEGINNER: "Débutant",
  INTERMEDIATE: "Intermédiaire",
  ADVANCED: "Avancé",
};

const levelColors = {
  BEGINNER: "success" as const,
  INTERMEDIATE: "warning" as const,
  ADVANCED: "premium" as const,
};

export default function CourseCard({
  slug,
  title,
  thumbnail,
  duration,
  level,
  theme,
  price,
  isFree,
  isLocked = false,
  progress,
}: CourseCardProps) {
  return (
    <Link href={`/cours/${slug}`} className="group block">
      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-primary/30 overflow-hidden">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="font-heading text-4xl text-muted/30">🧘</span>
            </div>
          )}

          {/* Lock overlay */}
          {isLocked && (
            <div className="absolute inset-0 bg-heading/40 backdrop-blur-[2px] flex items-center justify-center">
              <Lock className="w-8 h-8 text-white/80" />
            </div>
          )}

          {/* Duration badge */}
          <div className="absolute bottom-2 right-2 bg-heading/70 text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {duration} min
          </div>

          {/* Price/Free badge */}
          <div className="absolute top-2 left-2">
            {isFree ? (
              <Badge variant="free">Gratuit</Badge>
            ) : price ? (
              <Badge variant="premium">{price} €</Badge>
            ) : (
              <Badge variant="premium">Abonnement</Badge>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={levelColors[level]}>{levelLabels[level]}</Badge>
            <Badge>{theme}</Badge>
          </div>

          <h3 className="font-heading text-lg font-semibold text-heading group-hover:text-button transition-colors line-clamp-2">
            {title}
          </h3>

          {/* Progress */}
          {progress !== undefined && progress > 0 && (
            <ProgressBar value={progress} showLabel />
          )}
        </div>
      </div>
    </Link>
  );
}
