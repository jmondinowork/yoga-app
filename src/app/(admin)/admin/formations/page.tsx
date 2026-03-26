"use client";

import { useState, useEffect, useCallback } from "react";
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

export default function AdminFormationsPage() {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyFormation);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
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

  const fetchFormations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/formations?limit=100&search=${encodeURIComponent(search)}`);
      const data = await res.json();
      setFormations(data.formations || []);
    } catch {
      console.error("Erreur lors du chargement des formations");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchFormations();
  }, [fetchFormations]);

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
    setShowModal(true);
  }

  function openEdit(formation: Formation) {
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
    setShowModal(true);
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
        setUploadProgress("Upload de la miniature...");
        const fd = new FormData();
        fd.append("file", thumbnailFile);
        fd.append("type", "formation-thumbnail");
        fd.append("slug", form.slug);
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Erreur upload miniature");
        }
        thumbnailKey = (await res.json()).key;
      }

      // Upload guide PDF
      if (guideFile) {
        setUploadProgress("Upload du livret PDF...");
        const fd = new FormData();
        fd.append("file", guideFile);
        fd.append("type", "formation-guide");
        fd.append("slug", form.slug);
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Erreur upload livret");
        }
        bookletKey = (await res.json()).key;
      }

      // Upload vidéos
      const videoKeys: Record<number, string> = {};
      for (const [indexStr, file] of Object.entries(videoFiles)) {
        const index = parseInt(indexStr);
        const video = form.videos[index];
        if (!video) continue;

        const sortOrder = String(index + 1).padStart(2, "0");
        const name = sanitizeFilename(video.title || "video");
        const videoFilename = `${sortOrder}-${name}.mp4`;

        setUploadProgress(`Upload vidéo ${index + 1}/${form.videos.length}...`);
        const fd = new FormData();
        fd.append("file", file);
        fd.append("type", "formation-video");
        fd.append("slug", form.slug);
        fd.append("videoFilename", videoFilename);
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || `Erreur upload vidéo ${index + 1}`);
        }
        videoKeys[index] = (await res.json()).key;
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
      fetchFormations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion");
    } finally {
      setSaving(false);
      setUploadProgress("");
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Supprimer la formation "${title}" ? Cette action est irréversible.`)) return;

    try {
      const res = await fetch(`/api/admin/formations/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchFormations();
      }
    } catch {
      console.error("Erreur lors de la suppression");
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
      }
    } catch {
      console.error("Erreur lors de la mise à jour en lot");
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
      }
    } catch {
      console.error("Erreur lors de la mise à jour en lot");
    } finally {
      setBulkSaving(false);
    }
  }

  const filteredFormations = formations;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-heading mb-2">
            Gestion des formations
          </h1>
          <p className="text-muted">
            {formations.length} formation{formations.length > 1 ? "s" : ""} au total
          </p>
        </div>
        <Button onClick={openCreate}>
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
        onClose={() => setShowModal(false)}
        title={editingId ? "Modifier la formation" : "Nouvelle formation"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
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
                    slug: editingId ? form.slug : generateSlug(title),
                  });
                }}
                placeholder="Titre de la formation"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1">Slug</label>
              <Input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="slug-de-la-formation"
                required
              />
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

            <div className="grid grid-cols-2 gap-4">
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
              <div>
                <label className="block text-sm font-medium text-text mb-1">Miniature</label>
                {form.thumbnail && !thumbnailFile && (
                  <div className="mb-2 flex items-center gap-2 text-xs">
                    <ImageIcon className="w-3.5 h-3.5 text-green-600" />
                    <span className="text-green-600 font-medium">Image actuelle</span>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, thumbnail: "" })}
                      className="text-red-400 hover:text-red-600 ml-auto"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                {thumbnailFile && (
                  <div className="mb-2 flex items-center gap-2 text-xs">
                    <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-blue-600 truncate">{thumbnailFile.name}</span>
                    <button
                      type="button"
                      onClick={() => setThumbnailFile(null)}
                      className="text-red-400 hover:text-red-600 ml-auto"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-border bg-primary/10 hover:bg-primary/20 transition-colors cursor-pointer text-sm text-muted">
                  <Upload className="w-4 h-4" />
                  {thumbnailFile ? "Changer" : form.thumbnail ? "Remplacer" : "Choisir une image"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) setThumbnailFile(e.target.files[0]);
                    }}
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Livret PDF
              </label>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted shrink-0" />
                <div className="flex-1">
                  {form.bookletUrl && !guideFile && (
                    <div className="mb-2 flex items-center gap-2 text-xs">
                      <span className="text-green-600 font-medium">PDF actuel</span>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, bookletUrl: "" })}
                        className="text-red-400 hover:text-red-600 ml-auto"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  {guideFile && (
                    <div className="mb-2 flex items-center gap-2 text-xs">
                      <span className="text-blue-600 truncate">{guideFile.name}</span>
                      <button
                        type="button"
                        onClick={() => setGuideFile(null)}
                        className="text-red-400 hover:text-red-600 ml-auto"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-border bg-primary/10 hover:bg-primary/20 transition-colors cursor-pointer text-sm text-muted">
                    <Upload className="w-4 h-4" />
                    {guideFile ? "Changer" : form.bookletUrl ? "Remplacer" : "Choisir un PDF"}
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) setGuideFile(e.target.files[0]);
                      }}
                    />
                  </label>
                </div>
              </div>
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
                    className="bg-primary/20 rounded-xl border border-border overflow-hidden"
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
                      <GripVertical className="w-4 h-4 text-muted shrink-0" />
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
                            moveVideo(index, "up");
                          }}
                          disabled={index === 0}
                          className="p-1 hover:bg-primary/40 rounded disabled:opacity-30"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveVideo(index, "down");
                          }}
                          disabled={index === form.videos.length - 1}
                          className="p-1 hover:bg-primary/40 rounded disabled:opacity-30"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
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
                      <div className="p-4 pt-0 space-y-3 border-t border-border">
                        <div>
                          <label className="block text-xs font-medium text-text mb-1">
                            Titre de la vidéo
                          </label>
                          <Input
                            value={video.title}
                            onChange={(e) => updateVideo(index, "title", e.target.value)}
                            placeholder="Titre de la vidéo"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-text mb-1">
                            Description
                          </label>
                          <textarea
                            value={video.description || ""}
                            onChange={(e) =>
                              updateVideo(index, "description", e.target.value)
                            }
                            placeholder="Description de la vidéo..."
                            rows={2}
                            className="w-full px-3 py-2 rounded-lg bg-card border border-border text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-button/30 text-sm resize-y"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-text mb-1">
                              Vidéo (MP4)
                            </label>
                            {video.videoUrl && !videoFiles[index] && (
                              <div className="mb-1 flex items-center gap-2 text-xs">
                                <Film className="w-3 h-3 text-green-600" />
                                <span className="text-green-600 font-medium">Vidéo actuelle</span>
                                <button
                                  type="button"
                                  onClick={() => updateVideo(index, "videoUrl", "")}
                                  className="text-red-400 hover:text-red-600 ml-auto"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                            {videoFiles[index] && (
                              <div className="mb-1 flex items-center gap-2 text-xs">
                                <Film className="w-3 h-3 text-blue-600" />
                                <span className="text-blue-600 truncate">
                                  {videoFiles[index].name} ({(videoFiles[index].size / (1024 * 1024)).toFixed(1)} Mo)
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = { ...videoFiles };
                                    delete next[index];
                                    setVideoFiles(next);
                                  }}
                                  className="text-red-400 hover:text-red-600 ml-auto"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                            <label className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-dashed border-border bg-primary/10 hover:bg-primary/20 transition-colors cursor-pointer text-xs text-muted">
                              <Upload className="w-3.5 h-3.5" />
                              {videoFiles[index] ? "Changer" : video.videoUrl ? "Remplacer" : "Fichier MP4"}
                              <input
                                type="file"
                                accept="video/mp4"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    if (file.type !== "video/mp4") {
                                      setError("Seul le format MP4 est accepté");
                                      return;
                                    }
                                    setVideoFiles({ ...videoFiles, [index]: file });
                                  }
                                }}
                              />
                            </label>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-text mb-1">
                              Durée (min)
                            </label>
                            <Input
                              type="number"
                              min="0"
                              value={video.duration || ""}
                              onChange={(e) =>
                                updateVideo(index, "duration", parseInt(e.target.value) || 0)
                              }
                              placeholder="0"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-border sticky bottom-0 bg-card pb-1">
            {uploadProgress && (
              <span className="text-sm text-button animate-pulse mr-auto">
                {uploadProgress}
              </span>
            )}
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? uploadProgress || "Enregistrement..." : editingId ? "Mettre à jour" : "Créer la formation"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
