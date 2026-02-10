"use client";

import { Lock, Play } from "lucide-react";
import Button from "@/components/ui/Button";

interface VideoPlayerProps {
  videoUrl?: string | null;
  thumbnail?: string | null;
  title: string;
  isLocked: boolean;
  onUnlockClick?: () => void;
}

export default function VideoPlayer({
  videoUrl,
  thumbnail,
  title,
  isLocked,
  onUnlockClick,
}: VideoPlayerProps) {
  if (isLocked) {
    return (
      <div className="relative aspect-video bg-heading/5 rounded-2xl overflow-hidden">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-button/10 to-primary/30" />
        )}
        <div className="video-lock-overlay rounded-2xl">
          <Lock className="w-12 h-12 text-white/80" />
          <p className="text-lg font-heading font-semibold">Contenu réservé</p>
          <p className="text-sm text-white/60 text-center max-w-xs">
            Abonnez-vous ou achetez ce cours pour accéder à la vidéo complète
          </p>
          <Button onClick={onUnlockClick} size="lg">
            Débloquer ce cours
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-video bg-heading rounded-2xl overflow-hidden">
      {videoUrl ? (
        <video
          src={videoUrl}
          controls
          className="w-full h-full"
          poster={thumbnail || undefined}
        >
          Votre navigateur ne supporte pas la lecture vidéo.
        </video>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-white/60">
          <Play className="w-16 h-16" />
          <p className="font-heading text-lg">Vidéo bientôt disponible</p>
        </div>
      )}
    </div>
  );
}
