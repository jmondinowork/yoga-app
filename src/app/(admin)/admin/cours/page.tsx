"use client";

import { useState } from "react";
import { Plus, Search, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";

// Données de démo
const demoCourses = [
  { id: "1", title: "Salutation au Soleil", slug: "salutation-au-soleil", theme: "Vinyasa", level: "BEGINNER", duration: 20, price: null, isFree: true, isPublished: true },
  { id: "2", title: "Yin Yoga — Relaxation profonde", slug: "yin-yoga-relaxation", theme: "Yin Yoga", level: "BEGINNER", duration: 45, price: 9.99, isFree: false, isPublished: true },
  { id: "3", title: "Vinyasa Flow — Énergie & Force", slug: "vinyasa-flow-intermediaire", theme: "Vinyasa", level: "INTERMEDIATE", duration: 35, price: null, isFree: false, isPublished: true },
  { id: "4", title: "Méditation guidée — Gestion du stress", slug: "meditation-guidee-stress", theme: "Méditation", level: "BEGINNER", duration: 15, price: null, isFree: true, isPublished: true },
  { id: "5", title: "Hatha Yoga — Équilibre & Souplesse", slug: "hatha-yoga-equilibre", theme: "Hatha", level: "INTERMEDIATE", duration: 40, price: 12.99, isFree: false, isPublished: false },
];

const levelLabels: Record<string, string> = {
  BEGINNER: "Débutant",
  INTERMEDIATE: "Intermédiaire",
  ADVANCED: "Avancé",
};

export default function AdminCoursPage() {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const filteredCourses = demoCourses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-heading mb-2">
            Gestion des cours
          </h1>
          <p className="text-muted">{demoCourses.length} cours au total</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4" />
          Nouveau cours
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
          <h2 className="font-heading text-xl font-semibold text-heading">
            Nouveau cours
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input id="title" label="Titre" placeholder="Nom du cours" />
            <Input id="slug" label="Slug" placeholder="nom-du-cours" />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-heading">Thème</label>
              <select className="w-full px-4 py-2.5 rounded-xl bg-card border border-border text-text focus:outline-none focus:ring-2 focus:ring-button/30">
                <option>Vinyasa</option>
                <option>Hatha</option>
                <option>Yin Yoga</option>
                <option>Méditation</option>
                <option>Power Yoga</option>
                <option>Restauratif</option>
                <option>Respiration</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-heading">Niveau</label>
              <select className="w-full px-4 py-2.5 rounded-xl bg-card border border-border text-text focus:outline-none focus:ring-2 focus:ring-button/30">
                <option value="BEGINNER">Débutant</option>
                <option value="INTERMEDIATE">Intermédiaire</option>
                <option value="ADVANCED">Avancé</option>
              </select>
            </div>
            <Input id="duration" label="Durée (min)" type="number" placeholder="30" />
            <Input id="price" label="Prix (€, vide = abo uniquement)" type="number" placeholder="9.99" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-heading">Description</label>
            <textarea
              rows={4}
              className="w-full px-4 py-2.5 rounded-xl bg-card border border-border text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-button/30 resize-none"
              placeholder="Description du cours..."
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-text cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded accent-button" />
              Gratuit
            </label>
            <label className="flex items-center gap-2 text-sm text-text cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded accent-button" />
              Publié
            </label>
          </div>
          <div className="flex gap-3">
            <Button>Créer le cours</Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Annuler
            </Button>
          </div>
        </div>
      )}

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

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-primary/20">
                <th className="text-left p-4 text-sm font-medium text-heading">Cours</th>
                <th className="text-left p-4 text-sm font-medium text-heading">Thème</th>
                <th className="text-left p-4 text-sm font-medium text-heading">Niveau</th>
                <th className="text-left p-4 text-sm font-medium text-heading">Durée</th>
                <th className="text-left p-4 text-sm font-medium text-heading">Prix</th>
                <th className="text-left p-4 text-sm font-medium text-heading">Statut</th>
                <th className="text-right p-4 text-sm font-medium text-heading">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCourses.map((course) => (
                <tr key={course.id} className="hover:bg-primary/10 transition-colors">
                  <td className="p-4">
                    <p className="font-medium text-heading">{course.title}</p>
                    <p className="text-xs text-muted">{course.slug}</p>
                  </td>
                  <td className="p-4">
                    <Badge>{course.theme}</Badge>
                  </td>
                  <td className="p-4 text-sm text-text">
                    {levelLabels[course.level]}
                  </td>
                  <td className="p-4 text-sm text-text">{course.duration} min</td>
                  <td className="p-4 text-sm text-text">
                    {course.isFree ? (
                      <Badge variant="free">Gratuit</Badge>
                    ) : course.price ? (
                      `${course.price} €`
                    ) : (
                      <span className="text-muted">Abo</span>
                    )}
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
                      <button className="p-2 rounded-lg hover:bg-primary/30 transition-colors cursor-pointer" title="Modifier">
                        <Edit className="w-4 h-4 text-muted" />
                      </button>
                      <button className="p-2 rounded-lg hover:bg-primary/30 transition-colors cursor-pointer" title={course.isPublished ? "Dépublier" : "Publier"}>
                        {course.isPublished ? (
                          <EyeOff className="w-4 h-4 text-muted" />
                        ) : (
                          <Eye className="w-4 h-4 text-muted" />
                        )}
                      </button>
                      <button className="p-2 rounded-lg hover:bg-red-50 transition-colors cursor-pointer" title="Supprimer">
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
    </div>
  );
}
