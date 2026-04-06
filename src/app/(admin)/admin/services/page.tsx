import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";

export const metadata: Metadata = {
  title: "Admin — Services",
};

const services = [
  {
    name: "Stripe",
    description: "Gestion des paiements, abonnements et achats de formations et cours.",
    url: "https://dashboard.stripe.com",
    color: "#635BFF",
    logo: (
      <svg viewBox="0 0 40 40" className="w-10 h-10" fill="none">
        <rect width="40" height="40" rx="8" fill="#635BFF" />
        <path
          d="M18.354 16.176c0-.95.78-1.316 2.07-1.316 1.85 0 4.188.56 6.038 1.558V11.06c-2.022-.8-4.016-1.116-6.038-1.116-4.94 0-8.226 2.582-8.226 6.894 0 6.726 9.258 5.652 9.258 8.552 0 1.124-.978 1.488-2.344 1.488-2.028 0-4.624-.834-6.684-1.96v5.446c2.276.978 4.578 1.392 6.684 1.392 5.06 0 8.54-2.502 8.54-6.878-.028-7.26-9.298-5.966-9.298-8.702z"
          fill="white"
        />
      </svg>
    ),
  },
  {
    name: "Resend",
    description: "Service d'envoi d'emails pour les invitations et notifications utilisateurs.",
    url: "https://resend.com/emails",
    color: "#000000",
    logo: (
      <svg viewBox="0 0 40 40" className="w-10 h-10" fill="none">
        <rect width="40" height="40" rx="8" fill="#000000" />
        <path
          d="M11 10h8.5c3.59 0 6.5 2.91 6.5 6.5 0 2.82-1.8 5.22-4.31 6.12L28 30h-4.5l-5.77-6.5H15V30h-4V10zm4 4v5.5h4.5c1.52 0 2.75-1.23 2.75-2.75S20.02 14 18.5 14H15z"
          fill="white"
        />
      </svg>
    ),
  },
  {
    name: "Cloudflare R2",
    description: "Stockage de fichiers : vidéos, thumbnails et documents PDF des formations.",
    url: "https://dash.cloudflare.com",
    color: "#F6821F",
    logo: (
      <svg viewBox="0 0 40 40" className="w-10 h-10" fill="none">
        <rect width="40" height="40" rx="8" fill="#F6821F" />
        <path
          d="M27.08 26.72l.56-1.94c.2-.68.12-1.3-.22-1.78-.32-.44-.84-.7-1.42-.74l-12.36-.16c-.1 0-.18-.06-.22-.14-.04-.08-.02-.18.04-.24.1-.12.24-.18.4-.2l12.48-.16c1.38-.08 2.88-1.2 3.38-2.54l.64-1.7c.04-.1.04-.2.02-.3-.72-3.38-3.74-5.9-7.34-5.9-3.32 0-6.14 2.18-7.1 5.18-.64-.48-1.44-.74-2.3-.68-1.56.12-2.82 1.38-2.96 2.94-.04.42 0 .82.1 1.2-2.44.08-4.4 2.08-4.4 4.56 0 .26.02.52.06.76.02.12.12.2.24.2h20.12c.12 0 .22-.08.26-.2z"
          fill="white"
        />
        <path
          d="M29.84 18.2c-.16 0-.3 0-.46.02l-.12.02c-.08.02-.16.1-.18.18l-.44 1.52c-.2.68-.12 1.3.22 1.78.32.44.84.7 1.42.74l2.66.16c.1 0 .18.06.22.14.04.08.02.18-.04.24-.1.12-.24.18-.4.2l-2.78.16c-1.4.08-2.88 1.2-3.4 2.54l-.18.46c-.04.1.04.2.14.2h7.96c.1 0 .2-.08.22-.18.24-.78.38-1.6.38-2.46 0-2.96-2.42-5.38-5.38-5.38l.16-.72z"
          fill="white"
          fillOpacity="0.7"
        />
      </svg>
    ),
  },
];

export default function AdminServicesPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-heading">Services</h1>
        <p className="text-muted mt-1">
          Services tiers utilisés par l&apos;application.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <a
            key={service.name}
            href={service.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-card border border-border rounded-2xl p-6 hover:border-button/50 hover:shadow-lg transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-4">
              {service.logo}
              <ExternalLink className="w-4 h-4 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <h3 className="font-heading text-lg font-semibold text-heading mb-2">
              {service.name}
            </h3>
            <p className="text-sm text-muted leading-relaxed">
              {service.description}
            </p>
            <div className="mt-4 pt-4 border-t border-border">
              <span className="text-xs text-button font-medium group-hover:underline">
                Accéder au dashboard →
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
