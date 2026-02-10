"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";

interface FilterBarProps {
  themes: string[];
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  search: string;
  theme: string;
  level: string;
  duration: string;
}

const levels = [
  { value: "", label: "Tous les niveaux" },
  { value: "BEGINNER", label: "Débutant" },
  { value: "INTERMEDIATE", label: "Intermédiaire" },
  { value: "ADVANCED", label: "Avancé" },
];

const durations = [
  { value: "", label: "Toutes les durées" },
  { value: "15", label: "≤ 15 min" },
  { value: "30", label: "≤ 30 min" },
  { value: "45", label: "≤ 45 min" },
  { value: "60", label: "≤ 60 min" },
];

export default function FilterBar({ themes, onFilterChange }: FilterBarProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    theme: "",
    level: "",
    duration: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  const updateFilter = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const cleared: FilterState = { search: "", theme: "", level: "", duration: "" };
    setFilters(cleared);
    onFilterChange(cleared);
  };

  const hasActiveFilters = filters.theme || filters.level || filters.duration;

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-muted absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher un cours..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-card border border-border text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-button/30 focus:border-button transition-all"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-3 rounded-xl border transition-all cursor-pointer flex items-center gap-2 ${
            showFilters || hasActiveFilters
              ? "bg-button text-white border-button"
              : "bg-card border-border text-text hover:border-button"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">Filtres</span>
        </button>
      </div>

      {/* Filter options */}
      {showFilters && (
        <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Theme */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-heading">Thème</label>
              <select
                value={filters.theme}
                onChange={(e) => updateFilter("theme", e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-text focus:outline-none focus:ring-2 focus:ring-button/30"
              >
                <option value="">Tous les thèmes</option>
                {themes.map((theme) => (
                  <option key={theme} value={theme}>
                    {theme}
                  </option>
                ))}
              </select>
            </div>

            {/* Level */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-heading">Niveau</label>
              <select
                value={filters.level}
                onChange={(e) => updateFilter("level", e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-text focus:outline-none focus:ring-2 focus:ring-button/30"
              >
                {levels.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Duration */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-heading">Durée</label>
              <select
                value={filters.duration}
                onChange={(e) => updateFilter("duration", e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-text focus:outline-none focus:ring-2 focus:ring-button/30"
              >
                {durations.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 text-sm text-button hover:underline cursor-pointer"
            >
              <X className="w-3 h-3" />
              Effacer les filtres
            </button>
          )}
        </div>
      )}
    </div>
  );
}
