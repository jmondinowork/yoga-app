"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  BookOpen,
  X,
  GripVertical,
  FileText,
  Video,
  Clock,
  ChevronDown,
  ChevronUp,
  DollarSign,
  CheckSquare,
  Square,
  Upload,
  ImageIcon,
  Film,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { compressImage } from "@/lib/helpers/compress-image";
import { compressPdf } from "@/lib/helpers/compress-pdf";

interface FormationVideo {
  id?: string;
  title: string;
  description?: string;
  videoUrl?: string;
  thumbnail?: string;
  duration: number;
  sortOrder: number;
}

interface Formation {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail?: string | null;
  bookletUrl?: string | null;
  price?: number | null;
  isPublished: boolean;
  videos: FormationVideo[];
  _count: { purchases: number; videos: number };
}

const emptyFormation = {
  title: "",
  slug: "",
  description: "",
  thumbnail: "",
  bookletUrl: "",
  price: "",
  isPublished: false,
  videos: [] as FormationVideo[],
};

async function extractVideoMetadata(videoFile: File): Promise<{ thumbnail: File | null; durationMin: number }> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(videoFile);
    video.src = url;
    video.currentTime = 1;
    video.addEventListener("seeked", () => {
      const durationMin = Math.round(video.duration / 60);
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d")!.drawImage(video, 0, 0);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          const thumbnail = blob ? new File([blob], "thumbnail.jpg", { type: "image/jpeg" }) : null;
          resolve({ thumbnail, durationMin });
        },
        "image/jpeg",
        0.85
      );
    });
    video.addEventListener("error", () => {
      URL.revokeObjectURL(url);
      resolve({ thumbnail: null, durationMin: 0 });
    });
    video.load();
  });
}

export default function AdminFormationsPage() {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyFormation);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [expandedVideos, setExpandedVideos] = useState<Record<number, boolean>>({});

  // Multi-select
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showBulkPrice, setShowBulkPrice] = useState(false);
  const [bulkPrice, setBulkPrice] = useState("");
  const [bulkSaving, setBulkSaving] = useState(false);

  // File uploads
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [guideFile, setGuideFile] = useState<File | null>(null);
  const [videoFiles, setVideoFiles] = useState<Record<number, File>>({});
  const [uploadProgress, setUploadProgress] = useState("");
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string | null>(null);

  function uploadWithProgress(
    fd: FormData,
    onProgress: (pct: number) => void
  ): Promise<{ key: string }> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/admin/upload");
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          let msg = "Erreur upload";
          try { msg = JSON.parse(xhr.responseText).error || msg; } catch { /* non-JSON response (e.g. 413) */ }
          reject(new Error(msg));
        }
      };
      xhr.onerror = () => reject(new Error("Erreur réseau"));
      xhr.send(fd);
    });
  }

  const fetcher = (url: string) => fetch(url).then(r => r.json());
  const { data: formationsData, isLoading: loading, mutate: mutateFormations } = useSWR(
    `/api/admin/formations?limit=100&search=${encodeURIComponent(search)}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30_000 }
  );
  const formations: Formation[] = formationsData?.formations || [];
  const fetchFormations = useCallback(() => mutateFormations(), [mutateFormations]);

  function generateSlug(title: string) {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyFormation);
    setError("");
    setExpandedVideos({});
    setThumbnailFile(null);
    setGuideFile(null);
    setVideoFiles({});
    setUploadProgress("");
    setThumbnailPreviewUrl(null);
    setShowModal(true);
  }

  async function openEdit(formation: Formation) {
    setEditingId(formation.id);
    setForm({
      title: formation.title,
      slug: formation.slug,
      description: formation.description,
      thumbnail: formation.thumbnail || "",
      bookletUrl: formation.bookletUrl || "",
      price: formation.price?.toString() || "",
      isPublished: formation.isPublished,
      videos: formation.videos.map((v) => ({ ...v })),
    });
    setError("");
    setExpandedVideos({});
    setThumbnailFile(null);
    setGuideFile(null);
    setVideoFiles({});
    setUploadProgress("");
    setThumbnailPreviewUrl(null);
    setShowModal(true);

    if (formation.thumbnail) {
      try {
        const res = await fetch(`/api/admin/formations/${formation.id}/thumbnail-url`);
        if (res.ok) {
          const { url } = await res.json();
          setThumbnailPreviewUrl(url);
        }
      } catch {}
    }
  }

  function sanitizeFilename(title: string) {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      let thumbnailKey = form.thumbnail || undefined;
      let bookletKey = form.bookletUrl || undefined;

      // Upload miniature
      if (thumbnailFile) {
        setUploadProgress("Compression et upload de la miniature...");
        const compressed = await compressImage(thumbnailFile);
        const fd = new FormData();
        fd.append("file", compressed);
        fd.append("type", "formation-thumbnail");
        fd.append("slug", form.slug);
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        if (!res.ok) {
          let msg = "Erreur upload miniature";
          try { msg = (await res.json()).error || msg; } catch { /* non-JSON response (e.g. 413) */ }
          throw new Error(msg);
        }
        thumbnailKey = (await res.json()).key;
      }

      // Upload guide PDF
      if (guideFile) {
        setUploadProgress("Compression du livret PDF...");
        const compressedPdf = await compressPdf(guideFile);
        setUploadProgress("Upload du livret PDF...");
        const fd = new FormData();
        fd.append("file", compressedPdf);
        fd.append("type", "formation-guide");
        fd.append("slug", form.slug);
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        if (!res.ok) {
          let msg = "Erreur upload livret";
          try { msg = (await res.json()).error || msg; } catch { /* non-JSON response (e.g. 413) */ }
          throw new Error(msg);
        }
        bookletKey = (await res.json()).key;
      }

      // Upload vidéos
      const videoKeys: Record<number, string> = {};
      const videoEntries = Object.entries(videoFiles);
      for (let ei = 0; ei < videoEntries.length; ei++) {
        const [indexStr, file] = videoEntries[ei];
        const index = parseInt(indexStr);
        const video = form.videos[index];
        if (!video) continue;

        const isMp4 = file.type === "video/mp4";
        const sortOrder = String(index + 1).padStart(2, "0");
        const name = sanitizeFilename(video.title || "video");
        const videoFilename = `${sortOrder}-${name}.mp4`;

        setUploadPercent(0);
        setUploadProgress(`Envoi vidéo ${ei + 1}/${videoEntries.length}…`);
        const fd = new FormData();
        fd.append("file", file);
        fd.append("type", "formation-video");
        fd.append("slug", form.slug);
        fd.append("videoFilename", videoFilename);
        const { key } = await uploadWithProgress(fd, (pct) => {
          if (pct < 100) {
            setUploadPercent(pct);
            setUploadProgress(`Envoi vidéo ${ei + 1}/${videoEntries.length}… ${pct}%`);
          } else {
            setUploadPercent(null);
            setUploadProgress(isMp4
              ? `Traitement vidéo ${ei + 1}/${videoEntries.length}…`
              : `Conversion vidéo ${ei + 1}/${videoEntries.length} en MP4…`);
          }
        });
        videoKeys[index] = key;
        setUploadPercent(null);
      }

      setUploadProgress("Enregistrement...");

      const payload = {
        title: form.title,
        slug: form.slug,
        description: form.description,
        thumbnail: thumbnailKey,
        bookletUrl: bookletKey,
        price: form.price ? parseFloat(form.price) : null,
        isPublished: form.isPublished,
        videos: form.videos.map((v, i) => ({
          ...(v.id ? { id: v.id } : {}),
          title: v.title,
          description: v.description || undefined,
          videoUrl: videoKeys[i] || v.videoUrl || undefined,
          thumbnail: v.thumbnail || undefined,
          duration: v.duration || 0,
          sortOrder: i + 1,
        })),
      };

      const url = editingId
        ? `/api/admin/formations/${editingId}`
        : "/api/admin/formations";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Une erreur est survenue");
        return;
      }

      setShowModal(false);
      setThumbnailFile(null);
      setGuideFile(null);
      setVideoFiles({});
      setToast(editingId ? "Formation modifiée avec succès ✓" : "Formation créée avec succès ✓");
      setTimeout(() => setToast(null), 3000);
      fetchFormations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion");
    } finally {
      setSaving(false);
      setUploadProgress("");
      setUploadPercent(null);
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Supprimer la formation "${title}" ? Cette action est irréversible.`)) return;

    try {
      const res = await fetch(`/api/admin/formations/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchFormations();
        setToast("Formation supprimée ✓");
        setTimeout(() => setToast(null), 3000);
      }
    } catch {
      setToast("Erreur lors de la suppression");
      setTimeout(() => setToast(null), 3000);
    }
  }

  function addVideo() {
    const newIndex = form.videos.length;
    setForm({
      ...form,
      videos: [
        ...form.videos,
        { title: "", description: "", videoUrl: "", duration: 0, sortOrder: newIndex + 1 },
      ],
    });
    setExpandedVideos({ ...expandedVideos, [newIndex]: true });
  }

  function removeVideo(index: number) {
    setForm({
      ...form,
      videos: form.videos.filter((_, i) => i !== index),
    });
    // Reindex video files
    const newVideoFiles: Record<number, File> = {};
    for (const [k, v] of Object.entries(videoFiles)) {
      const i = parseInt(k);
      if (i < index) newVideoFiles[i] = v;
      else if (i > index) newVideoFiles[i - 1] = v;
    }
    setVideoFiles(newVideoFiles);
  }

  function updateVideo(index: number, field: string, value: string | number) {
    const updated = [...form.videos];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, videos: updated });
  }

  function moveVideo(index: number, direction: "up" | "down") {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= form.videos.length) return;
    const updated = [...form.videos];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setForm({ ...form, videos: updated });
  }

  function handleDrop(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return;
    const updated = [...form.videos];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    // Reindex video files
    const oldFiles = { ...videoFiles };
    const newVideoFiles: Record<number, File> = {};
    const keys = Object.keys(oldFiles).map(Number);
    for (const k of keys) {
      let newK = k;
      if (k === fromIndex) {
        newK = toIndex;
      } else if (fromIndex < toIndex) {
        if (k > fromIndex && k <= toIndex) newK = k - 1;
      } else {
        if (k >= toIndex && k < fromIndex) newK = k + 1;
      }
      newVideoFiles[newK] = oldFiles[k];
    }
    setVideoFiles(newVideoFiles);
    setForm({ ...form, videos: updated });
    setDragIndex(null);
    setDragOverIndex(null);
  }

  function getTotalDuration(videos: FormationVideo[]) {
    const total = videos.reduce((acc, v) => acc + (v.duration || 0), 0);
    const h = Math.floor(total / 60);
    const m = total % 60;
    return h > 0 ? `${h}h${m > 0 ? `${m}min` : ""}` : `${m}min`;
  }

  // Multi-select handlers
  function toggleSelect(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  function selectAll() {
    if (selected.size === filteredFormations.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredFormations.map((f) => f.id)));
    }
  }

  async function bulkUpdatePrice() {
    if (selected.size === 0) return;
    setBulkSaving(true);
    try {
      const res = await fetch("/api/admin/formations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: Array.from(selected),
          data: { price: bulkPrice ? parseFloat(bulkPrice) : null },
        }),
      });
      if (res.ok) {
        setSelected(new Set());
        setShowBulkPrice(false);
        setBulkPrice("");
        fetchFormations();
        setToast("Prix mis à jour ✓");
        setTimeout(() => setToast(null), 3000);
      }
    } catch {
      setToast("Erreur lors de la mise à jour en lot");
      setTimeout(() => setToast(null), 3000);
    } finally {
      setBulkSaving(false);
    }
  }

  async function bulkTogglePublish(value: boolean) {
    if (selected.size === 0) return;
    setBulkSaving(true);
    try {
      const res = await fetch("/api/admin/formations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: Array.from(selected),
          data: { isPublished: value },
        }),
      });
      if (res.ok) {
        setSelected(new Set());
        fetchFormations();
        setToast("Publication mise à jour ✓");
        setTimeout(() => setToast(null), 3000);
      }
    } catch {
      setToast("Erreur lors de la mise à jour en lot");
      setTimeout(() => setToast(null), 3000);
    } finally {
      setBulkSaving(false);
    }
  }

  const filteredFormations = formations;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-[100] bg-card border border-border rounded-xl px-4 py-3 shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <span className="text-sm font-medium text-heading">{toast}</span>
          <button onClick={() => setToast(null)} className="text-muted hover:text-heading text-xs cursor-pointer">✕</button>
        </div>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-heading mb-2">
            Gestion des formations
          </h1>
          <p className="text-muted">
            {formations.length} formation{formations.length > 1 ? "s" : ""} au total
          </p>
        </div>
        <Button onClick={openCreate} className="self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          Nouvelle formation
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-muted absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Rechercher une formation..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-card border border-border text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-button/30"
        />
      </div>

      {/* Multi-select actions bar */}
      {selected.size > 0 && (
        <div className="bg-accent-light/30 border border-button/20 rounded-xl p-4 flex items-center gap-4 flex-wrap">
          <span className="text-sm font-medium text-heading">
            {selected.size} formation{selected.size > 1 ? "s" : ""} sélectionnée{selected.size > 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => setShowBulkPrice(true)}>
              <DollarSign className="w-4 h-4" />
              Modifier le prix
            </Button>
            <Button variant="outline" size="sm" onClick={() => bulkTogglePublish(true)} disabled={bulkSaving}>
              Publier
            </Button>
            <Button variant="outline" size="sm" onClick={() => bulkTogglePublish(false)} disabled={bulkSaving}>
              Dépublier
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
              <X className="w-4 h-4" />
              Annuler
            </Button>
          </div>
        </div>
      )}

      {/* Bulk price input */}
      {showBulkPrice && (
        <div className="bg-card border border-border rounded-xl p-4 flex items-end gap-4">
          <div className="flex-1 max-w-xs">
            <Input
              id="bulkFormationPrice"
              label={`Nouveau prix pour ${selected.size} formation${selected.size > 1 ? "s" : ""}`}
              type="number"
              step="0.01"
              min="0"
              value={bulkPrice}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBulkPrice(e.target.value)}
              placeholder="Ex: 49.99"
            />
          </div>
          <Button onClick={bulkUpdatePrice} disabled={bulkSaving}>
            {bulkSaving ? "..." : "Appliquer"}
          </Button>
          <Button variant="ghost" onClick={() => setShowBulkPrice(false)}>
            Annuler
          </Button>
        </div>
      )}

      {/* Select all */}
      {!loading && filteredFormations.length > 0 && (
        <div className="flex items-center gap-2">
          <button
            onClick={selectAll}
            className="flex items-center gap-2 text-sm text-muted hover:text-heading transition-colors cursor-pointer"
          >
            {selected.size === filteredFormations.length && filteredFormations.length > 0 ? (
              <CheckSquare className="w-4 h-4 text-button" />
            ) : (
              <Square className="w-4 h-4" />
            )}
            Tout sélectionner
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-muted">Chargement...</div>
      ) : filteredFormations.length === 0 ? (
        <div className="text-center py-12 text-muted">
          {search ? "Aucune formation trouvée" : "Aucune formation créée"}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFormations.map((formation) => (
            <div
              key={formation.id}
              className={`bg-card rounded-2xl border p-6 space-y-4 ${
                selected.has(formation.id)
                  ? "border-button/40 bg-accent-light/10"
                  : "border-border"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleSelect(formation.id)}
                    className="cursor-pointer shrink-0"
                  >
                    {selected.has(formation.id) ? (
                      <CheckSquare className="w-5 h-5 text-button" />
                    ) : (
                      <Square className="w-5 h-5 text-muted" />
                    )}
                  </button>
                  <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-button" />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-semibold text-heading">
                      {formation.title}
                    </h3>
                    <p className="text-xs text-muted">{formation.slug}</p>
                  </div>
                </div>
                {formation.isPublished ? (
                  <Badge variant="success">Publié</Badge>
                ) : (
                  <Badge variant="warning">Brouillon</Badge>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm text-muted flex-wrap">
                <span className="flex items-center gap-1">
                  <Video className="w-3.5 h-3.5" />
                  {formation._count.videos} vidéo{formation._count.videos > 1 ? "s" : ""}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {getTotalDuration(formation.videos)}
                </span>
                {formation.bookletUrl && (
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    Livret PDF
                  </span>
                )}
                <span>
                  {formation.price ? `${formation.price} €` : "Prix non défini"}
                </span>
              </div>

              <div className="flex gap-2 pt-2 border-t border-border">
                <Button variant="ghost" size="sm" onClick={() => openEdit(formation)}>
                  <Edit className="w-4 h-4" />
                  Modifier
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:bg-red-50"
                  onClick={() => handleDelete(formation.id, formation.title)}
                >
                  <Trash2 className="w-4 h-4" />
                  Supprimer
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Création / Édition */}
      <Modal
        isOpen={showModal}
        onClose={() => { if (!saving) setShowModal(false); }}
        title={editingId ? "Modifier la formation" : "Nouvelle formation"}
        size="lg"
      >
        <div className="max-h-[75vh] overflow-y-auto px-1 -mx-1">
          <form id="formation-form" onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* Infos de base */}
            <div className="space-y-4">
              <h3 className="font-heading text-lg font-semibold text-heading">
                Informations générales
              </h3>

              <div>
                <label className="block text-sm font-medium text-text mb-1">Titre</label>
                <Input
                  value={form.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    setForm({
                      ...form,
                      title,
                      slug: generateSlug(title),
                    });
                  }}
                  placeholder="Titre de la formation"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-1">Prix (€)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="Prix de la formation"
                />
              </div>

              {/* Image + PDF side by side */}
              <div className="grid grid-cols-2 gap-4">
                {/* Image de la formation */}
                <div className="rounded-xl border border-border overflow-hidden bg-card">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                    <span className="text-xs font-semibold text-heading">Image de la formation</span>
                    {(form.thumbnail || thumbnailFile) ? (
                      <span className="text-xs text-green-600 font-medium">✓ {thumbnailFile ? "Nouveau" : "Actuelle"}</span>
                    ) : (
                      <span className="text-xs text-muted">Vide</span>
                    )}
                  </div>
                  <label className="block w-full aspect-[4/3] cursor-pointer">
                    {thumbnailFile ? (
                      <img src={URL.createObjectURL(thumbnailFile)} alt="Nouvelle image" className="w-full h-full object-cover" />
                    ) : form.thumbnail && thumbnailPreviewUrl ? (
                      <img src={thumbnailPreviewUrl} alt="Image actuelle" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-primary/10 flex flex-col items-center justify-center gap-2 hover:bg-primary/20 transition-colors">
                        <ImageIcon className="w-6 h-6 text-muted/50" />
                        <span className="text-xs text-muted">Choisir une image</span>
                      </div>
                    )}
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { if (e.target.files?.[0]) setThumbnailFile(e.target.files[0]); }} />
                  </label>
                  <div className="flex items-center gap-2 px-3 py-2 border-t border-border bg-card">
                    <label className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-text py-1.5 rounded-lg border border-border bg-primary/10 hover:bg-primary/20 transition-colors cursor-pointer">
                      <Upload className="w-3 h-3" />
                      {thumbnailFile ? "Changer" : form.thumbnail ? "Remplacer" : "Ajouter"}
                      <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { if (e.target.files?.[0]) setThumbnailFile(e.target.files[0]); }} />
                    </label>
                    {(form.thumbnail || thumbnailFile) && (
                      <button type="button" onClick={() => { setThumbnailFile(null); setThumbnailPreviewUrl(null); setForm({ ...form, thumbnail: "" }); }} className="flex items-center justify-center p-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 transition-colors text-red-400 hover:text-red-600" title="Supprimer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Livret PDF */}
                <div className="rounded-xl border border-border overflow-hidden bg-card">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                    <span className="text-xs font-semibold text-heading">Livret PDF</span>
                    {(form.bookletUrl || guideFile) ? (
                      <span className="text-xs text-green-600 font-medium">✓ {guideFile ? "Nouveau" : "Actuel"}</span>
                    ) : (
                      <span className="text-xs text-muted">Vide</span>
                    )}
                  </div>
                  <div className="flex flex-col items-center justify-center aspect-[4/3] px-4">
                    <FileText className="w-6 h-6 text-muted/50 mb-2" />
                    {guideFile ? (
                      <span className="text-xs text-text truncate max-w-full">{guideFile.name}</span>
                    ) : form.bookletUrl ? (
                      <span className="text-xs text-text">PDF enregistré</span>
                    ) : (
                      <span className="text-xs text-muted">Aucun livret</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 border-t border-border bg-card">
                    <label className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-text py-1.5 rounded-lg border border-border bg-primary/10 hover:bg-primary/20 transition-colors cursor-pointer">
                      <Upload className="w-3 h-3" />
                      {guideFile ? "Changer" : form.bookletUrl ? "Remplacer" : "Ajouter"}
                      <input type="file" accept="application/pdf" className="hidden" onChange={(e) => { if (e.target.files?.[0]) setGuideFile(e.target.files[0]); }} />
                    </label>
                    {(form.bookletUrl || guideFile) && (
                      <button type="button" onClick={() => { setGuideFile(null); setForm({ ...form, bookletUrl: "" }); }} className="flex items-center justify-center p-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 transition-colors text-red-400 hover:text-red-600" title="Supprimer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Description détaillée de la formation..."
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-xl bg-card border border-border text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-button/30 resize-y"
                  required
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                  className="w-4 h-4 rounded border-border text-button focus:ring-button/30"
                />
                <span className="text-sm text-text">Publier la formation</span>
              </label>
            </div>

            {/* Vidéos */}
            <div className="space-y-4 border-t border-border pt-6">
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-lg font-semibold text-heading">
                  Vidéos ({form.videos.length})
                </h3>
                <Button type="button" variant="outline" size="sm" onClick={addVideo}>
                  <Plus className="w-4 h-4" />
                  Ajouter une vidéo
                </Button>
              </div>

              {form.videos.length === 0 ? (
                <p className="text-sm text-muted text-center py-6">
                  Aucune vidéo ajoutée. Cliquez sur &quot;Ajouter une vidéo&quot; pour commencer.
                </p>
              ) : (
                <div className="space-y-3">
                  {form.videos.map((video, index) => (
                    <div
                      key={index}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/plain', String(index));
                        setDragIndex(index);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        setDragOverIndex(index);
                      }}
                      onDragLeave={() => setDragOverIndex(null)}
                      onDrop={(e) => {
                        e.preventDefault();
                        const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                        handleDrop(fromIndex, index);
                      }}
                      onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
                      className={`bg-primary/20 rounded-xl border overflow-hidden transition-all ${
                        dragOverIndex === index ? 'border-button ring-2 ring-button/30' : 'border-border'
                      } ${dragIndex === index ? 'opacity-50' : ''}`}
                    >
                      {/* Header de la vidéo */}
                      <div
                        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-primary/30 transition-colors"
                        onClick={() =>
                          setExpandedVideos({
                            ...expandedVideos,
                            [index]: !expandedVideos[index],
                          })
                        }
                      >
                        <GripVertical className="w-4 h-4 text-muted shrink-0 cursor-grab active:cursor-grabbing" />
                        <span className="w-6 h-6 rounded-full bg-button/10 flex items-center justify-center text-xs font-medium text-button shrink-0">
                          {index + 1}
                        </span>
                        <span className="flex-1 text-sm font-medium text-heading truncate">
                          {video.title || "Nouvelle vidéo"}
                        </span>
                        {video.duration > 0 && (
                          <span className="text-xs text-muted">{video.duration} min</span>
                        )}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeVideo(index);
                            }}
                            className="p-1 hover:bg-red-100 rounded text-red-500"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {expandedVideos[index] ? (
                          <ChevronUp className="w-4 h-4 text-muted" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted" />
                        )}
                      </div>

                      {/* Détails de la vidéo */}
                      {expandedVideos[index] && (
                        <div className="p-4 space-y-3 border-t border-border">
                          {/* Titre */}
                          <div>
                            <label className="block text-xs font-medium text-text mb-1">Titre de la vidéo</label>
                            <Input value={video.title} onChange={(e) => updateVideo(index, "title", e.target.value)} placeholder="Titre de la vidéo" required />
                          </div>

                          {/* Description */}
                          <div>
                            <label className="block text-xs font-medium text-text mb-1">Description</label>
                            <textarea value={video.description || ""} onChange={(e) => updateVideo(index, "description", e.target.value)} placeholder="Description..." rows={2} className="w-full px-3 py-2 rounded-lg bg-card border border-border text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-button/30 text-sm resize-y" />
                          </div>

                          {/* Video file - compact bar */}
                          <div className="rounded-xl border border-border overflow-hidden bg-card">
                            <div className="flex items-center gap-3 px-3 py-2.5">
                              <div className="w-8 h-8 rounded-lg bg-heading/90 flex items-center justify-center shrink-0">
                                <Film className="w-4 h-4 text-white/70" />
                              </div>
                              <div className="flex-1 min-w-0">
                                {videoFiles[index] ? (
                                  <>
                                    <p className="text-xs font-medium text-heading truncate">{videoFiles[index].name}</p>
                                    <p className="text-[10px] text-green-600 font-medium">Nouveau fichier{video.duration > 0 ? ` · ${video.duration} min` : ""}</p>
                                  </>
                                ) : video.videoUrl ? (
                                  <>
                                    <p className="text-xs font-medium text-heading">Vidéo enregistrée</p>
                                    <p className="text-[10px] text-green-600 font-medium">✓ Actuelle{video.duration > 0 ? ` · ${video.duration} min` : ""}</p>
                                  </>
                                ) : (
                                  <p className="text-xs text-muted">Aucune vidéo</p>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <label className="flex items-center gap-1.5 text-xs font-medium text-text px-3 py-1.5 rounded-lg border border-border bg-primary/10 hover:bg-primary/20 transition-colors cursor-pointer">
                                  <Upload className="w-3 h-3" />
                                  {videoFiles[index] ? "Changer" : video.videoUrl ? "Remplacer" : "Ajouter"}
                                  <input type="file" accept="video/mp4,video/quicktime,video/webm,video/x-msvideo,video/avi,video/x-matroska,.mp4,.mov,.webm,.avi,.mkv,.m4v" className="hidden" onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      setVideoFiles({ ...videoFiles, [index]: file });
                                      extractVideoMetadata(file).then(({ durationMin }) => {
                                        if (durationMin > 0) {
                                          updateVideo(index, "duration", durationMin);
                                        }
                                      });
                                    }
                                  }} />
                                </label>
                                {(video.videoUrl || videoFiles[index]) && (
                                  <button type="button" onClick={() => {
                                    const next = { ...videoFiles };
                                    delete next[index];
                                    setVideoFiles(next);
                                    updateVideo(index, "videoUrl", "");
                                    updateVideo(index, "duration", 0);
                                  }} className="flex items-center justify-center p-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 transition-colors text-red-400 hover:text-red-600" title="Supprimer">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </form>
        </div>

        {saving && (
          <div className="mt-3 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700 font-medium text-center">
            ⚠️ Traitement en cours — veuillez ne pas fermer cette fenêtre
          </div>
        )}

        <div className="flex gap-3 justify-end pt-4 mt-2 border-t border-border">
          {(saving && uploadProgress) && (
            <div className="mr-auto flex flex-col gap-1.5 justify-center flex-1 min-w-0">
              <span className="text-sm text-button font-medium truncate">{uploadProgress}</span>
              {uploadPercent !== null ? (
                <div className="w-full bg-primary/20 rounded-full h-1.5">
                  <div
                    className="bg-button rounded-full h-1.5 transition-all duration-200"
                    style={{ width: `${uploadPercent}%` }}
                  />
                </div>
              ) : uploadProgress ? (
                <div className="w-full bg-primary/20 rounded-full h-1.5 overflow-hidden">
                  <div className="h-1.5 bg-button rounded-full animate-[progress-indeterminate_1.4s_ease-in-out_infinite] w-1/3" />
                </div>
              ) : null}
            </div>
          )}
          <Button type="button" variant="ghost" onClick={() => setShowModal(false)} disabled={saving}>
            Annuler
          </Button>
          <Button type="submit" form="formation-form" disabled={saving}>
            {saving ? "Traitement…" : editingId ? "Mettre à jour" : "Créer la formation"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
