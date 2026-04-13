"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import useSWR from "swr";
import { HexColorPicker } from "react-colorful";
import {
  Save,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Star,
  Eye,
  EyeOff,
  RotateCcw,
  Loader2,
  Type,
  FileText,
  MessageSquare,
  HelpCircle,
  Scale,
  Search,
  Palette,
  Home,
  Upload,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { compressImage } from "@/lib/helpers/compress-image";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 Mo

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Testimonial {
  id: string;
  name: string;
  content: string;
  rating: number;
  isVisible: boolean;
}

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqData {
  homepage: FaqItem[];
  pricing: FaqItem[];
}

type TabKey =
  | "accueil"
  | "a-propos"
  | "pages"
  | "temoignages"
  | "faq"
  | "legal"
  | "seo"
  | "apparence";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "accueil", label: "Accueil", icon: <Home className="w-4 h-4" /> },
  { key: "a-propos", label: "À propos", icon: <Type className="w-4 h-4" /> },
  { key: "pages", label: "Pages", icon: <FileText className="w-4 h-4" /> },
  { key: "temoignages", label: "Témoignages", icon: <MessageSquare className="w-4 h-4" /> },
  { key: "faq", label: "FAQ", icon: <HelpCircle className="w-4 h-4" /> },
  { key: "legal", label: "Pages légales", icon: <Scale className="w-4 h-4" /> },
  { key: "seo", label: "SEO", icon: <Search className="w-4 h-4" /> },
  { key: "apparence", label: "Apparence", icon: <Palette className="w-4 h-4" /> },
];

// ---------------------------------------------------------------------------
// Default colors for the Apparence tab
// ---------------------------------------------------------------------------

const DEFAULT_COLORS: { key: string; label: string; defaultValue: string }[] = [
  { key: "color_primary", label: "Couleur primaire (fond sections)", defaultValue: "#F8E8C3" },
  { key: "color_background", label: "Fond de page", defaultValue: "#FFF9EE" },
  { key: "color_heading", label: "Titres", defaultValue: "#2B2A28" },
  { key: "color_text", label: "Texte", defaultValue: "#4B463A" },
  { key: "color_button", label: "Boutons", defaultValue: "#0E7C78" },
  { key: "color_button_text", label: "Texte des boutons", defaultValue: "#FFFFFF" },
  { key: "color_border", label: "Bordures", defaultValue: "#E8DCC8" },
  { key: "color_card", label: "Fond des cartes", defaultValue: "#FFFFFF" },
  { key: "color_muted", label: "Texte secondaire", defaultValue: "#8A8279" },
  { key: "color_accent_light", label: "Accent clair", defaultValue: "#E6F5F4" },
];

// Comprehensive list of popular Google Fonts
const ALL_FONTS = [
  "ABeeZee", "Abel", "Abril Fatface", "Aclonica", "Acme", "Alegreya", "Alegreya Sans",
  "Alex Brush", "Alfa Slab One", "Alice", "Allerta", "Allura", "Amatic SC", "Amiri",
  "Antic Slab", "Anton", "Archivo", "Archivo Black", "Archivo Narrow", "Arimo", "Arsenal",
  "Arvo", "Asap", "Assistant", "Atkinson Hyperlegible",
  "Barlow", "Barlow Condensed", "Barlow Semi Condensed", "Be Vietnam Pro", "Bebas Neue",
  "Bitter", "Black Ops One", "Bodoni Moda", "Bree Serif", "Bricolage Grotesque",
  "Cabin", "Cairo", "Cantarell", "Cardo", "Catamaran", "Caveat", "Chakra Petch",
  "Chivo", "Cinzel", "Comfortaa", "Commissioner", "Concert One", "Cookie",
  "Cormorant", "Cormorant Garamond", "Cormorant Infant", "Courier Prime", "Crimson Pro",
  "Crimson Text", "Cuprum",
  "DM Mono", "DM Sans", "DM Serif Display", "DM Serif Text", "Dancing Script",
  "Darker Grotesque", "Della Respira", "Domine", "Dosis",
  "EB Garamond", "Eczar", "El Messiri", "Electrolize", "Encode Sans", "Exo", "Exo 2",
  "Familjen Grotesk", "Fira Code", "Fira Sans", "Fira Sans Condensed", "Fjalla One",
  "Fraunces", "Fredoka", "Funnel Display", "Funnel Sans",
  "Gabarito", "Gelasio", "Gilda Display", "Gloria Hallelujah", "Gothic A1",
  "Great Vibes", "Gowun Batang",
  "Heebo", "Hind", "Hind Madurai", "Hind Siliguri",
  "IBM Plex Mono", "IBM Plex Sans", "IBM Plex Serif", "Imbue", "Inconsolata",
  "Indie Flower", "Inter", "Inter Tight",
  "JetBrains Mono", "Josefin Sans", "Josefin Slab", "Jost",
  "Kalam", "Kanit", "Karla", "Kaushan Script", "Khand", "Kreon",
  "Lato", "League Spartan", "Lexend", "Lexend Deca", "Libre Baskerville",
  "Libre Caslon Text", "Libre Franklin", "Lilita One", "Literata", "Lobster",
  "Lobster Two", "Lora", "Lusitana",
  "Macondo", "Manrope", "Marcellus", "Martel", "Maven Pro", "Merriweather",
  "Merriweather Sans", "Michroma", "Mitr", "Montserrat", "Montserrat Alternates",
  "Mukta", "Mulish", "Muli",
  "Nanum Gothic", "Nanum Myeongjo", "Neuton", "Noto Sans", "Noto Serif",
  "Noto Serif Display", "Nunito", "Nunito Sans",
  "Old Standard TT", "Oldenburg", "Oleo Script", "Open Sans", "Orbitron",
  "Oswald", "Outfit", "Overpass", "Oxygen",
  "PT Sans", "PT Serif", "Pacifico", "Padauk", "Pathway Gothic One",
  "Patrick Hand", "Paytone One", "Permanent Marker", "Philosopher", "Playfair Display",
  "Playfair Display SC", "Plus Jakarta Sans", "Poppins", "Prata",
  "Pridi", "Prompt", "Proza Libre", "Public Sans", "Puritan",
  "Quattrocento", "Quattrocento Sans", "Questrial", "Quicksand",
  "Rajdhani", "Raleway", "Readex Pro", "Red Hat Display", "Red Hat Text",
  "Righteous", "Roboto", "Roboto Condensed", "Roboto Flex", "Roboto Mono",
  "Roboto Serif", "Roboto Slab", "Rokkitt", "Rosario", "Rubik", "Ruda",
  "Saira", "Saira Condensed", "Satisfy", "Sawarabi Gothic", "Secular One",
  "Sen", "Shadows Into Light", "Signika", "Silkscreen", "Slabo 27px",
  "Sora", "Source Code Pro", "Source Sans 3", "Source Serif 4", "Space Grotesk",
  "Space Mono", "Spectral", "Stint Ultra Condensed", "Syne",
  "Tajawal", "Tangerine", "Teko", "Tenor Sans", "Titillium Web",
  "Ubuntu", "Ubuntu Condensed", "Ubuntu Mono", "Unbounded", "Unna",
  "Varela Round", "Vazirmatn", "Vollkorn", "Volkhov",
  "Work Sans", "Yanone Kaffeesatz", "Yantramanav", "Yellowtail",
  "Zen Kaku Gothic New", "Zilla Slab",
];

// ---------------------------------------------------------------------------
// FontPicker — searchable font selector with preview
// ---------------------------------------------------------------------------

function FontPicker({
  label, value, onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filtered = query
    ? ALL_FONTS.filter((f) => f.toLowerCase().includes(query.toLowerCase())).slice(0, 20)
    : ALL_FONTS.slice(0, 20);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Load font preview via Google Fonts CSS
  function loadFont(fontName: string) {
    const id = `gf-${fontName.replace(/\s+/g, "-")}`;
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}&display=swap`;
    document.head.appendChild(link);
  }

  useEffect(() => {
    if (value) loadFont(value);
  }, [value]);

  useEffect(() => {
    if (isOpen) {
      filtered.forEach((f) => loadFont(f));
    }
  }, [isOpen, filtered]);

  return (
    <div ref={wrapperRef} className="relative space-y-1.5">
      <label className="block text-sm font-medium text-heading">{label}</label>
      <button
        type="button"
        onClick={() => { setIsOpen(!isOpen); setQuery(""); }}
        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-left text-text focus:outline-none focus:ring-2 focus:ring-button cursor-pointer flex items-center justify-between"
      >
        <span style={{ fontFamily: `"${value}", sans-serif` }}>{value}</span>
        <svg className={`w-4 h-4 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-card rounded-xl border border-border shadow-lg overflow-hidden">
          <div className="p-2 border-b border-border">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une police..."
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-text focus:outline-none focus:ring-2 focus:ring-button"
              autoFocus
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-sm text-muted">Aucune police trouvée</p>
            ) : (
              filtered.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => { onChange(f); setIsOpen(false); }}
                  className={`w-full px-4 py-2.5 text-left text-sm hover:bg-primary/20 cursor-pointer flex items-center justify-between transition-colors ${
                    f === value ? "bg-primary/30 font-medium" : ""
                  }`}
                >
                  <span style={{ fontFamily: `"${f}", sans-serif` }}>{f}</span>
                  {f === value && <span className="text-button text-xs">✓</span>}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ColorRow — inline color picker with popover (react-colorful)
// ---------------------------------------------------------------------------

function ColorRow({
  label, value, isOpen, onToggle, onClose, onChange,
}: {
  label: string;
  value: string;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onChange: (v: string) => void;
}) {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  return (
    <div className="relative flex items-center gap-4 bg-card rounded-xl border border-border p-3">
      <div
        className="w-10 h-10 rounded-lg border border-border shrink-0"
        style={{ backgroundColor: value }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-heading">{label}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-24 px-3 py-1.5 rounded-lg border border-border bg-background text-sm text-text font-mono focus:outline-none focus:ring-2 focus:ring-button"
        />
        <button
          type="button"
          onClick={onToggle}
          className="w-10 h-10 rounded-lg border border-border cursor-pointer shrink-0 transition-shadow hover:ring-2 hover:ring-button/30"
          style={{ backgroundColor: value }}
        />
      </div>
      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute right-0 top-full mt-2 z-50 bg-card rounded-xl border border-border shadow-lg p-3"
        >
          <HexColorPicker color={value} onChange={onChange} />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full mt-2 px-3 py-1.5 rounded-lg border border-border bg-background text-sm text-text font-mono text-center focus:outline-none focus:ring-2 focus:ring-button"
          />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared sub-components (defined outside to avoid re-mount on every render)
// ---------------------------------------------------------------------------

function LabeledTextarea({
  label,
  rows = 3,
  ...rest
}: {
  label: string;
  rows?: number;
  value: string;
  placeholder?: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-heading">{label}</label>
      <textarea
        rows={rows}
        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-button resize-y"
        {...rest}
      />
    </div>
  );
}

function SectionCard({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-primary/5 rounded-xl border border-border/50 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-lg font-semibold text-heading">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function SaveBar({ tab, onSave, isSaving, feedback }: {
  tab: string;
  onSave: () => void;
  isSaving: boolean;
  feedback?: { type: "success" | "error"; text: string };
}) {
  return (
    <div className="flex items-center justify-between pt-4">
      <div>
        {feedback && (
          <p className={`text-sm ${feedback.type === "success" ? "text-green-600" : "text-red-500"}`}>
            {feedback.text}
          </p>
        )}
      </div>
      <Button onClick={onSave} loading={isSaving} disabled={isSaving}>
        <Save className="w-4 h-4" />
        Enregistrer
      </Button>
    </div>
  );
}

function CharCounter({ value, max, label }: { value: string; max: number; label?: string }) {
  const len = value?.length || 0;
  const color = len === 0 ? "text-muted" : len <= max ? "text-green-600" : "text-red-500";
  return (
    <span className={`text-xs ${color}`}>
      {label && `${label} : `}{len}/{max}
    </span>
  );
}

function GooglePreview({ title, description, path, siteUrl }: { title: string; description: string; path: string; siteUrl: string }) {
  const displayTitle = title || "Titre de la page";
  const displayDesc = description || "Description de la page pour les moteurs de recherche...";
  return (
    <div className="mt-3 p-4 bg-white rounded-lg border border-border/50">
      <p className="text-xs text-muted mb-1">Aperçu Google</p>
      <div className="space-y-0.5">
        <p className="text-xs text-green-700 truncate">{siteUrl}{path}</p>
        <p className="text-[16px] text-blue-700 font-medium leading-snug truncate">{displayTitle.slice(0, 60)}</p>
        <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">{displayDesc.slice(0, 160)}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AdminContenuPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("accueil");

  // Global site content (key-value)
  const [content, setContent] = useState<Record<string, string>>({});

  // Testimonials
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  // FAQ
  const [faq, setFaq] = useState<FaqData>({ homepage: [], pricing: [] });

  // Saving states per tab
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState<Record<string, { type: "success" | "error"; text: string }>>({});

  // Delete confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // FAQ sub-tab
  const [faqSubTab, setFaqSubTab] = useState<"homepage" | "pricing">("homepage");

  // Color picker popover
  const [colorPickerOpen, setColorPickerOpen] = useState<string | null>(null);

  // Presigned URLs for image previews (R2 key -> displayable URL)
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  // Track which image key is currently uploading
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);

  // Track upload error per image key
  const [imageError, setImageError] = useState<Record<string, string>>({});

  // SEO accordion expanded state
  const [seoExpandedPages, setSeoExpandedPages] = useState<Record<string, boolean>>({});

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const field = useCallback(
    (key: string, placeholder?: string) => ({
      value: content[key] || "",
      placeholder,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setContent((prev) => ({ ...prev, [key]: e.target.value })),
    }),
    [content]
  );

  function showFeedback(tab: string, type: "success" | "error", text: string) {
    setFeedback((prev) => ({ ...prev, [tab]: { type, text } }));
    if (type === "success") {
      setTimeout(() => setFeedback((prev) => {
        const next = { ...prev };
        delete next[tab];
        return next;
      }), 4000);
    }
  }

  /** Apply color & font overrides to the live page without reloading */
  function applyThemeLive(entries: Record<string, string>) {
    const root = document.documentElement;
    // Colors
    for (const c of DEFAULT_COLORS) {
      const val = entries[c.key];
      if (val !== undefined) {
        root.style.setProperty(`--color-${c.key.replace("color_", "").replaceAll("_", "-")}`, val);
      }
    }
    // Fonts
    if (entries["font_heading"]) {
      const name = entries["font_heading"];
      loadGoogleFont(name);
      root.style.setProperty("--font-heading", `"${name}", serif`);
    }
    if (entries["font_body"]) {
      const name = entries["font_body"];
      loadGoogleFont(name);
      root.style.setProperty("--font-body", `"${name}", sans-serif`);
    }
  }

  function loadGoogleFont(fontName: string) {
    const id = `gf-live-${fontName.replace(/\s+/g, "-")}`;
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@400;500;600;700&display=swap`;
    document.head.appendChild(link);
  }

  async function uploadImage(file: File, imageKey: string, contentKey: string) {
    setImageError(prev => { const next = { ...prev }; delete next[imageKey]; return next; });
    setUploadingImage(imageKey);
    try {
      // Compress/resize bitmap images before upload
      const compressed = await compressImage(file);

      if (compressed.size > MAX_IMAGE_SIZE) {
        setImageError(prev => ({ ...prev, [imageKey]: `L'image est trop lourde (${(compressed.size / 1024 / 1024).toFixed(1)} Mo après compression). Taille maximale : 5 Mo.` }));
        return;
      }

      const formData = new FormData();
      formData.append("file", compressed);
      formData.append("type", "site-image");
      formData.append("imageKey", imageKey);
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        setContent(prev => ({ ...prev, [contentKey]: data.key }));
        if (data.url) setImageUrls(prev => ({ ...prev, [data.key]: data.url }));
      } else {
        const data = await res.json().catch(() => ({}));
        setImageError(prev => ({ ...prev, [imageKey]: data.error || "Erreur lors de l'upload de l'image" }));
      }
    } catch {
      setImageError(prev => ({ ...prev, [imageKey]: "Erreur réseau lors de l'upload" }));
    } finally {
      setUploadingImage(null);
    }
  }

  // ---------------------------------------------------------------------------
  // Fetch data via SWR
  // ---------------------------------------------------------------------------
  const swrFetcher = (url: string) => fetch(url).then(r => { if (!r.ok) throw new Error('fetch error'); return r.json(); });

  const { data: contentData, isLoading: loadingContent } = useSWR<Record<string, string>>(
    "/api/admin/content",
    swrFetcher,
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  );
  const { data: testimonialsData, isLoading: loadingTestimonials } = useSWR<Testimonial[]>(
    "/api/admin/testimonials",
    swrFetcher,
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  );
  const { data: faqData, isLoading: loadingFaq } = useSWR<FaqData>(
    "/api/admin/faq",
    swrFetcher,
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  );

  // Sync SWR data into local state for editing
  useEffect(() => {
    if (contentData) setContent(contentData);
  }, [contentData]);
  useEffect(() => {
    if (testimonialsData) setTestimonials(testimonialsData);
  }, [testimonialsData]);
  useEffect(() => {
    if (faqData) setFaq(faqData);
  }, [faqData]);

  // Resolve presigned image URLs when content loads
  useEffect(() => {
    if (!contentData) return;
    const imageKeys = ["image_homepage_hero", "image_homepage_about", "image_about_portrait", "seo_og_image", "site_logo", "site_favicon"];
    const keysToResolve = imageKeys.map(k => contentData[k]).filter(Boolean);
    if (keysToResolve.length > 0) {
      fetch("/api/admin/content/image-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keys: keysToResolve }),
      })
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data?.urls) setImageUrls(data.urls); })
        .catch(() => {});
    }
  }, [contentData]);

  // ---------------------------------------------------------------------------
  // Save handlers
  // ---------------------------------------------------------------------------

  async function saveContent(tab: string, keys: string[]) {
    setSaving((prev) => ({ ...prev, [tab]: true }));
    setFeedback((prev) => {
      const next = { ...prev };
      delete next[tab];
      return next;
    });

    const entries: Record<string, string> = {};
    for (const k of keys) {
      entries[k] = content[k] || "";
    }

    try {
      const res = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries }),
      });
      if (res.ok) {
        showFeedback(tab, "success", "Modifications enregistrées ✓");
        // Apply color & font changes live without reloading
        applyThemeLive(entries);
      } else {
        const data = await res.json().catch(() => ({}));
        showFeedback(tab, "error", data.error || "Erreur lors de la sauvegarde");
      }
    } catch {
      showFeedback(tab, "error", "Erreur réseau");
    } finally {
      setSaving((prev) => ({ ...prev, [tab]: false }));
    }
  }

  async function saveFaq() {
    setSaving((prev) => ({ ...prev, faq: true }));
    setFeedback((prev) => {
      const next = { ...prev };
      delete next.faq;
      return next;
    });

    try {
      const res = await fetch("/api/admin/faq", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(faq),
      });
      if (res.ok) {
        showFeedback("faq", "success", "FAQ enregistrée ✓");
      } else {
        showFeedback("faq", "error", "Erreur lors de la sauvegarde");
      }
    } catch {
      showFeedback("faq", "error", "Erreur réseau");
    } finally {
      setSaving((prev) => ({ ...prev, faq: false }));
    }
  }

  async function saveTestimonials() {
    setSaving((prev) => ({ ...prev, temoignages: true }));
    setFeedback((prev) => {
      const next = { ...prev };
      delete next.temoignages;
      return next;
    });

    try {
      // Save all testimonials: update existing, create new ones
      for (const t of testimonials) {
        if (t.id.startsWith("new-")) {
          await fetch("/api/admin/testimonials", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: t.name, content: t.content, rating: t.rating, isVisible: t.isVisible }),
          });
        } else {
          await fetch("/api/admin/testimonials", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: t.id, name: t.name, content: t.content, rating: t.rating, isVisible: t.isVisible }),
          });
        }
      }

      // Refresh testimonials from server
      const res = await fetch("/api/admin/testimonials");
      if (res.ok) {
        setTestimonials(await res.json());
      }

      showFeedback("temoignages", "success", "Témoignages enregistrés ✓");
    } catch {
      showFeedback("temoignages", "error", "Erreur lors de la sauvegarde");
    } finally {
      setSaving((prev) => ({ ...prev, temoignages: false }));
    }
  }

  async function deleteTestimonial(id: string) {
    if (id.startsWith("new-")) {
      setTestimonials((prev) => prev.filter((t) => t.id !== id));
      setConfirmDeleteId(null);
      return;
    }

    try {
      const res = await fetch("/api/admin/testimonials", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setTestimonials((prev) => prev.filter((t) => t.id !== id));
      }
    } catch {
      showFeedback("temoignages", "error", "Erreur lors de la suppression");
    }
    setConfirmDeleteId(null);
  }



  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  if (loadingContent) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted" />
        <span className="ml-2 text-muted">Chargement...</span>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Tab: Accueil
  // ---------------------------------------------------------------------------

  const ACCUEIL_KEYS = [
    "image_homepage_hero",
    "image_homepage_about",
    "homepage_hero_badge",
    "homepage_hero_title",
    "homepage_hero_subtitle",
    "homepage_about_label",
    "homepage_about_heading",
    "homepage_about_text",
    "homepage_about_stat_1",
    "homepage_about_stat_2",
    "homepage_about_stat_3",
    "homepage_how_label",
    "homepage_how_heading",
    "homepage_how_step_1_title",
    "homepage_how_step_1_desc",
    "homepage_how_step_2_title",
    "homepage_how_step_2_desc",
    "homepage_how_step_3_title",
    "homepage_how_step_3_desc",
    "homepage_cta_heading",
    "homepage_cta_subtitle",
    "homepage_calendar_heading",
    "homepage_calendar_subtitle",
    "calendrier_page_heading",
    "calendrier_page_subtitle",
  ];

  function renderAccueil() {
    return (
      <div className="space-y-6">
        <SectionCard title="Images">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-heading">Image hero</label>
              {content["image_homepage_hero"] ? (
                <div className="relative rounded-xl overflow-hidden border border-border">
                  <img src={imageUrls[content["image_homepage_hero"]] || content["image_homepage_hero"]} alt="" className="w-full h-48 object-cover" />
                  <button
                    type="button"
                    onClick={() => { setContent(prev => { const next = {...prev}; delete next["image_homepage_hero"]; return next; }); setImageUrls(prev => { const next = {...prev}; return next; }); }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-lg p-1.5 hover:bg-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : uploadingImage === "homepage-hero" ? (
                <div className="flex flex-col items-center justify-center w-full h-48 rounded-xl border-2 border-dashed border-border bg-background">
                  <Loader2 className="w-8 h-8 text-muted mb-2 animate-spin" />
                  <span className="text-sm text-muted">Upload en cours…</span>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-48 rounded-xl border-2 border-dashed border-border bg-background hover:border-button cursor-pointer transition-colors">
                  <Upload className="w-8 h-8 text-muted mb-2" />
                  <span className="text-sm text-muted">Cliquer pour uploader</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      await uploadImage(file, "homepage-hero", "image_homepage_hero");
                    }}
                  />
                </label>
              )}
              {imageError["homepage-hero"] && <p className="text-sm text-red-500 mt-1">{imageError["homepage-hero"]}</p>}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-heading">Photo à propos</label>
              {content["image_homepage_about"] ? (
                <div className="relative rounded-xl overflow-hidden border border-border">
                  <img src={imageUrls[content["image_homepage_about"]] || content["image_homepage_about"]} alt="" className="w-full h-48 object-cover" />
                  <button
                    type="button"
                    onClick={() => { setContent(prev => { const next = {...prev}; delete next["image_homepage_about"]; return next; }); }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-lg p-1.5 hover:bg-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : uploadingImage === "homepage-about" ? (
                <div className="flex flex-col items-center justify-center w-full h-48 rounded-xl border-2 border-dashed border-border bg-background">
                  <Loader2 className="w-8 h-8 text-muted mb-2 animate-spin" />
                  <span className="text-sm text-muted">Upload en cours…</span>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-48 rounded-xl border-2 border-dashed border-border bg-background hover:border-button cursor-pointer transition-colors">
                  <Upload className="w-8 h-8 text-muted mb-2" />
                  <span className="text-sm text-muted">Cliquer pour uploader</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      await uploadImage(file, "homepage-about", "image_homepage_about");
                    }}
                  />
                </label>
              )}
              {imageError["homepage-about"] && <p className="text-sm text-red-500 mt-1">{imageError["homepage-about"]}</p>}
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Section Hero">
          <Input id="homepage_hero_badge" label="Badge" {...field("homepage_hero_badge", "Nouveaux cours chaque semaine")} />
          <Input id="homepage_hero_title" label="Titre principal" {...field("homepage_hero_title", "Trouvez votre équilibre intérieur")} />
          <LabeledTextarea label="Sous-titre" {...field("homepage_hero_subtitle")} />
        </SectionCard>

        <SectionCard title="Section À propos">
          <Input id="homepage_about_label" label="Label" {...field("homepage_about_label", "À propos")} />
          <Input id="homepage_about_heading" label="Titre" {...field("homepage_about_heading")} />
          <LabeledTextarea label="Texte principal" rows={5} {...field("homepage_about_text")} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Input id="homepage_about_stat_1" label="Stat 1" {...field("homepage_about_stat_1", "50+ Cours disponibles")} />
            <Input id="homepage_about_stat_2" label="Stat 2" {...field("homepage_about_stat_2", "2k+ Élèves actifs")} />
            <Input id="homepage_about_stat_3" label="Stat 3" {...field("homepage_about_stat_3", "4.9 Note moyenne")} />
          </div>
        </SectionCard>

        <SectionCard title="Section Comment ça marche">
          <Input id="homepage_how_label" label="Label" {...field("homepage_how_label")} />
          <Input id="homepage_how_heading" label="Titre" {...field("homepage_how_heading")} />
          {[1, 2, 3].map((n) => (
            <div key={n} className="grid gap-4 sm:grid-cols-2">
              <Input
                id={`homepage_how_step_${n}_title`}
                label={`Étape ${n} — Titre`}
                {...field(`homepage_how_step_${n}_title`)}
              />
              <LabeledTextarea label={`Étape ${n} — Description`} {...field(`homepage_how_step_${n}_desc`)} />
            </div>
          ))}
        </SectionCard>

        <SectionCard title="Section CTA final">
          <Input id="homepage_cta_heading" label="Titre" {...field("homepage_cta_heading")} />
          <LabeledTextarea label="Sous-titre" {...field("homepage_cta_subtitle")} />
        </SectionCard>

        <SectionCard title="Section Cours en direct (accueil)">
          <Input id="homepage_calendar_heading" label="Titre" {...field("homepage_calendar_heading", "Rejoignez nos cours en direct")} />
          <LabeledTextarea label="Sous-titre" {...field("homepage_calendar_subtitle", "Pratiquez en live avec Mathilde via Zoom...")} />
        </SectionCard>

        <SectionCard title="Page Cours en ligne">
          <Input id="calendrier_page_heading" label="Titre de la page" {...field("calendrier_page_heading", "Cours en direct")} />
          <LabeledTextarea label="Sous-titre" {...field("calendrier_page_subtitle", "Rejoignez Mathilde en direct sur Zoom...")} />
        </SectionCard>

        <SaveBar tab="accueil" onSave={() => saveContent("accueil", ACCUEIL_KEYS)} isSaving={!!saving["accueil"]} feedback={feedback["accueil"]} />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Tab: A propos
  // ---------------------------------------------------------------------------

  const ABOUT_KEYS = [
    "image_about_portrait",
    "about_hero_label",
    "about_hero_heading",
    "about_hero_intro",
    "about_story_heading",
    "about_story_text_1",
    "about_story_text_2",
    "about_story_text_3",
    "about_values_heading",
    ...Array.from({ length: 4 }, (_, i) => [`about_value_${i + 1}_title`, `about_value_${i + 1}_desc`]).flat(),
  ];

  function renderAPropos() {
    return (
      <div className="space-y-6">
        <SectionCard title="Images">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-heading">Photo portrait</label>
            {content["image_about_portrait"] ? (
              <div className="relative rounded-xl overflow-hidden border border-border">
                <img src={imageUrls[content["image_about_portrait"]] || content["image_about_portrait"]} alt="" className="w-full h-48 object-cover" />
                <button
                  type="button"
                  onClick={() => { setContent(prev => { const next = {...prev}; delete next["image_about_portrait"]; return next; }); }}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-lg p-1.5 hover:bg-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : uploadingImage === "about-portrait" ? (
              <div className="flex flex-col items-center justify-center w-full h-48 rounded-xl border-2 border-dashed border-border bg-background">
                <Loader2 className="w-8 h-8 text-muted mb-2 animate-spin" />
                <span className="text-sm text-muted">Upload en cours…</span>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-48 rounded-xl border-2 border-dashed border-border bg-background hover:border-button cursor-pointer transition-colors">
                <Upload className="w-8 h-8 text-muted mb-2" />
                <span className="text-sm text-muted">Cliquer pour uploader</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    await uploadImage(file, "about-portrait", "image_about_portrait");
                  }}
                />
              </label>
            )}
            {imageError["about-portrait"] && <p className="text-sm text-red-500 mt-1">{imageError["about-portrait"]}</p>}
          </div>
        </SectionCard>

        <SectionCard title="Hero">
          <Input id="about_hero_label" label="Label" {...field("about_hero_label")} />
          <Input id="about_hero_heading" label="Titre" {...field("about_hero_heading")} />
          <LabeledTextarea label="Introduction" rows={4} {...field("about_hero_intro")} />
        </SectionCard>

        <SectionCard title="Histoire">
          <Input id="about_story_heading" label="Titre" {...field("about_story_heading")} />
          <LabeledTextarea label="Paragraphe 1" rows={4} {...field("about_story_text_1")} />
          <LabeledTextarea label="Paragraphe 2" rows={4} {...field("about_story_text_2")} />
          <LabeledTextarea label="Paragraphe 3" rows={4} {...field("about_story_text_3")} />
        </SectionCard>

        <SectionCard title="Valeurs">
          <Input id="about_values_heading" label="Titre de la section" {...field("about_values_heading")} />
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="space-y-3 bg-card rounded-xl border border-border p-4">
                <Input
                  id={`about_value_${n}_title`}
                  label={`Valeur ${n} — Titre`}
                  {...field(`about_value_${n}_title`)}
                />
                <LabeledTextarea label={`Valeur ${n} — Description`} {...field(`about_value_${n}_desc`)} />
              </div>
            ))}
          </div>
        </SectionCard>

        <SaveBar tab="a-propos" onSave={() => saveContent("a-propos", ABOUT_KEYS)} isSaving={!!saving["a-propos"]} feedback={feedback["a-propos"]} />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Tab: Pages
  // ---------------------------------------------------------------------------

  const PAGES_KEYS = [
    "courses_heading",
    "courses_description",
    "formations_heading",
    "formations_description",
    "pricing_heading",
    "pricing_description",
    "footer_brand",
    "footer_tagline",
    "footer_social_instagram",
    "footer_social_email",
  ];

  function renderPages() {
    const pages = [
      { label: "Cours", prefix: "courses" },
      { label: "Formations", prefix: "formations" },
      { label: "Tarifs", prefix: "pricing" },
    ];

    return (
      <div className="space-y-6">
        {pages.map((p) => (
          <SectionCard key={p.prefix} title={`Page ${p.label}`}>
            <Input
              id={`${p.prefix}_heading`}
              label="Titre"
              {...field(`${p.prefix}_heading`)}
            />
            <LabeledTextarea label="Description" {...field(`${p.prefix}_description`)} />
          </SectionCard>
        ))}

        <SectionCard title="Footer & Réseaux sociaux">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="footer_brand"
              label="Nom affiché dans le footer"
              {...field("footer_brand", "Prana Motion Yoga")}
            />
            <div />
          </div>
          <LabeledTextarea
            label="Tagline du footer"
            rows={2}
            {...field("footer_tagline", "Découvrez le yoga à votre rythme, avec des cours en ligne accessibles à tous les niveaux.")}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="footer_social_instagram"
              label="Lien Instagram"
              {...field("footer_social_instagram")}
              placeholder="https://instagram.com/votre-compte"
            />
            <Input
              id="footer_social_email"
              label="Email de contact"
              {...field("footer_social_email")}
              placeholder="contact@pranamotion.fr"
            />
          </div>
          <p className="text-xs text-muted">Les icônes réseaux sociaux s&apos;affichent dans le footer uniquement si un lien est renseigné.</p>
        </SectionCard>

        <SaveBar tab="pages" onSave={() => saveContent("pages", PAGES_KEYS)} isSaving={!!saving["pages"]} feedback={feedback["pages"]} />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Tab: Temoignages
  // ---------------------------------------------------------------------------

  function updateTestimonial(id: string, updates: Partial<Testimonial>) {
    setTestimonials((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  }

  function addTestimonial() {
    setTestimonials((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        name: "",
        content: "",
        rating: 5,
        isVisible: true,
      },
    ]);
  }

  function renderTemoignages() {
    if (loadingTestimonials) {
      return (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-5 h-5 animate-spin text-muted" />
          <span className="ml-2 text-muted">Chargement...</span>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted">{testimonials.length} témoignage{testimonials.length !== 1 ? "s" : ""}</p>
          <Button variant="outline" size="sm" onClick={addTestimonial}>
            <Plus className="w-4 h-4" />
            Ajouter un témoignage
          </Button>
        </div>

        <div className="space-y-3">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="bg-primary/5 rounded-xl border border-border/50 p-5 space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-3">
                  <Input
                    id={`tname-${t.id}`}
                    label="Nom"
                    value={t.name}
                    onChange={(e) => updateTestimonial(t.id, { name: e.target.value })}
                    placeholder="Nom du témoignant"
                  />
                  <LabeledTextarea
                    label="Contenu"
                    rows={3}
                    value={t.content}
                    onChange={(e) => updateTestimonial(t.id, { content: e.target.value })}
                    placeholder="Le témoignage..."
                  />

                  <div className="flex items-center gap-6">
                    {/* Rating stars */}
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-heading">Note</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => updateTestimonial(t.id, { rating: star })}
                            className="cursor-pointer"
                          >
                            <Star
                              className={`w-5 h-5 ${
                                star <= t.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-border"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Visibility toggle */}
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-heading">Visibilité</label>
                      <button
                        type="button"
                        onClick={() => updateTestimonial(t.id, { isVisible: !t.isVisible })}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                          t.isVisible
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {t.isVisible ? (
                          <>
                            <Eye className="w-3.5 h-3.5" /> Visible
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5" /> Masqué
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Delete button */}
                <div className="shrink-0">
                  {confirmDeleteId === t.id ? (
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteTestimonial(t.id)}
                        className="text-red-500 hover:bg-red-50"
                      >
                        Confirmer
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmDeleteId(null)}
                      >
                        Annuler
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(t.id)}
                      className="p-2 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <SaveBar tab="temoignages" onSave={saveTestimonials} isSaving={!!saving["temoignages"]} feedback={feedback["temoignages"]} />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Tab: FAQ
  // ---------------------------------------------------------------------------

  function addFaqItem(section: "homepage" | "pricing") {
    setFaq((prev) => ({
      ...prev,
      [section]: [...prev[section], { question: "", answer: "" }],
    }));
  }

  function updateFaqItem(section: "homepage" | "pricing", index: number, updates: Partial<FaqItem>) {
    setFaq((prev) => ({
      ...prev,
      [section]: prev[section].map((item, i) => (i === index ? { ...item, ...updates } : item)),
    }));
  }

  function removeFaqItem(section: "homepage" | "pricing", index: number) {
    setFaq((prev) => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index),
    }));
  }

  function moveFaqItem(section: "homepage" | "pricing", index: number, direction: "up" | "down") {
    setFaq((prev) => {
      const items = [...prev[section]];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= items.length) return prev;
      [items[index], items[targetIndex]] = [items[targetIndex], items[index]];
      return { ...prev, [section]: items };
    });
  }

  function renderFaqSection(section: "homepage" | "pricing", title: string) {
    const items = faq[section];

    return (
      <SectionCard
        title={title}
        action={
          <Button variant="outline" size="sm" onClick={() => addFaqItem(section)}>
            <Plus className="w-4 h-4" />
            Ajouter une question
          </Button>
        }
      >
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex items-start gap-3 bg-card rounded-xl border border-border p-4"
            >
              {/* Reorder arrows */}
              <div className="shrink-0 flex flex-col gap-0.5 mt-1">
                <button
                  type="button"
                  onClick={() => moveFaqItem(section, index, "up")}
                  disabled={index === 0}
                  className="p-1 rounded hover:bg-primary/20 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronUp className="w-4 h-4 text-muted" />
                </button>
                <button
                  type="button"
                  onClick={() => moveFaqItem(section, index, "down")}
                  disabled={index === items.length - 1}
                  className="p-1 rounded hover:bg-primary/20 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronDown className="w-4 h-4 text-muted" />
                </button>
              </div>

              <div className="flex-1 space-y-2">
                <Input
                  id={`faq-${section}-q-${index}`}
                  label="Question"
                  value={item.question}
                  onChange={(e) => updateFaqItem(section, index, { question: e.target.value })}
                  placeholder="La question..."
                />
                <LabeledTextarea
                  label="Réponse"
                  rows={2}
                  value={item.answer}
                  onChange={(e) => updateFaqItem(section, index, { answer: e.target.value })}
                  placeholder="La réponse..."
                />
              </div>

              <button
                type="button"
                onClick={() => removeFaqItem(section, index)}
                className="shrink-0 p-2 rounded-lg hover:bg-red-50 transition-colors cursor-pointer mt-1"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            </div>
          ))}
        </div>
      </SectionCard>
    );
  }

  function renderFaq() {
    if (loadingFaq) {
      return (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-5 h-5 animate-spin text-muted" />
          <span className="ml-2 text-muted">Chargement...</span>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="bg-primary/20 rounded-lg p-0.5 inline-flex">
          <button
            type="button"
            onClick={() => setFaqSubTab("homepage")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer ${
              faqSubTab === "homepage"
                ? "bg-card text-heading shadow-sm"
                : "text-muted hover:text-heading"
            }`}
          >
            FAQ Accueil
          </button>
          <button
            type="button"
            onClick={() => setFaqSubTab("pricing")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer ${
              faqSubTab === "pricing"
                ? "bg-card text-heading shadow-sm"
                : "text-muted hover:text-heading"
            }`}
          >
            FAQ Tarifs
          </button>
        </div>

        {faqSubTab === "homepage"
          ? renderFaqSection("homepage", "FAQ Accueil")
          : renderFaqSection("pricing", "FAQ Tarifs")}

        <SaveBar tab="faq" onSave={saveFaq} isSaving={!!saving["faq"]} feedback={feedback["faq"]} />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Tab: Pages legales
  // ---------------------------------------------------------------------------

  const LEGAL_KEYS = ["legal_mentions", "legal_cgv", "legal_privacy"];

  function renderLegal() {
    const sections = [
      { key: "legal_mentions", label: "Mentions légales" },
      { key: "legal_cgv", label: "CGV" },
      { key: "legal_privacy", label: "Politique de confidentialité" },
    ];

    return (
      <div className="space-y-6">
        <p className="text-sm text-muted">
          Ces textes sont affichés tels quels sur les pages correspondantes.
        </p>

        {sections.map((s) => (
          <SectionCard key={s.key} title={s.label}>
            <textarea
              rows={12}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-button resize-y"
              value={content[s.key] || ""}
              onChange={(e) => setContent((prev) => ({ ...prev, [s.key]: e.target.value }))}
            />
          </SectionCard>
        ))}

        <SaveBar tab="legal" onSave={() => saveContent("legal", LEGAL_KEYS)} isSaving={!!saving["legal"]} feedback={feedback["legal"]} />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Tab: SEO
  // ---------------------------------------------------------------------------

  const SEO_PAGES = [
    { label: "Accueil", prefix: "seo_homepage", path: "/" },
    { label: "À propos", prefix: "seo_about", path: "/a-propos" },
    { label: "Cours", prefix: "seo_courses", path: "/cours" },
    { label: "Formations", prefix: "seo_formations", path: "/formations" },
    { label: "Cours en ligne", prefix: "seo_calendrier", path: "/cours-en-ligne" },
    { label: "Tarifs", prefix: "seo_pricing", path: "/tarifs" },
    { label: "Mentions légales", prefix: "seo_mentions", path: "/mentions-legales" },
    { label: "CGV", prefix: "seo_cgv", path: "/cgv" },
    { label: "Confidentialité", prefix: "seo_privacy", path: "/confidentialite" },
  ];

  const SEO_GLOBAL_KEYS = [
    "seo_site_name",
    "seo_site_description",
    "seo_keywords",
    "seo_og_image",
    "seo_locale",
    "seo_site_url",
    "seo_robots_index",
    "seo_robots_follow",
  ];

  const SEO_KEYS = [
    ...SEO_GLOBAL_KEYS,
    ...SEO_PAGES.flatMap((p) => [
      `${p.prefix}_title`,
      `${p.prefix}_description`,
      `${p.prefix}_keywords`,
      `${p.prefix}_og_title`,
      `${p.prefix}_og_description`,
    ]),
  ];

  function renderSeo() {
    return (
      <div className="space-y-6">
        {/* Global SEO settings */}
        <SectionCard title="Paramètres globaux">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="seo_site_name"
              label="Nom du site"
              {...field("seo_site_name", "Prana Motion Yoga")}
              placeholder="Prana Motion Yoga"
            />
            <Input
              id="seo_site_url"
              label="URL du site"
              {...field("seo_site_url", "https://www.pranamotion.fr")}
              placeholder="https://www.pranamotion.fr"
            />
          </div>
          <LabeledTextarea
            label="Description générale du site"
            rows={2}
            {...field("seo_site_description", "Cours de yoga en ligne pour tous les niveaux. Vinyasa, Hatha, Yin, Méditation et plus.")}
            placeholder="Description utilisée par défaut sur toutes les pages"
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-heading">Mots-clés globaux</label>
            <textarea
              rows={2}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-button resize-y"
              value={content["seo_keywords"] ?? "yoga, cours en ligne, vinyasa, hatha, yin yoga, méditation, bien-être, relaxation"}
              onChange={(e) => setContent((prev) => ({ ...prev, seo_keywords: e.target.value }))}
              placeholder="yoga, cours en ligne, vinyasa, hatha, yin yoga, méditation..."
            />
            <p className="text-xs text-muted">Séparez les mots-clés par des virgules</p>
          </div>
          <Input
            id="seo_locale"
            label="Locale"
            {...field("seo_locale", "fr_FR")}
            placeholder="fr_FR"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={content["seo_robots_index"] !== "false"}
                  onChange={(e) => setContent((prev) => ({ ...prev, seo_robots_index: e.target.checked ? "true" : "false" }))}
                />
                <div className="w-9 h-5 bg-border rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-button"></div>
              </label>
              <span className="text-sm text-text">Autoriser l&apos;indexation (index)</span>
            </div>
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={content["seo_robots_follow"] !== "false"}
                  onChange={(e) => setContent((prev) => ({ ...prev, seo_robots_follow: e.target.checked ? "true" : "false" }))}
                />
                <div className="w-9 h-5 bg-border rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-button"></div>
              </label>
              <span className="text-sm text-text">Suivre les liens (follow)</span>
            </div>
          </div>

          {/* OG Image */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-heading">Image Open Graph (partage réseaux sociaux)</label>
            <p className="text-xs text-muted">Recommandé : 1200×630px, JPEG ou PNG</p>
            {content["seo_og_image"] ? (
              <div className="relative rounded-xl overflow-hidden border border-border max-w-md">
                <img src={imageUrls[content["seo_og_image"]] || content["seo_og_image"]} alt="" className="w-full h-40 object-cover" />
                <button
                  type="button"
                  onClick={() => setContent(prev => { const next = {...prev}; delete next["seo_og_image"]; return next; })}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-lg p-1.5 hover:bg-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : uploadingImage === "og-default" ? (
              <div className="flex flex-col items-center justify-center w-full max-w-md h-40 rounded-xl border-2 border-dashed border-border bg-background">
                <Loader2 className="w-8 h-8 text-muted mb-2 animate-spin" />
                <span className="text-sm text-muted">Upload en cours…</span>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full max-w-md h-40 rounded-xl border-2 border-dashed border-border bg-background hover:border-button cursor-pointer transition-colors">
                <Upload className="w-8 h-8 text-muted mb-2" />
                <span className="text-sm text-muted">1200×630px recommandé</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    await uploadImage(file, "og-default", "seo_og_image");
                  }}
                />
              </label>
            )}
            {imageError["og-default"] && <p className="text-sm text-red-500 mt-1">{imageError["og-default"]}</p>}
          </div>
        </SectionCard>

        {/* Per-page SEO */}
        <SectionCard title="SEO par page">
          <p className="text-xs text-muted -mt-2">Cliquez sur une page pour personnaliser son titre, sa description et ses mots-clés. L&apos;aperçu Google vous montre le rendu dans les résultats de recherche.</p>
          <div className="space-y-3">
            {SEO_PAGES.map((page) => {
              const isOpen = seoExpandedPages[page.prefix] ?? false;
              const titleVal = content[`${page.prefix}_title`] ?? "";
              const descVal = content[`${page.prefix}_description`] ?? "";
              return (
                <div key={page.prefix} className="rounded-xl border border-border/50 bg-white overflow-hidden">
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-background/50 transition-colors"
                    onClick={() => setSeoExpandedPages(prev => ({ ...prev, [page.prefix]: !isOpen }))}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-sm text-heading">{page.label}</span>
                      <span className="text-xs text-muted font-mono">{page.path}</span>
                      {titleVal && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-700">Personnalisé</span>}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 space-y-3 border-t border-border/30">
                      <div className="space-y-1.5 pt-3">
                        <div className="flex items-center justify-between">
                          <label className="block text-sm font-medium text-heading">Titre SEO</label>
                          <CharCounter value={titleVal} max={60} />
                        </div>
                        <input
                          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-button"
                          value={titleVal}
                          onChange={(e) => setContent(prev => ({ ...prev, [`${page.prefix}_title`]: e.target.value }))}
                          placeholder="Titre optimisé pour Google (max 60 caractères)"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="block text-sm font-medium text-heading">Meta description</label>
                          <CharCounter value={descVal} max={160} />
                        </div>
                        <textarea
                          rows={2}
                          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-button resize-y"
                          value={descVal}
                          onChange={(e) => setContent(prev => ({ ...prev, [`${page.prefix}_description`]: e.target.value }))}
                          placeholder="Description engageante (max 160 caractères)"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-heading">Mots-clés spécifiques</label>
                        <input
                          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-button"
                          value={content[`${page.prefix}_keywords`] ?? ""}
                          onChange={(e) => setContent(prev => ({ ...prev, [`${page.prefix}_keywords`]: e.target.value }))}
                          placeholder="mots-clés spécifiques à cette page, séparés par virgule"
                        />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <label className="block text-sm font-medium text-heading">Titre OG (réseaux sociaux)</label>
                          <input
                            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-button"
                            value={content[`${page.prefix}_og_title`] ?? ""}
                            onChange={(e) => setContent(prev => ({ ...prev, [`${page.prefix}_og_title`]: e.target.value }))}
                            placeholder="Titre pour Facebook/LinkedIn (si différent)"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-sm font-medium text-heading">Description OG</label>
                          <input
                            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-button"
                            value={content[`${page.prefix}_og_description`] ?? ""}
                            onChange={(e) => setContent(prev => ({ ...prev, [`${page.prefix}_og_description`]: e.target.value }))}
                            placeholder="Description pour les réseaux sociaux"
                          />
                        </div>
                      </div>
                      <GooglePreview
                        title={titleVal || content["seo_site_name"] || "Prana Motion Yoga"}
                        description={descVal || content["seo_site_description"] || ""}
                        path={page.path}
                        siteUrl={content["seo_site_url"] || "https://www.pranamotion.fr"}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </SectionCard>

        <SaveBar tab="seo" onSave={() => saveContent("seo", SEO_KEYS)} isSaving={!!saving["seo"]} feedback={feedback["seo"]} />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Tab: Apparence
  // ---------------------------------------------------------------------------

  const APPARENCE_KEYS = [
    ...DEFAULT_COLORS.map((c) => c.key),
    "font_heading",
    "font_body",
    "site_logo",
    "site_favicon",
  ];

  function resetColors() {
    setContent((prev) => {
      const next = { ...prev };
      for (const c of DEFAULT_COLORS) {
        next[c.key] = c.defaultValue;
      }
      return next;
    });
  }

  function renderApparence() {
    return (
      <div className="space-y-6">
        <SectionCard title="Logo & Favicon">
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Logo */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-heading">Logo du site</label>
              <p className="text-xs text-muted">Remplace le logo texte dans la barre de navigation.</p>
              {content["site_logo"] ? (
                <div className="relative rounded-xl overflow-hidden border border-border bg-background p-4 flex items-center justify-center">
                  <img src={imageUrls[content["site_logo"]] || content["site_logo"]} alt="Logo" className="max-h-20 w-auto object-contain" />
                  <button
                    type="button"
                    onClick={() => { setContent(prev => { const next = {...prev}; delete next["site_logo"]; return next; }); }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-lg p-1.5 hover:bg-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : uploadingImage === "site-logo" ? (
                <div className="flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed border-border bg-background">
                  <Loader2 className="w-8 h-8 text-muted mb-2 animate-spin" />
                  <span className="text-sm text-muted">Upload en cours…</span>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed border-border bg-background hover:border-button cursor-pointer transition-colors">
                  <Upload className="w-8 h-8 text-muted mb-2" />
                  <span className="text-sm text-muted">PNG, SVG ou WebP recommandé</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      await uploadImage(file, "site-logo", "site_logo");
                    }}
                  />
                </label>
              )}
              {imageError["site-logo"] && <p className="text-sm text-red-500 mt-1">{imageError["site-logo"]}</p>}
            </div>

            {/* Favicon */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-heading">Favicon</label>
              <p className="text-xs text-muted">Icône affichée dans l&apos;onglet du navigateur (ICO, PNG ou SVG).</p>
              {content["site_favicon"] ? (
                <div className="relative rounded-xl overflow-hidden border border-border bg-background p-4 flex items-center justify-center">
                  <img src={imageUrls[content["site_favicon"]] || content["site_favicon"]} alt="Favicon" className="w-16 h-16 object-contain" />
                  <button
                    type="button"
                    onClick={() => { setContent(prev => { const next = {...prev}; delete next["site_favicon"]; return next; }); }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-lg p-1.5 hover:bg-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : uploadingImage === "site-favicon" ? (
                <div className="flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed border-border bg-background">
                  <Loader2 className="w-8 h-8 text-muted mb-2 animate-spin" />
                  <span className="text-sm text-muted">Upload en cours…</span>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed border-border bg-background hover:border-button cursor-pointer transition-colors">
                  <Upload className="w-8 h-8 text-muted mb-2" />
                  <span className="text-sm text-muted">ICO, PNG ou SVG</span>
                  <input
                    type="file"
                    accept="image/x-icon,image/vnd.microsoft.icon,image/png,image/svg+xml,image/webp"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      await uploadImage(file, "site-favicon", "site_favicon");
                    }}
                  />
                </label>
              )}
              {imageError["site-favicon"] && <p className="text-sm text-red-500 mt-1">{imageError["site-favicon"]}</p>}
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Couleurs">
          <div className="space-y-3">
            {DEFAULT_COLORS.map((c) => {
              const value = content[c.key] || c.defaultValue;
              const isOpen = colorPickerOpen === c.key;
              return (
                <ColorRow
                  key={c.key}
                  label={c.label}
                  value={value}
                  isOpen={isOpen}
                  onToggle={() => setColorPickerOpen(isOpen ? null : c.key)}
                  onClose={() => setColorPickerOpen(null)}
                  onChange={(v) => setContent((prev) => ({ ...prev, [c.key]: v }))}
                />
              );
            })}
          </div>

          <div className="flex justify-start pt-2">
            <Button variant="outline" size="sm" onClick={resetColors}>
              <RotateCcw className="w-4 h-4" />
              Réinitialiser les couleurs par défaut
            </Button>
          </div>
        </SectionCard>

        <SectionCard title="Typographie">
          <div className="grid gap-4 sm:grid-cols-2">
            <FontPicker
              label="Police des titres"
              value={content["font_heading"] || "Cormorant Garamond"}
              onChange={(v) => setContent((prev) => ({ ...prev, font_heading: v }))}
            />
            <FontPicker
              label="Police du texte"
              value={content["font_body"] || "DM Sans"}
              onChange={(v) => setContent((prev) => ({ ...prev, font_body: v }))}
            />
          </div>
        </SectionCard>

        <SaveBar tab="apparence" onSave={() => saveContent("apparence", APPARENCE_KEYS)} isSaving={!!saving["apparence"]} feedback={feedback["apparence"]} />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Tab content dispatcher
  // ---------------------------------------------------------------------------

  function renderTabContent() {
    switch (activeTab) {
      case "accueil":
        return renderAccueil();
      case "a-propos":
        return renderAPropos();
      case "pages":
        return renderPages();
      case "temoignages":
        return renderTemoignages();
      case "faq":
        return renderFaq();
      case "legal":
        return renderLegal();
      case "seo":
        return renderSeo();
      case "apparence":
        return renderApparence();
    }
  }

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="font-heading text-3xl font-bold text-heading mb-2">
          Gestion du contenu
        </h1>
        <p className="text-muted">
          Modifiez les textes, témoignages, FAQ et l&apos;apparence de votre site
        </p>
      </div>

      {/* Tab bar */}
      <div className="bg-primary/20 rounded-xl p-1 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium
                transition-all duration-200 cursor-pointer whitespace-nowrap
                ${
                  activeTab === tab.key
                    ? "bg-card text-heading shadow-sm"
                    : "text-muted hover:text-heading hover:bg-card/50"
                }
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="bg-card rounded-2xl border border-border p-6">
        {renderTabContent()}
      </div>
    </div>
  );
}
