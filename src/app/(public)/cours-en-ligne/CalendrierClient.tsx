"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  Video,
  X,
  CalendarDays,
  Loader2,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

interface EventOccurrence {
  eventId: string;
  title: string;
  slug: string;
  description: string;
  date: string;
  duration: number;
  theme: string;
  maxParticipants: number;
  registrationCount: number;
  spotsLeft: number;
  isRegistered: boolean;
  isCancelled: boolean;
}

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Monday = 0 in our grid
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const days: { date: Date; isCurrentMonth: boolean }[] = [];

  // Previous month padding
  for (let i = startDow - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    days.push({ date: d, isCurrentMonth: false });
  }

  // Current month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push({ date: new Date(year, month, d), isCurrentMonth: true });
  }

  // Next month padding
  const remaining = 7 - (days.length % 7);
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }
  }

  return days;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function CalendrierClient() {
  const { data: session } = useSession();
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [events, setEvents] = useState<EventOccurrence[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [registering, setRegistering] = useState<string | null>(null);
  const [meetingLinks, setMeetingLinks] = useState<Record<string, string | null>>({});

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/events?month=${monthStr}`);
      const data = await res.json();
      setEvents(data.events || []);
    } catch {
      console.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [monthStr]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDate(null);
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDate(null);
  }

  const days = getMonthDays(year, month);
  const today = new Date();

  // Events per day
  function getEventsForDay(date: Date) {
    return events.filter((e) => isSameDay(new Date(e.date), date));
  }

  const selectedEvents = selectedDate ? getEventsForDay(selectedDate) : [];

  async function handleRegister(eventId: string, date: string) {
    if (!session?.user) return;
    setRegistering(eventId + date);
    try {
      const res = await fetch(`/api/events/${eventId}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ occurrenceDate: date }),
      });
      if (res.ok) {
        fetchEvents();
      } else {
        const data = await res.json();
        alert(data.error || "Erreur lors de l'inscription");
      }
    } catch {
      alert("Erreur de connexion");
    } finally {
      setRegistering(null);
    }
  }

  async function handleCancel(eventId: string, date: string) {
    if (!confirm("Annuler votre inscription ?")) return;
    setRegistering(eventId + date);
    try {
      const res = await fetch(`/api/events/${eventId}/register`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ occurrenceDate: date }),
      });
      if (res.ok) {
        fetchEvents();
        setMeetingLinks((prev) => {
          const next = { ...prev };
          delete next[eventId + date];
          return next;
        });
      } else {
        const data = await res.json();
        alert(data.error || "Erreur lors de l'annulation");
      }
    } catch {
      alert("Erreur de connexion");
    } finally {
      setRegistering(null);
    }
  }

  async function fetchMeetingLink(eventId: string, date: string) {
    const key = eventId + date;
    if (meetingLinks[key] !== undefined) return;
    try {
      const res = await fetch(
        `/api/events/${eventId}?date=${encodeURIComponent(date)}`
      );
      const data = await res.json();
      setMeetingLinks((prev) => ({ ...prev, [key]: data.meetingLink || null }));
    } catch {
      // ignore
    }
  }

  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="grid lg:grid-cols-[1fr_380px] gap-8">
      {/* Calendar Grid */}
      <div className="bg-card rounded-2xl border border-border p-6">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={prevMonth}
            className="p-2 rounded-xl hover:bg-primary/30 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 text-heading" />
          </button>
          <h2 className="font-heading text-xl font-bold text-heading">
            {MONTHS[month]} {year}
          </h2>
          <button
            type="button"
            onClick={nextMonth}
            className="p-2 rounded-xl hover:bg-primary/30 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-5 h-5 text-heading" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAYS.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-muted py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map(({ date, isCurrentMonth }, i) => {
            const dayEvents = getEventsForDay(date);
            const isToday = isSameDay(date, today);
            const isSelected = selectedDate && isSameDay(date, selectedDate);
            const hasEvents = dayEvents.length > 0;

            return (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedDate(date)}
                className={`relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm transition-all cursor-pointer ${
                  !isCurrentMonth
                    ? "text-muted/40"
                    : isSelected
                    ? "bg-button text-white font-bold"
                    : isToday
                    ? "bg-primary/50 text-heading font-bold"
                    : "text-text hover:bg-primary/20"
                }`}
              >
                <span>{date.getDate()}</span>
                {hasEvents && (
                  <div className="flex gap-0.5 mt-0.5">
                    {dayEvents.slice(0, 3).map((_, j) => (
                      <div
                        key={j}
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSelected ? "bg-white" : "bg-button"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 mt-4 text-muted text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Chargement...
          </div>
        )}
      </div>

      {/* Side panel — Day detail */}
      <div className="bg-card rounded-2xl border border-border p-6">
        {selectedDate ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-lg font-bold text-heading">
                {selectedDate.toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedDate(null)}
                className="p-1.5 rounded-lg hover:bg-primary/30 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 text-muted" />
              </button>
            </div>

            {selectedEvents.length === 0 ? (
              <p className="text-muted text-sm py-8 text-center">
                Aucun cours prévu ce jour
              </p>
            ) : (
              <div className="space-y-3">
                {selectedEvents.map((event) => {
                  const isPast = new Date(event.date) < new Date();
                  const isLoadingThis =
                    registering === event.eventId + event.date;
                  const zoomKey = event.eventId + event.date;

                  // Fetch meeting link if registered
                  if (event.isRegistered && !isPast) {
                    fetchMeetingLink(event.eventId, event.date);
                  }

                  return (
                    <div
                      key={event.eventId + event.date}
                      className="border border-border rounded-xl p-4 space-y-3"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-heading font-semibold text-heading">
                            {event.title}
                          </h4>
                          <Badge variant="default">{event.theme}</Badge>
                        </div>
                        <p className="text-xs text-muted mt-1 line-clamp-2">
                          {event.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatTime(event.date)} · {event.duration} min
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {event.spotsLeft} place
                          {event.spotsLeft > 1 ? "s" : ""} restante
                          {event.spotsLeft > 1 ? "s" : ""}
                        </span>
                      </div>

                      {/* Zoom link */}
                      {event.isRegistered &&
                        meetingLinks[zoomKey] && (
                          <a
                            href={meetingLinks[zoomKey]!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 bg-button/10 text-button px-3 py-2 rounded-lg text-sm font-medium hover:bg-button/20 transition-colors"
                          >
                            <Video className="w-4 h-4" />
                            Rejoindre le cours
                          </a>
                        )}

                      {/* Actions */}
                      {isPast ? (
                        <Badge variant="default">Terminé</Badge>
                      ) : event.isRegistered ? (
                        <div className="flex items-center gap-2">
                          <Badge variant="success">Inscrit(e)</Badge>
                          <button
                            type="button"
                            onClick={() =>
                              handleCancel(event.eventId, event.date)
                            }
                            disabled={isLoadingThis}
                            className="text-xs text-red-500 hover:text-red-700 underline cursor-pointer disabled:opacity-50"
                          >
                            {isLoadingThis ? "..." : "Annuler"}
                          </button>
                        </div>
                      ) : session?.user ? (
                        <Button
                          size="sm"
                          onClick={() =>
                            handleRegister(event.eventId, event.date)
                          }
                          disabled={
                            isLoadingThis || event.spotsLeft <= 0
                          }
                        >
                          {isLoadingThis ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : event.spotsLeft <= 0 ? (
                            "Complet"
                          ) : (
                            "S'inscrire"
                          )}
                        </Button>
                      ) : (
                        <Link href={`/connexion?callbackUrl=/cours-en-ligne`}>
                          <Button size="sm" variant="outline">
                            Se connecter pour s&apos;inscrire
                          </Button>
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
            <CalendarDays className="w-10 h-10 text-muted/50" />
            <p className="text-muted text-sm">
              Sélectionnez un jour pour voir les cours disponibles
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
