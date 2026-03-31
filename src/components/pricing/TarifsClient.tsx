"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Video, FileText, Star } from "lucide-react";
import PricingTable from "./PricingTable";
import Button from "@/components/ui/Button";

const tabs = [
  { id: "cours", label: "Cours vidéo" },
  { id: "formations", label: "Formations" },
];

export default function TarifsClient() {
  const [activeTab, setActiveTab] = useState<"cours" | "formations">("cours");

  return (
    <>
      {/* Onglets */}
      <div className="flex justify-center mb-12">
        <div className="inline-flex bg-primary/30 rounded-2xl p-1.5 gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "cours" | "formations")}
              className={`px-8 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-card text-heading shadow-sm"
                  : "text-muted hover:text-text"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenu */}
      {activeTab === "cours" ? (
        <PricingTable />
      ) : (
        <div className="max-w-2xl mx-auto text-center space-y-10">
          {/* Icône */}
          <div className="w-20 h-20 rounded-2xl bg-accent-light mx-auto flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-button" />
          </div>

          {/* Texte */}
          <div className="space-y-4">
            <h2 className="font-heading text-3xl font-bold text-heading">
              Des programmes pour transformer votre pratique
            </h2>
            <p className="text-lg text-text">
              Les formations sont des programmes complets pensés pour aller en profondeur.
              Bien plus qu&apos;une vidéo — un vrai accompagnement.
            </p>
          </div>

          {/* Avantages */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center">
                <Video className="w-5 h-5 text-button" />
              </div>
              <h3 className="font-heading font-semibold text-heading">Vidéos exclusives</h3>
              <p className="text-sm text-muted">
                Des séances filmées spécifiquement pour la formation, non disponibles ailleurs.
              </p>
            </div>
            <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center">
                <FileText className="w-5 h-5 text-button" />
              </div>
              <h3 className="font-heading font-semibold text-heading">Livret PDF</h3>
              <p className="text-sm text-muted">
                Un guide complet à télécharger pour approfondir et garder une trace de votre progression.
              </p>
            </div>
            <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center">
                <Star className="w-5 h-5 text-button" />
              </div>
              <h3 className="font-heading font-semibold text-heading">Accès à vie</h3>
              <p className="text-sm text-muted">
                Un achat unique, un accès permanent. Revenez à votre rythme, sans limite de temps.
              </p>
            </div>
          </div>

          {/* CTA */}
          <Link href="/formations">
            <Button size="lg">
              Voir les formations
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      )}
    </>
  );
}
