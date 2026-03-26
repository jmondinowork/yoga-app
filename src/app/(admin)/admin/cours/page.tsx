"use client";

import { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail: string | null;
  videoUrl: string | null;
  duration: number;
  level: string;
  theme: string;
  price: number | null;
  includedInSubscription: boolean;
  isPublished: boolean;
  sortOrder: number;
  _count: { purchases: number; progress: number };
}

const levelLabels: Record<string, string> = {
  BEGINNER: "Débutant",
  INTERMEDIATE: "Intermédiaire",
  ADVANCED: "Avancé",
};

const emptyForm = {
  title: "",
  slug: "",
  description: "",
  thumbnail: "",
  videoUrl: "",
  duration: "",
  level: "BEGINNER",
  theme: "Vinyasa",
  price: "",
  includedInSubscription: true,
  isPublished: false,
};

export default function AdminCoursPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Multi-select
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showBulkPrice, setShowBulkPrice] = useState(false);
  const [bulkPrice, setBulkPrice] = useState("");
  const [bulkSaving, setBulkSaving] = useState(false);

  // File uploads
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState("");

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/courses?limit=100&search=${encodeURIComponent(search)}`
      );
      const data = await res.json();
      setCourses(data.courses || []);
    } catch {
      console.error("Erreur lors du chargement des cours");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

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
    setVideoFile(null);
    setUploadProgress("");
    setShowModal(true);
  }

  function openEdit(course: Course) {
    setEditingId(course.id);
    setForm({
      title: course.title,
      slug: course.slug,
      description: course.description,
      thumbnail: course.thumbnail || "",
      videoUrl: course.videoUrl || "",
      duration: course.duration.toString(),
      level: course.level,
      theme: course.theme,
      price: course.price?.toString() || "",
      includedInSubscription: course.includedInSubscription,
      isPublished: course.isPublished,
    });
    setError("");
    setThumbnailFile(null);
    setVideoFile(null);
    setUploadProgress("");
    setShowModal(true);
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
        setUploadProgress("Upload de la miniature...");
        const fd = new FormData();
        fd.append("file", thumbnailFile);
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
        setUploadProgress("Upload de la vidéo...");
        const fd = new FormData();
        fd.append("file", videoFile);
        fd.append("type", "course-video");
        fd.append("slug", form.slug);
        const uploadRes = await fetch("/api/admin/upload", {
          method: "POST",
          body: fd,
        });
        if (!uploadRes.ok) {
          const data = await uploadRes.json();
          throw new Error(data.error || "Erreur upload vidéo");
        }
        const { key } = await uploadRes.json();
        videoKey = key;
      }

      setUploadProgress("");

      const payload = {
        title: form.title,
        slug: form.slug,
        description: form.description,
        thumbnail: thumbnailKey,
        videoUrl: videoKey,
        duration: parseInt(form.duration) || 0,
        level: form.level,
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
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur de connexion"
      );
    } finally {
      setSaving(false);
      setUploadProgress("");
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
      }
    } catch {
      console.error("Erreur lors de la mise à jour en lot");
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
      }
    } catch {
      console.error("Erreur lors de la mise à jour en lot");
    } finally {
      setBulkSaving(false);
    }
  }

  const filteredCourses = courses;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-heading mb-2">
            Gestion des cours
          </h1>
          <p className="text-muted">
            {courses.length} cours au total
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Nouveau cours
        </Button>
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
                    Niveau
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
                      <p className="text-xs text-muted">
                        {course.slug} · {course._count.purchases} achat
                        {course._count.purchases > 1 ? "s" : ""}
                      </p>
                    </td>
                    <td className="p-4">
                      <Badge>{course.theme}</Badge>
                    </td>
                    <td className="p-4 text-sm text-text">
                      {levelLabels[course.level] || course.level}
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
                          onClick={() => handleTogglePublish(course)}
                          className="p-2 rounded-lg hover:bg-primary/30 transition-colors cursor-pointer"
                          title={
                            course.isPublished ? "Dépublier" : "Publier"
                          }
                        >
                          {course.isPublished ? (
                            <EyeOff className="w-4 h-4 text-muted" />
                          ) : (
                            <Eye className="w-4 h-4 text-muted" />
                          )}
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

      {/* Modal Création / Édition */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? "Modifier le cours" : "Nouveau cours"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
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
                placeholder="Nom du cours"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1">Slug</label>
              <Input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="nom-du-cours"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-heading">
                  Thème
                </label>
                <select
                  value={form.theme}
                  onChange={(e) => setForm({ ...form, theme: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-card border border-border text-text focus:outline-none focus:ring-2 focus:ring-button/30"
                >
                  <option>Vinyasa</option>
                  <option>Hatha</option>
                  <option>Yin Yoga</option>
                  <option>Yin</option>
                  <option>Méditation</option>
                  <option>Power Yoga</option>
                  <option>Restauratif</option>
                  <option>Respiration</option>
                  <option>Pranayama</option>
                  <option>Prénatal</option>
                  <option>Ashtanga</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-heading">
                  Niveau
                </label>
                <select
                  value={form.level}
                  onChange={(e) => setForm({ ...form, level: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-card border border-border text-text focus:outline-none focus:ring-2 focus:ring-button/30"
                >
                  <option value="BEGINNER">Débutant</option>
                  <option value="INTERMEDIATE">Intermédiaire</option>
                  <option value="ADVANCED">Avancé</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1">
                  Durée (min)
                </label>
                <Input
                  type="number"
                  min="1"
                  value={form.duration}
                  onChange={(e) =>
                    setForm({ ...form, duration: e.target.value })
                  }
                  placeholder="30"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1">
                  Prix (€)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) =>
                    setForm({ ...form, price: e.target.value })
                  }
                  placeholder="9.99"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1">
                  Miniature
                </label>
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
              <div>
                <label className="block text-sm font-medium text-text mb-1">
                  Vidéo (MP4)
                </label>
                {form.videoUrl && !videoFile && (
                  <div className="mb-2 flex items-center gap-2 text-xs">
                    <Film className="w-3.5 h-3.5 text-green-600" />
                    <span className="text-green-600 font-medium">Vidéo actuelle</span>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, videoUrl: "" })}
                      className="text-red-400 hover:text-red-600 ml-auto"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                {videoFile && (
                  <div className="mb-2 flex items-center gap-2 text-xs">
                    <Film className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-blue-600 truncate">
                      {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(1)} Mo)
                    </span>
                    <button
                      type="button"
                      onClick={() => setVideoFile(null)}
                      className="text-red-400 hover:text-red-600 ml-auto"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-border bg-primary/10 hover:bg-primary/20 transition-colors cursor-pointer text-sm text-muted">
                  <Upload className="w-4 h-4" />
                  {videoFile ? "Changer" : form.videoUrl ? "Remplacer" : "Choisir un fichier MP4"}
                  <input
                    type="file"
                    accept="video/mp4"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.type !== "video/mp4") {
                          setError("Seul le format MP4 est accepté pour les vidéos");
                          return;
                        }
                        setVideoFile(file);
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={4}
                className="w-full px-4 py-2.5 rounded-xl bg-card border border-border text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-button/30 resize-y"
                placeholder="Description du cours..."
                required
              />
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-text cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.includedInSubscription}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      includedInSubscription: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded accent-button"
                />
                Inclus dans l&apos;abonnement
              </label>
              <label className="flex items-center gap-2 text-sm text-text cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) =>
                    setForm({ ...form, isPublished: e.target.checked })
                  }
                  className="w-4 h-4 rounded accent-button"
                />
                Publié
              </label>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-border">
            {uploadProgress && (
              <span className="text-sm text-button animate-pulse mr-auto">
                {uploadProgress}
              </span>
            )}
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowModal(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={saving}>
              {saving
                ? uploadProgress || "Enregistrement..."
                : editingId
                ? "Mettre à jour"
                : "Créer le cours"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
