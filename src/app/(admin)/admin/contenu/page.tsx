"use client";

import { useState } from "react";
import { Save, Plus, Trash2, GripVertical } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function AdminContenuPage() {
  const [heroTitle, setHeroTitle] = useState("Trouvez votre équilibre intérieur");
  const [heroSubtitle, setHeroSubtitle] = useState(
    "Des cours de yoga en ligne pour tous les niveaux. Pratiquez à votre rythme, où que vous soyez."
  );
  const [aboutText, setAboutText] = useState(
    "Depuis plus de 10 ans, le yoga a transformé ma vie. Formée auprès des plus grands maîtres, je vous propose des cours accessibles qui allient tradition et modernité."
  );

  const [testimonials, setTestimonials] = useState([
    { id: "1", name: "Sophie M.", content: "Les cours sont parfaitement structurés.", rating: 5 },
    { id: "2", name: "Thomas L.", content: "Parfait pour les débutants.", rating: 5 },
    { id: "3", name: "Marie-Claire D.", content: "Excellent investissement.", rating: 5 },
  ]);

  const [faqs, setFaqs] = useState([
    { id: "1", question: "Ai-je besoin d'expérience ?", answer: "Non, nos cours sont pour tous les niveaux." },
    { id: "2", question: "Comment fonctionne l'abonnement ?", answer: "Accès illimité à tous les cours." },
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-heading mb-2">
            Gestion du contenu
          </h1>
          <p className="text-muted">Modifiez les textes de la page d&apos;accueil et du site</p>
        </div>
        <Button>
          <Save className="w-4 h-4" />
          Tout sauvegarder
        </Button>
      </div>

      {/* Hero Section */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <h2 className="font-heading text-xl font-semibold text-heading">
          Section Hero
        </h2>
        <Input
          id="heroTitle"
          label="Titre principal"
          value={heroTitle}
          onChange={(e) => setHeroTitle(e.target.value)}
        />
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-heading">Sous-titre</label>
          <textarea
            rows={3}
            value={heroSubtitle}
            onChange={(e) => setHeroSubtitle(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-card border border-border text-text focus:outline-none focus:ring-2 focus:ring-button/30 resize-none"
          />
        </div>
      </div>

      {/* About */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <h2 className="font-heading text-xl font-semibold text-heading">
          Section À propos
        </h2>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-heading">Texte de présentation</label>
          <textarea
            rows={5}
            value={aboutText}
            onChange={(e) => setAboutText(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-card border border-border text-text focus:outline-none focus:ring-2 focus:ring-button/30 resize-none"
          />
        </div>
      </div>

      {/* Testimonials */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl font-semibold text-heading">
            Témoignages
          </h2>
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4" />
            Ajouter
          </Button>
        </div>
        <div className="space-y-3">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="flex items-start gap-3 p-4 bg-primary/10 rounded-xl"
            >
              <GripVertical className="w-4 h-4 text-muted mt-1 shrink-0 cursor-grab" />
              <div className="flex-1 space-y-2">
                <Input id={`name-${t.id}`} placeholder="Nom" defaultValue={t.name} />
                <textarea
                  rows={2}
                  defaultValue={t.content}
                  className="w-full px-4 py-2 rounded-xl bg-card border border-border text-text text-sm focus:outline-none focus:ring-2 focus:ring-button/30 resize-none"
                />
              </div>
              <button className="p-2 rounded-lg hover:bg-red-50 transition-colors cursor-pointer">
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl font-semibold text-heading">
            FAQ
          </h2>
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4" />
            Ajouter
          </Button>
        </div>
        <div className="space-y-3">
          {faqs.map((faq) => (
            <div
              key={faq.id}
              className="flex items-start gap-3 p-4 bg-primary/10 rounded-xl"
            >
              <GripVertical className="w-4 h-4 text-muted mt-1 shrink-0 cursor-grab" />
              <div className="flex-1 space-y-2">
                <Input id={`q-${faq.id}`} placeholder="Question" defaultValue={faq.question} />
                <textarea
                  rows={2}
                  defaultValue={faq.answer}
                  className="w-full px-4 py-2 rounded-xl bg-card border border-border text-text text-sm focus:outline-none focus:ring-2 focus:ring-button/30 resize-none"
                />
              </div>
              <button className="p-2 rounded-lg hover:bg-red-50 transition-colors cursor-pointer">
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
