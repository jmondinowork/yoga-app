"use client";

import { useState } from "react";
import type { Metadata } from "next";
import { User, CreditCard, Bell, Trash2, Save } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";

export default function ParametresPage() {
  const [name, setName] = useState("Utilisateur");
  const [email, setEmail] = useState("user@example.com");
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    // Simulate save
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaving(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-bold text-heading mb-2">
          Paramètres
        </h1>
        <p className="text-muted">Gérez votre profil et vos préférences</p>
      </div>

      {/* Profile */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <User className="w-5 h-5 text-button" />
          <h2 className="font-heading text-lg font-semibold text-heading">Profil</h2>
        </div>

        <form onSubmit={handleSave} className="space-y-4 max-w-md">
          <Input
            id="name"
            label="Nom"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit" loading={saving}>
            <Save className="w-4 h-4" />
            Enregistrer
          </Button>
        </form>
      </div>

      {/* Subscription */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <CreditCard className="w-5 h-5 text-button" />
          <h2 className="font-heading text-lg font-semibold text-heading">Abonnement</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-accent-light/20 rounded-xl">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-heading">Plan mensuel</span>
                <Badge variant="success">Actif</Badge>
              </div>
              <p className="text-sm text-muted">19,99 € / mois — Renouvelé le 9 mars 2026</p>
            </div>
            <Button variant="outline" size="sm">
              Gérer via Stripe
            </Button>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" size="sm">
              Passer à l&apos;annuel (économisez 25%)
            </Button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <Bell className="w-5 h-5 text-button" />
          <h2 className="font-heading text-lg font-semibold text-heading">Notifications</h2>
        </div>

        <div className="space-y-3">
          {[
            { label: "Nouveaux cours disponibles", checked: true },
            { label: "Rappels de pratique quotidienne", checked: false },
            { label: "Promotions et offres spéciales", checked: true },
          ].map((notif) => (
            <label
              key={notif.label}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-primary/10 transition-colors cursor-pointer"
            >
              <span className="text-sm text-text">{notif.label}</span>
              <input
                type="checkbox"
                defaultChecked={notif.checked}
                className="w-4 h-4 rounded accent-button"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-card rounded-2xl border border-red-200 p-6 space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-red-200">
          <Trash2 className="w-5 h-5 text-red-500" />
          <h2 className="font-heading text-lg font-semibold text-red-600">Zone de danger</h2>
        </div>
        <p className="text-sm text-text">
          La suppression de votre compte est irréversible. Toutes vos données,
          achats et progression seront définitivement perdus.
        </p>
        <Button
          variant="ghost"
          className="text-red-500 hover:bg-red-50 border border-red-200"
        >
          <Trash2 className="w-4 h-4" />
          Supprimer mon compte
        </Button>
      </div>
    </div>
  );
}
