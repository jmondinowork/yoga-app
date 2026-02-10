"use client";

import { Star, Quote } from "lucide-react";
import { useState, useEffect } from "react";

interface Testimonial {
  name: string;
  content: string;
  rating: number;
  avatar?: string | null;
}

const defaultTestimonials: Testimonial[] = [
  {
    name: "Sophie M.",
    content:
      "Je pratique le yoga depuis 6 mois avec Yoga Flow et les résultats sont incroyables. Les cours sont parfaitement structurés et le suivi de progression me motive à continuer.",
    rating: 5,
  },
  {
    name: "Thomas L.",
    content:
      "En tant que débutant, j'avais peur de ne pas comprendre les postures. Les cours sont très bien expliqués, avec un rythme adapté. Je recommande vivement !",
    rating: 5,
  },
  {
    name: "Marie-Claire D.",
    content:
      "L'abonnement annuel est un excellent investissement. La variété des cours permet de ne jamais s'ennuyer et de progresser à son rythme.",
    rating: 5,
  },
  {
    name: "Pierre R.",
    content:
      "Des séances de méditation exceptionnelles qui m'aident à gérer mon stress au quotidien. L'interface est belle et intuitive.",
    rating: 4,
  },
];

export default function TestimonialCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % defaultTestimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-6">
          <Quote className="w-10 h-10 text-button/30 mx-auto" />
        </div>

        <div className="min-h-[180px] flex items-center">
          <div className="space-y-4 transition-opacity duration-500">
            <p className="text-lg text-text leading-relaxed italic">
              &ldquo;{defaultTestimonials[currentIndex].content}&rdquo;
            </p>
            <div className="flex items-center justify-center gap-1 mb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < defaultTestimonials[currentIndex].rating
                      ? "text-amber-400 fill-amber-400"
                      : "text-border"
                  }`}
                />
              ))}
            </div>
            <p className="font-heading text-lg font-semibold text-heading">
              {defaultTestimonials[currentIndex].name}
            </p>
          </div>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-6">
          {defaultTestimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                i === currentIndex ? "bg-button w-8" : "bg-border hover:bg-muted"
              }`}
              aria-label={`Témoignage ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
