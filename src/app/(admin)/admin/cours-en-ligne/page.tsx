"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import {
  Plus,
  Search,
  Trash2,
  Eye,
  EyeOff,
  X,
  Repeat,
  Users,
  Clock,
  Video,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";

interface LiveEvent {
  id: string;
  title: string;
  description: string;
  meetingLink: string;
  startTime: string;
  duration: number;
  recurrence: "NONE" | "DAILY" | "WEEKLY" | "MONTHLY";
  recurrenceEnd: string | null;
  maxParticipants: number;
  isPublished: boolean;
  theme: string;
  _count: { registrations: number };
}

type Recurrence = "NONE" | "DAILY" | "WEEKLY" | "MONTHLY";

const emptyForm = {
  title: "",
  description: "",
  meetingLink: "",
  startTime: "",
  duration: "60",
  recurrence: "NONE" as Recurrence,
  recurrenceEnd: "",
  maxParticipants: "20",
  theme: "Général",
  isPublished: false,
};

const RECURRENCE_LABELS: Record<string, string> = {
  NONE: "Unique",
  DAILY: "Tous les jours",
  WEEKLY: "Toutes les semaines",
  MONTHLY: "Tous les mois",
};

export default function AdminCalendrierPage() {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const fetcher = (url: string) => fetch(url).then(r => r.json());
  const { data: eventsData, isLoading: loading, mutate: mutateEvents } = useSWR(
    `/api/admin/events?limit=100&search=${encodeURIComponent(search)}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30_000 }
  );
  const events: LiveEvent[] = eventsData?.events || [];
  const fetchEvents = useCallback(() => mutateEvents(), [mutateEvents]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setShowModal(true);
  }

  function openEdit(event: LiveEvent) {
    setEditingId(event.id);
    const dt = new Date(event.startTime);
    const localIso = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setForm({
      title: event.title,
      description: event.description,
      meetingLink: event.meetingLink,
      startTime: localIso,
      duration: event.duration.toString(),
      recurrence: event.recurrence,
      recurrenceEnd: event.recurrenceEnd
        ? new Date(new Date(event.recurrenceEnd).getTime() - new Date(event.recurrenceEnd).getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16)
        : "",
      maxParticipants: event.maxParticipants.toString(),
      theme: event.theme,
      isPublished: event.isPublished,
    });
    setError("");
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        title: form.title,
        description: form.description,
        meetingLink: form.meetingLink,
        startTime: new Date(form.startTime).toISOString(),
        duration: parseInt(form.duration),
        recurrence: form.recurrence,
        recurrenceEnd:
          form.recurrence !== "NONE" && form.recurrenceEnd
            ? new Date(form.recurrenceEnd).toISOString()
            : null,
        maxParticipants: parseInt(form.maxParticipants),
        theme: form.theme,
        isPublished: form.isPublished,
      };

      const url = editingId
        ? `/api/admin/events/${editingId}`
        : "/api/admin/events";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details && Array.isArray(data.details)) {
          const messages = data.details.map((d: { message: string; path?: string[] }) =>
            d.path?.length ? `${d.path.join(".")}: ${d.message}` : d.message
          );
          setError(messages.join("\n"));
        } else {
          setError(data.error || "Erreur lors de la sauvegarde");
        }
        return;
      }

      setShowModal(false);
      fetchEvents();
      setToast(editingId ? "Événement modifié" : "Événement créé");
      setTimeout(() => setToast(null), 3000);
    } catch {
      setError("Erreur de connexion");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cet événement ? Cette action est irréversible.")) return;

    try {
      const res = await fetch(`/api/admin/events/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchEvents();
        setToast("Événement supprimé");
        setTimeout(() => setToast(null), 3000);
      }
    } catch {
      console.error("Erreur lors de la suppression");
    }
  }

  async function togglePublish(event: LiveEvent) {
    try {
      await fetch(`/api/admin/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !event.isPublished }),
      });
      fetchEvents();
    } catch {
      console.error("Erreur lors du changement de statut");
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-heading">
            Calendrier des cours en ligne
          </h1>
          <p className="text-muted mt-1">
            Gérez vos cours en direct
          </p>
        </div>
        <Button onClick={openCreate} className="self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          Nouvel événement
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un événement..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-text text-sm focus:outline-none focus:ring-2 focus:ring-button"
        />
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-button text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium">
          {toast}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-muted">Chargement...</div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 text-muted">
          Aucun événement trouvé
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-primary/20">
                  <th className="text-left px-4 py-3 font-medium text-heading">
                    Événement
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-heading">
                    Date / Heure
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-heading hidden sm:table-cell">
                    Récurrence
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-heading hidden sm:table-cell">
                    Inscrits
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-heading">
                    Statut
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-heading">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr
                    key={event.id}
                    className="border-b border-border last:border-0 hover:bg-primary/10 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => openEdit(event)}
                        className="text-left cursor-pointer hover:text-button transition-colors"
                      >
                        <p className="font-medium text-heading">
                          {event.title}
                        </p>
                        <p className="text-xs text-muted">{event.theme}</p>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-text">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-muted" />
                        {formatDate(event.startTime)}
                      </div>
                      <p className="text-xs text-muted mt-0.5">
                        {event.duration} min
                      </p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="flex items-center gap-1.5">
                        {event.recurrence !== "NONE" && (
                          <Repeat className="w-3.5 h-3.5 text-button" />
                        )}
                        <span className="text-text">
                          {RECURRENCE_LABELS[event.recurrence]}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      <div className="flex items-center justify-center gap-1">
                        <Users className="w-3.5 h-3.5 text-muted" />
                        <span className="text-text">
                          {event._count.registrations}/{event.maxParticipants}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => togglePublish(event)}
                        className="cursor-pointer"
                      >
                        <Badge
                          variant={event.isPublished ? "success" : "default"}
                        >
                          {event.isPublished ? "Publié" : "Brouillon"}
                        </Badge>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => togglePublish(event)}
                          className="p-2 rounded-lg hover:bg-primary/30 transition-colors cursor-pointer"
                          title={
                            event.isPublished ? "Dépublier" : "Publier"
                          }
                        >
                          {event.isPublished ? (
                            <EyeOff className="w-4 h-4 text-muted" />
                          ) : (
                            <Eye className="w-4 h-4 text-muted" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(event.id)}
                          className="p-2 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
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

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? "Modifier l'événement" : "Nouvel événement"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-2 rounded-xl text-sm whitespace-pre-line">
              {error}
            </div>
          )}

          <Input
            id="title"
            label="Titre"
            value={form.title}
            onChange={(e) => {
              const title = e.target.value;
              setForm((f) => ({
                ...f,
                title,
              }));
            }}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-heading">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-text text-sm focus:outline-none focus:ring-2 focus:ring-button resize-none"
              required
            />
          </div>

          <Input
            id="meetingLink"
            label="Lien de visioconférence"
            type="url"
            placeholder="https://zoom.us/j/... ou https://meet.google.com/..."
            value={form.meetingLink}
            onChange={(e) =>
              setForm((f) => ({ ...f, meetingLink: e.target.value }))
            }
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-heading">
                Date & Heure
              </label>
              <input
                type="datetime-local"
                value={form.startTime}
                onChange={(e) =>
                  setForm((f) => ({ ...f, startTime: e.target.value }))
                }
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-text text-sm focus:outline-none focus:ring-2 focus:ring-button"
                required
              />
            </div>
            <Input
              id="duration"
              label="Durée (min)"
              type="number"
              value={form.duration}
              onChange={(e) =>
                setForm((f) => ({ ...f, duration: e.target.value }))
              }
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-heading">
                Récurrence
              </label>
              <select
                value={form.recurrence}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    recurrence: e.target.value as Recurrence,
                  }))
                }
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-text text-sm focus:outline-none focus:ring-2 focus:ring-button"
              >
                <option value="NONE">Unique</option>
                <option value="DAILY">Tous les jours</option>
                <option value="WEEKLY">Toutes les semaines</option>
                <option value="MONTHLY">Tous les mois</option>
              </select>
            </div>
            <Input
              id="maxParticipants"
              label="Places max"
              type="number"
              value={form.maxParticipants}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  maxParticipants: e.target.value,
                }))
              }
              required
            />
          </div>

          {form.recurrence !== "NONE" && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-heading">
                Fin de récurrence (optionnel)
              </label>
              <input
                type="datetime-local"
                value={form.recurrenceEnd}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    recurrenceEnd: e.target.value,
                  }))
                }
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-text text-sm focus:outline-none focus:ring-2 focus:ring-button"
              />
            </div>
          )}

          <Input
            id="theme"
            label="Thème"
            value={form.theme}
            onChange={(e) =>
              setForm((f) => ({ ...f, theme: e.target.value }))
            }
            required
          />

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) =>
                setForm((f) => ({ ...f, isPublished: e.target.checked }))
              }
              className="w-4 h-4 rounded border-border text-button focus:ring-button"
            />
            <span className="text-sm text-text">
              Publier immédiatement
            </span>
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowModal(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={saving}>
              {saving
                ? "Enregistrement..."
                : editingId
                ? "Modifier"
                : "Créer"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
