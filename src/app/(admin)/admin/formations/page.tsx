"use client";

import { useState } from "react";
import { Plus, Search, Edit, Trash2, BookOpen } from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

const demoFormations = [
  { id: "1", title: "Programme Débutant Complet", slug: "programme-debutant-complet", courseCount: 12, price: 39.99, isPublished: true },
  { id: "2", title: "30 Jours de Yoga", slug: "30-jours-de-yoga", courseCount: 30, price: null, isPublished: true },
  { id: "3", title: "Souplesse & Mobilité", slug: "souplesse-et-mobilite", courseCount: 8, price: 29.99, isPublished: false },
  { id: "4", title: "Méditation & Pranayama", slug: "meditation-et-pranayama", courseCount: 10, price: null, isPublished: true },
];

export default function AdminFormationsPage() {
  const [search, setSearch] = useState("");

  const filtered = demoFormations.filter((f) =>
    f.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-heading mb-2">
            Gestion des formations
          </h1>
          <p className="text-muted">{demoFormations.length} formations au total</p>
        </div>
        <Button>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((formation) => (
          <div
            key={formation.id}
            className="bg-card rounded-2xl border border-border p-6 space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
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

            <div className="flex items-center gap-6 text-sm text-muted">
              <span>{formation.courseCount} cours</span>
              <span>
                {formation.price ? `${formation.price} €` : "Inclus dans l'abo"}
              </span>
            </div>

            <div className="flex gap-2 pt-2 border-t border-border">
              <Button variant="ghost" size="sm">
                <Edit className="w-4 h-4" />
                Modifier
              </Button>
              <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50">
                <Trash2 className="w-4 h-4" />
                Supprimer
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
