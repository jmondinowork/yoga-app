"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Check, Play, Lock, Clock, X, Loader2, AlertCircle } from "lucide-react";

interface FormationVideoData {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  sortOrder: number;
  videoUrl: string | null;
}

interface VideoProgress {
  progress: number;
  completed: boolean;
}

interface FormationVideoListProps {
  slug: string;
  videos: FormationVideoData[];
  hasAccess: boolean;
  videoProgressMap: Record<string, VideoProgress>;
}

function FormationPlayer({
  slug,
  filename,
  title,
  formationVideoId,
}: {
  slug: string;
  filename: string;
  title: string;
  formationVideoId: string;
}) {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastSavedProgressRef = useRef(0);

  const saveProgress = useCallback((progress: number, completed: boolean) => {
    const rounded = Math.round(progress);
    if (Math.abs(rounded - lastSavedProgressRef.current) < 5 && !completed) return;
    lastSavedProgressRef.current = rounded;
    fetch("/api/formations/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formationVideoId, progress: rounded, completed }),
    }).catch(() => {});
  }, [formationVideoId]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setVideoSrc(null);

    fetch(`/api/formations/${slug}/video-url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename }),
      cache: "no-store",
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Impossible de charger la vidéo");
        }
        return res.json();
      })
      .then((data) => setVideoSrc(data.url))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug, filename]);

  if (loading) {
    return (
      <div className="relative aspect-video bg-heading rounded-2xl overflow-hidden flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-white/60 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative aspect-video bg-heading rounded-2xl overflow-hidden flex flex-col items-center justify-center gap-3 text-white/60">
        <AlertCircle className="w-12 h-12" />
        <p className="font-heading text-lg">Erreur de chargement</p>
        <p className="text-sm text-white/40">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative aspect-video bg-heading rounded-2xl overflow-hidden">
      {videoSrc ? (
        <video
          src={videoSrc}
          controls
          controlsList="nodownload"
          disablePictureInPicture
          onContextMenu={(e) => e.preventDefault()}
          className="w-full h-full"
          onTimeUpdate={(e) => {
            const video = e.currentTarget;
            if (!video.duration) return;
            const pct = (video.currentTime / video.duration) * 100;
            saveProgress(pct, false);
          }}
          onEnded={() => saveProgress(100, true)}
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

export default function FormationVideoList({
  slug,
  videos,
  hasAccess,
  videoProgressMap,
}: FormationVideoListProps) {
  const [activeVideoIndex, setActiveVideoIndex] = useState<number | null>(null);

  const activeVideo = activeVideoIndex !== null ? videos[activeVideoIndex] : null;

  return (
    <div className="space-y-6">
      {/* Player vidéo actif */}
      {activeVideo && hasAccess && activeVideo.videoUrl && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-semibold text-heading text-lg">
              {activeVideo.sortOrder}. {activeVideo.title}
            </h3>
            <button
              onClick={() => setActiveVideoIndex(null)}
              className="p-1 rounded-lg hover:bg-primary/50 transition-colors text-muted"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <FormationPlayer
            slug={slug}
            filename={activeVideo.videoUrl}
            title={activeVideo.title}
            formationVideoId={activeVideo.id}
            key={activeVideo.id}
          />
        </div>
      )}

      {/* Liste des vidéos */}
      <div>
        <h2 className="font-heading text-2xl font-semibold text-heading mb-6">
          Programme ({videos.length} vidéo{videos.length > 1 ? "s" : ""})
        </h2>
        <div className="space-y-2">
          {videos.map((video, index) => {
            const vProgress = videoProgressMap[video.id];
            const isActive = activeVideoIndex === index;

            return (
              <button
                key={video.id}
                type="button"
                onClick={() => hasAccess && video.videoUrl ? setActiveVideoIndex(index) : undefined}
                disabled={!hasAccess || !video.videoUrl}
                className={`w-full flex items-center gap-4 p-4 bg-card rounded-xl border transition-colors text-left ${
                  isActive
                    ? "border-button bg-button/5"
                    : "border-border hover:border-button/30"
                } ${hasAccess && video.videoUrl ? "cursor-pointer" : "cursor-default"}`}
              >
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                  {vProgress?.completed ? (
                    <Check className="w-4 h-4 text-button" />
                  ) : hasAccess ? (
                    <Play className="w-4 h-4 text-button" />
                  ) : (
                    <span className="text-sm font-medium text-muted">
                      {index + 1}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-heading truncate">
                    {video.title}
                  </p>
                  {video.description && (
                    <p className="text-xs text-muted truncate mt-0.5">
                      {video.description}
                    </p>
                  )}
                  {vProgress && !vProgress.completed && vProgress.progress > 0 && (
                    <div className="mt-1 h-1 bg-primary/30 rounded-full overflow-hidden w-32">
                      <div
                        className="h-full bg-button rounded-full"
                        style={{ width: `${vProgress.progress}%` }}
                      />
                    </div>
                  )}
                </div>
                <span className="text-sm text-muted flex items-center gap-1 shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                  {video.duration} min
                </span>
                {!hasAccess && (
                  <Lock className="w-4 h-4 text-muted/50 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
