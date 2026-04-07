import Link from "next/link";
import Image from "next/image";
import { Clock, Lock } from "lucide-react";
import Badge from "@/components/ui/Badge";
import ProgressBar from "@/components/ui/ProgressBar";

interface CourseCardProps {
  slug: string;
  title: string;
  thumbnail?: string | null;
  duration: number;
  theme: string;
  price?: number | null;
  includedInSubscription?: boolean;
  isLocked?: boolean;
  progress?: number;
}

export default function CourseCard({
  slug,
  title,
  thumbnail,
  duration,
  theme,
  price,
  includedInSubscription = true,
  isLocked = false,
  progress,
}: CourseCardProps) {
  return (
    <Link href={`/cours/${slug}`} className="group block">
      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-primary/30 overflow-hidden">
          {thumbnail ? (
            <Image
              src={thumbnail}
              alt={title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
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

        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
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
