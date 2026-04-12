"use client";

import { useState, useCallback } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  DollarSign,
  CheckSquare,
  Square,
  X,
  Upload,
  ImageIcon,
  Film,
  Tags,
  Pencil,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { compressImage } from "@/lib/helpers/compress-image";

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail: string | null;
  videoUrl: string | null;
  duration: number;
  theme: string;
  price: number | null;
  includedInSubscription: boolean;
  isPublished: boolean;
  sortOrder: number;
  _count: { purchases: number; progress: number };
}

const emptyForm = {
  title: "",
  slug: "",
  description: "",
  thumbnail: "",
  videoUrl: "",
  duration: "",
  theme: "Vinyasa",
  price: "10",
  includedInSubscription: true,
  isPublished: false,
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

export default function AdminCoursPage() {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  // Multi-select
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showBulkPrice, setShowBulkPrice] = useState(false);
  const [bulkPrice, setBulkPrice] = useState("");
  const [bulkSaving, setBulkSaving] = useState(false);

  // Themes
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [newThemeName, setNewThemeName] = useState("");
  const [themeError, setThemeError] = useState("");
  const [themeSaving, setThemeSaving] = useState(false);
  const [editingTheme, setEditingTheme] = useState<string | null>(null);
  const [editingThemeName, setEditingThemeName] = useState("");

  const fetcher = (url: string) => fetch(url).then(r => r.json());

  const { data: coursesData, isLoading: loading, mutate: mutateCourses } = useSWR(
    `/api/admin/courses?limit=100&search=${encodeURIComponent(search)}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30_000 }
  );
  const courses: Course[] = coursesData?.courses || [];

  const { data: themesData, mutate: mutateThemes } = useSWR<{ themes: { name: string; courseCount: number }[] }>(
    "/api/admin/themes",
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  );
  const themes = themesData?.themes || [];

  const fetchCourses = useCallback(() => mutateCourses(), [mutateCourses]);
  const fetchThemes = useCallback(() => mutateThemes(), [mutateThemes]);

  async function handleAddTheme() {
    if (!newThemeName.trim()) return;
    setThemeSaving(true);
    setThemeError("");
    try {
      const res = await fetch("/api/admin/themes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newThemeName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setThemeError(data.error || "Erreur"); return; }
      setNewThemeName("");
      mutateThemes();
    } catch {
      setThemeError("Erreur de connexion");
    } finally {
      setThemeSaving(false);
    }
  }

  async function handleRenameTheme(oldName: string, newName: string) {
    if (!newName.trim() || newName.trim() === oldName) { setEditingTheme(null); return; }
    setThemeSaving(true);
    setThemeError("");
    try {
      const res = await fetch("/api/admin/themes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldName, newName: newName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setThemeError(data.error || "Erreur"); return; }
      setEditingTheme(null);
      mutateThemes();
      mutateCourses();
    } catch {
      setThemeError("Erreur de connexion");
    } finally {
      setThemeSaving(false);
    }
  }

  async function handleDeleteTheme(name: string) {
    setThemeSaving(true);
    setThemeError("");
    try {
      const res = await fetch("/api/admin/themes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) { setThemeError(data.error || "Erreur"); return; }
      mutateThemes();
    } catch {
      setThemeError("Erreur de connexion");
    } finally {
      setThemeSaving(false);
    }
  }

  // File uploads
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState("");
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);

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
          const err = JSON.parse(xhr.responseText || '{"error":"Erreur serveur"}');
          reject(new Error(err.error || "Erreur upload"));
        }
      };
      xhr.onerror = () => reject(new Error("Erreur réseau"));
      xhr.send(fd);
    });
  }

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
    setForm(emptyForm);
    setError("");
    setThumbnailFile(null);
    setThumbnailPreviewUrl(null);
    setVideoFile(null);
    setUploadProgress("");
    setShowModal(true);
  }

  async function openEdit(course: Course) {
    setEditingId(course.id);
    setForm({
      title: course.title,
      slug: course.slug,
      description: course.description,
      thumbnail: course.thumbnail || "",
      videoUrl: course.videoUrl || "",
      duration: course.duration.toString(),
      theme: course.theme,
      price: course.price?.toString() || "",
      includedInSubscription: course.includedInSubscription,
      isPublished: course.isPublished,
    });
    setError("");
    setThumbnailFile(null);
    setThumbnailPreviewUrl(null);
    setVideoFile(null);
    setUploadProgress("");
    setShowModal(true);

    // Charger l'aperçu de la miniature existante
    if (course.thumbnail) {
      try {
        const res = await fetch(`/api/admin/courses/${course.id}/thumbnail-url`);
        if (res.ok) {
          const { url } = await res.json();
          setThumbnailPreviewUrl(url);
        }
      } catch {
        // silently ignore
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      let thumbnailKey = form.thumbnail || undefined;
      let videoKey = form.videoUrl || undefined;

      // Upload miniature si nouveau fichier sélectionné
      if (thumbnailFile) {
        setUploadProgress("Compression et upload de la miniature...");
        const compressed = await compressImage(thumbnailFile);
        const fd = new FormData();
        fd.append("file", compressed);
        fd.append("type", "course-thumbnail");
        fd.append("slug", form.slug);
        const uploadRes = await fetch("/api/admin/upload", {
          method: "POST",
          body: fd,
        });
        if (!uploadRes.ok) {
          const data = await uploadRes.json();
          throw new Error(data.error || "Erreur upload miniature");
        }
        const { key } = await uploadRes.json();
        thumbnailKey = key;
      }

      // Upload vidéo si nouveau fichier sélectionné
      if (videoFile) {
        const isMp4 = videoFile.type === "video/mp4";
        setUploadPercent(0);
        setUploadProgress("Envoi de la vidéo…");
        const fd = new FormData();
        fd.append("file", videoFile);
        fd.append("type", "course-video");
        fd.append("slug", form.slug);
        const { key } = await uploadWithProgress(fd, (pct) => {
          if (pct < 100) {
            setUploadPercent(pct);
            setUploadProgress(`Envoi de la vidéo… ${pct}%`);
          } else {
            setUploadPercent(null);
            setUploadProgress(isMp4 ? "Upload vers le stockage…" : "Conversion en MP4…");
          }
        });
        videoKey = key;
        setUploadPercent(null);
      }

      setUploadProgress("");

      const payload = {
        title: form.title,
        slug: form.slug,
        description: form.description,
        thumbnail: thumbnailKey,
        videoUrl: videoKey,
        duration: parseInt(form.duration) || 0,
        theme: form.theme,
        price: form.price ? parseFloat(form.price) : null,
        includedInSubscription: form.includedInSubscription,
        isPublished: form.isPublished,
      };

      const url = editingId
        ? `/api/admin/courses/${editingId}`
        : "/api/admin/courses";
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
      setVideoFile(null);
      fetchCourses();
      setToast(editingId ? "Cours modifié avec succès ✓" : "Cours créé avec succès ✓");
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur de connexion"
      );
    } finally {
      setSaving(false);
      setUploadProgress("");
      setUploadPercent(null);
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Supprimer le cours "${title}" ? Cette action est irréversible.`))
      return;

    try {
      const res = await fetch(`/api/admin/courses/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchCourses();
      }
    } catch {
      console.error("Erreur lors de la suppression");
    }
  }

  async function handleTogglePublish(course: Course) {
    try {
      await fetch(`/api/admin/courses/${course.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !course.isPublished }),
      });
      fetchCourses();
    } catch {
      console.error("Erreur lors du changement de statut");
    }
  }

  async function handleToggleSubscription(course: Course) {
    try {
      await fetch(`/api/admin/courses/${course.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          includedInSubscription: !course.includedInSubscription,
        }),
      });
      fetchCourses();
    } catch {
      console.error("Erreur lors du changement");
    }
  }

  // Multi-select handlers
  function toggleSelect(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  function selectAll() {
    if (selected.size === filteredCourses.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredCourses.map((c) => c.id)));
    }
  }

  async function bulkUpdatePrice() {
    if (selected.size === 0) return;
    setBulkSaving(true);

    try {
      const res = await fetch("/api/admin/courses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: Array.from(selected),
          data: {
            price: bulkPrice ? parseFloat(bulkPrice) : null,
          },
        }),
      });

      if (res.ok) {
        setSelected(new Set());
        setShowBulkPrice(false);
        setBulkPrice("");
        fetchCourses();
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

  async function bulkToggleSubscription(value: boolean) {
    if (selected.size === 0) return;
    setBulkSaving(true);

    try {
      const res = await fetch("/api/admin/courses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: Array.from(selected),
          data: { includedInSubscription: value },
        }),
      });

      if (res.ok) {
        setSelected(new Set());
        fetchCourses();
        setToast("Abonnement mis à jour ✓");
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
      const res = await fetch("/api/admin/courses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: Array.from(selected),
          data: { isPublished: value },
        }),
      });

      if (res.ok) {
        setSelected(new Set());
        fetchCourses();
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

  const filteredCourses = courses;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-[100] bg-card border border-border rounded-xl px-4 py-3 shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <span className="text-sm font-medium text-heading">{toast}</span>
          <button onClick={() => setToast(null)} className="text-muted hover:text-heading text-xs cursor-pointer">✕</button>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-heading mb-2">
            Gestion des cours
          </h1>
          <p className="text-muted">
            {courses.length} cours au total
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => { setThemeError(""); setShowThemeModal(true); }}>
            <Tags className="w-4 h-4" />
            Gérer les thèmes
          </Button>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4" />
            Nouveau cours
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-muted absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Rechercher un cours..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-card border border-border text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-button/30"
        />
      </div>

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="bg-accent-light/30 border border-button/20 rounded-xl p-4 flex items-center gap-4 flex-wrap">
          <span className="text-sm font-medium text-heading">
            {selected.size} cours sélectionné{selected.size > 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBulkPrice(true)}
            >
              <DollarSign className="w-4 h-4" />
              Modifier le prix
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => bulkToggleSubscription(true)}
              disabled={bulkSaving}
            >
              Inclure dans abo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => bulkToggleSubscription(false)}
              disabled={bulkSaving}
            >
              Exclure de l&apos;abo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => bulkTogglePublish(true)}
              disabled={bulkSaving}
            >
              <Eye className="w-4 h-4" />
              Publier
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => bulkTogglePublish(false)}
              disabled={bulkSaving}
            >
              <EyeOff className="w-4 h-4" />
              Dépublier
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelected(new Set())}
            >
              <X className="w-4 h-4" />
              Annuler
            </Button>
          </div>
        </div>
      )}

      {/* Bulk price modal */}
      {showBulkPrice && (
        <div className="bg-card border border-border rounded-xl p-4 flex items-end gap-4">
          <div className="flex-1 max-w-xs">
            <Input
              id="bulkPrice"
              label={`Nouveau prix pour ${selected.size} cours`}
              type="number"
              step="0.01"
              min="0"
              value={bulkPrice}
              onChange={(e) => setBulkPrice(e.target.value)}
              placeholder="Ex: 9.99"
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

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-muted">Chargement...</div>
      ) : filteredCourses.length === 0 ? (
        <div className="text-center py-12 text-muted">
          {search ? "Aucun cours trouvé" : "Aucun cours créé"}
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-primary/20">
                  <th className="p-4 w-10">
                    <button
                      onClick={selectAll}
                      className="text-muted hover:text-heading transition-colors cursor-pointer"
                    >
                      {selected.size === filteredCourses.length &&
                      filteredCourses.length > 0 ? (
                        <CheckSquare className="w-5 h-5" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-heading">
                    Cours
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-heading">
                    Thème
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-heading">
                    Durée
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-heading">
                    Prix
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-heading">
                    Abo
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-heading">
                    Statut
                  </th>
                  <th className="text-right p-4 text-sm font-medium text-heading">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredCourses.map((course) => (
                  <tr
                    key={course.id}
                    className={`hover:bg-primary/10 transition-colors ${
                      selected.has(course.id) ? "bg-accent-light/20" : ""
                    }`}
                  >
                    <td className="p-4">
                      <button
                        onClick={() => toggleSelect(course.id)}
                        className="text-muted hover:text-heading transition-colors cursor-pointer"
                      >
                        {selected.has(course.id) ? (
                          <CheckSquare className="w-5 h-5 text-button" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-heading">{course.title}</p>
                      <p className="text-xs text-muted">{course.slug}</p>
                    </td>
                    <td className="p-4">
                      <Badge>{course.theme}</Badge>
                    </td>
                    <td className="p-4 text-sm text-text">
                      {course.duration} min
                    </td>
                    <td className="p-4 text-sm text-text">
                      {course.price ? (
                        `${course.price} €`
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleSubscription(course)}
                        className="cursor-pointer"
                        title={
                          course.includedInSubscription
                            ? "Inclus dans l'abonnement"
                            : "Non inclus dans l'abonnement"
                        }
                      >
                        {course.includedInSubscription ? (
                          <Badge variant="success">Inclus</Badge>
                        ) : (
                          <Badge variant="warning">Exclu</Badge>
                        )}
                      </button>
                    </td>
                    <td className="p-4">
                      {course.isPublished ? (
                        <Badge variant="success">Publié</Badge>
                      ) : (
                        <Badge variant="warning">Brouillon</Badge>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(course)}
                          className="p-2 rounded-lg hover:bg-primary/30 transition-colors cursor-pointer"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4 text-muted" />
                        </button>
                        <button
                          onClick={() => handleDelete(course.id, course.title)}
                          className="p-2 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Gestion des thèmes */}
      <Modal
        isOpen={showThemeModal}
        onClose={() => setShowThemeModal(false)}
        title="Gérer les thèmes"
      >
        <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
          {themeError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {themeError}
            </div>
          )}

          {/* Liste des thèmes */}
          <div className="space-y-2">
            {themes.length === 0 ? (
              <p className="text-sm text-muted text-center py-4">Aucun thème créé</p>
            ) : (
              themes.map((t) => (
                <div
                  key={t.name}
                  className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-border"
                >
                  {editingTheme === t.name ? (
                    <>
                      <input
                        type="text"
                        value={editingThemeName}
                        onChange={(e) => setEditingThemeName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRenameTheme(t.name, editingThemeName);
                          if (e.key === "Escape") setEditingTheme(null);
                        }}
                        autoFocus
                        className="flex-1 px-3 py-1.5 rounded-lg bg-card border border-border text-text text-sm focus:outline-none focus:ring-2 focus:ring-button/30"
                      />
                      <button
                        onClick={() => handleRenameTheme(t.name, editingThemeName)}
                        disabled={themeSaving}
                        className="text-xs font-medium text-button hover:text-button/80 transition-colors disabled:opacity-50"
                      >
                        Sauvegarder
                      </button>
                      <button
                        onClick={() => setEditingTheme(null)}
                        className="text-xs text-muted hover:text-text transition-colors"
                      >
                        Annuler
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm font-medium text-heading">{t.name}</span>
                      <span className="text-xs text-muted">{t.courseCount} cours</span>
                      <button
                        onClick={() => { setEditingTheme(t.name); setEditingThemeName(t.name); setThemeError(""); }}
                        className="p-1.5 rounded-lg hover:bg-primary/30 transition-colors cursor-pointer"
                        title="Renommer"
                      >
                        <Pencil className="w-3.5 h-3.5 text-muted" />
                      </button>
                      <button
                        onClick={() => { setThemeError(""); handleDeleteTheme(t.name); }}
                        disabled={t.courseCount > 0 || themeSaving}
                        className="p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        title={t.courseCount > 0 ? `Utilisé par ${t.courseCount} cours` : "Supprimer"}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Ajouter un thème */}
          <div className="border-t border-border pt-4">
            <p className="text-sm font-medium text-heading mb-2">Ajouter un thème</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newThemeName}
                onChange={(e) => setNewThemeName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddTheme(); } }}
                placeholder="Nom du thème..."
                className="flex-1 px-3 py-2 rounded-xl bg-card border border-border text-text text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-button/30"
              />
              <Button onClick={handleAddTheme} disabled={themeSaving || !newThemeName.trim()} size="sm">
                <Plus className="w-4 h-4" />
                Ajouter
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal Création / Édition */}
      <Modal
        isOpen={showModal}
        onClose={() => { if (!saving) setShowModal(false); }}
        title={editingId ? "Modifier le cours" : "Nouveau cours"}
        size="lg"
      >
        <div className="max-h-[75vh] overflow-y-auto px-1 -mx-1">
        <form id="course-form" onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Titre */}
            <div>
              <label className="block text-sm font-medium text-text mb-1">Titre</label>
              <Input
                value={form.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setForm({ ...form, title, slug: generateSlug(title) });
                }}
                placeholder="Nom du cours"
                required
              />
            </div>

            {/* Thème + Prix */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-heading">Thème</label>
                <select
                  value={form.theme}
                  onChange={(e) => setForm({ ...form, theme: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-card border border-border text-text focus:outline-none focus:ring-2 focus:ring-button/30"
                >
                  {themes.length > 0 ? (
                    themes.map((t) => (
                      <option key={t.name} value={t.name}>{t.name}</option>
                    ))
                  ) : (
                    <option value={form.theme}>{form.theme}</option>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1">Prix location 72h (€)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="10"
                />
              </div>
            </div>

            {/* Miniature + Vidéo — Option C */}
            <div className="grid grid-cols-2 gap-4">

              {/* Card Miniature */}
              <div className="rounded-xl border border-border overflow-hidden bg-card">
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-heading">Miniature</span>
                    <span className="text-xs text-muted">(optionnelle)</span>
                  </div>
                  {(form.thumbnail || thumbnailFile) ? (
                    <span className="text-xs text-green-600 font-medium">✓ {thumbnailFile ? "Nouveau" : "Actuelle"}</span>
                  ) : (
                    <span className="text-xs text-muted">Vide</span>
                  )}
                </div>

                {/* Preview */}
                <label className="block w-full aspect-video cursor-pointer">
                  {thumbnailFile ? (
                    <img
                      src={URL.createObjectURL(thumbnailFile)}
                      alt="Nouvelle miniature"
                      className="w-full h-full object-cover"
                    />
                  ) : form.thumbnail && thumbnailPreviewUrl ? (
                    <img
                      src={thumbnailPreviewUrl}
                      alt="Miniature actuelle"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary/10 flex flex-col items-center justify-center gap-2 hover:bg-primary/20 transition-colors">
                      <ImageIcon className="w-6 h-6 text-muted/50" />
                      <span className="text-xs text-muted">Choisir une image</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) setThumbnailFile(e.target.files[0]);
                    }}
                  />
                </label>

                {/* Footer actions */}
                <div className="flex items-center gap-2 px-3 py-2 border-t border-border bg-card">
                  <label className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-text py-1.5 rounded-lg border border-border bg-primary/10 hover:bg-primary/20 transition-colors cursor-pointer">
                    <Upload className="w-3 h-3" />
                    {thumbnailFile ? "Changer" : form.thumbnail ? "Remplacer" : "Ajouter"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) setThumbnailFile(e.target.files[0]);
                      }}
                    />
                  </label>
                  {(form.thumbnail || thumbnailFile) && (
                    <button
                      type="button"
                      onClick={() => {
                        setThumbnailFile(null);
                        setThumbnailPreviewUrl(null);
                        setForm({ ...form, thumbnail: "" });
                      }}
                      className="flex items-center justify-center p-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 transition-colors text-red-400 hover:text-red-600"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {!form.thumbnail && !thumbnailFile && (
                  <p className="text-xs text-muted px-3 pt-2 pb-1">
                    Sans miniature, la 1ère frame de la vidéo sera utilisée.
                  </p>
                )}
              </div>

              {/* Card Vidéo */}
              <div className="rounded-xl border border-border overflow-hidden bg-card">
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                  <span className="text-xs font-semibold text-heading">Vidéo</span>
                  {(form.videoUrl || videoFile) ? (
                    <span className="text-xs text-green-600 font-medium">
                      ✓ {videoFile ? "Nouveau" : "Actuelle"}{form.duration ? ` · ${form.duration} min` : ""}
                    </span>
                  ) : (
                    <span className="text-xs text-muted">Vide</span>
                  )}
                </div>

                {/* Preview */}
                <label className="block w-full aspect-video cursor-pointer">
                  {videoFile ? (
                    <div className="w-full h-full bg-heading/90 flex flex-col items-center justify-center gap-2 px-4">
                      <Film className="w-6 h-6 text-white/60" />
                      <span className="text-xs text-white/70 text-center truncate w-full">{videoFile.name}</span>
                      {form.duration && (
                        <span className="text-xs font-semibold text-white bg-white/10 px-3 py-0.5 rounded-full">{form.duration} min</span>
                      )}
                    </div>
                  ) : form.videoUrl ? (
                    <div className="w-full h-full bg-heading/90 flex flex-col items-center justify-center gap-2 px-4">
                      <Film className="w-6 h-6 text-white/60" />
                      <span className="text-xs text-white/50">Vidéo enregistrée</span>
                      {form.duration && (
                        <span className="text-xs font-semibold text-white bg-white/10 px-3 py-0.5 rounded-full">{form.duration} min</span>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-full bg-primary/10 flex flex-col items-center justify-center gap-2 hover:bg-primary/20 transition-colors">
                      <Film className="w-6 h-6 text-muted/50" />
                      <span className="text-xs text-muted">Choisir une vidéo</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="video/mp4,video/quicktime,video/webm,video/x-msvideo,video/avi,video/x-matroska,.mp4,.mov,.webm,.avi,.mkv,.m4v"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setVideoFile(file);
                        extractVideoMetadata(file).then(({ thumbnail, durationMin }) => {
                          if (thumbnail && !thumbnailFile && !form.thumbnail) {
                            setThumbnailFile(thumbnail);
                          }
                          if (durationMin > 0) {
                            setForm((prev) => ({ ...prev, duration: String(durationMin) }));
                          }
                        });
                      }
                    }}
                  />
                </label>

                {/* Footer actions */}
                <div className="flex items-center gap-2 px-3 py-2 border-t border-border bg-card">
                  <label className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-text py-1.5 rounded-lg border border-border bg-primary/10 hover:bg-primary/20 transition-colors cursor-pointer">
                    <Upload className="w-3 h-3" />
                    {videoFile ? "Changer" : form.videoUrl ? "Remplacer" : "Ajouter"}
                    <input
                      type="file"
                      accept="video/mp4,video/quicktime,video/webm,video/x-msvideo,video/avi,video/x-matroska,.mp4,.mov,.webm,.avi,.mkv,.m4v"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setVideoFile(file);
                          extractVideoMetadata(file).then(({ thumbnail, durationMin }) => {
                            if (thumbnail && !thumbnailFile && !form.thumbnail) {
                              setThumbnailFile(thumbnail);
                            }
                            if (durationMin > 0) {
                              setForm((prev) => ({ ...prev, duration: String(durationMin) }));
                            }
                          });
                        }
                      }}
                    />
                  </label>
                  {(form.videoUrl || videoFile) && (
                    <button
                      type="button"
                      onClick={() => {
                        setVideoFile(null);
                        setForm({ ...form, videoUrl: "", duration: "" });
                      }}
                      className="flex items-center justify-center p-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 transition-colors text-red-400 hover:text-red-600"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-text mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2.5 rounded-xl bg-card border border-border text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-button/30 resize-y"
                placeholder="Description du cours..."
                required
              />
            </div>

            {/* Checkboxes */}
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-text cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.includedInSubscription}
                  onChange={(e) => setForm({ ...form, includedInSubscription: e.target.checked })}
                  className="w-4 h-4 rounded accent-button"
                />
                Inclus dans l&apos;abonnement
              </label>
              <label className="flex items-center gap-2 text-sm text-text cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                  className="w-4 h-4 rounded accent-button"
                />
                Publié
              </label>
            </div>
          </div>

        </form>
        </div>

        {/* Bandeau "ne pas quitter" pendant upload/conversion */}
        {saving && (
          <div className="mt-3 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700 font-medium text-center">
            ⚠️ Traitement en cours — veuillez ne pas fermer cette fenêtre
          </div>
        )}

        {/* Footer hors du scroll */}
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
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowModal(false)}
            disabled={saving}
          >
            Annuler
          </Button>
          <Button type="submit" form="course-form" disabled={saving}>
            {saving
              ? "Traitement…"
              : editingId
              ? "Mettre à jour"
              : "Créer le cours"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
