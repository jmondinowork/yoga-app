"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Lock, Play, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

interface VideoPlayerProps {
  /** URL de l'API qui retourne la presigned URL (ex: /api/cours/mon-slug/video-url) */
  apiUrl?: string | null;
  thumbnail?: string | null;
  title: string;
  isLocked: boolean;
  courseId?: string;
}

export default function VideoPlayer({
  apiUrl,
  thumbnail,
  title,
  isLocked,
  courseId,
}: VideoPlayerProps) {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);
  const lastSavedProgressRef = useRef(0);

  const saveProgress = useCallback((progress: number, completed: boolean) => {
    if (!courseId) return;
    const rounded = Math.round(progress);
    if (Math.abs(rounded - lastSavedProgressRef.current) < 5 && !completed) return;
    lastSavedProgressRef.current = rounded;
    fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, progress: rounded, completed }),
    }).catch(() => {});
  }, [courseId]);

  useEffect(() => {
    if (isLocked || !apiUrl || fetchedRef.current) return;
    fetchedRef.current = true;

    setLoading(true);
    setError(null);

    fetch(apiUrl, { method: "POST", cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Impossible de charger la vidéo");
        }
        return res.json();
      })
      .then((data) => {
        setVideoSrc(data.url);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [apiUrl, isLocked]);

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
            Abonnez-vous ou louez ce cours pour accéder à la vidéo complète
          </p>
          <Link
            href="/tarifs"
            className="inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all bg-button text-background hover:bg-accent px-6 py-3 text-base"
          >
            Voir les abonnements
          </Link>
        </div>
      </div>
    );
  }

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
          poster={thumbnail || undefined}
          preload="metadata"
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
