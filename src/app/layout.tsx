import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import { getContents } from "@/lib/content";
import Providers from "./providers";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContents([
    "seo_site_name",
    "seo_site_description",
    "seo_keywords",
    "seo_locale",
    "seo_site_url",
    "seo_og_image",
    "seo_robots_index",
    "seo_robots_follow",
  ]);

  const siteName = c["seo_site_name"] || "Prana Motion Yoga";
  const siteUrl = c["seo_site_url"] || "https://www.pranamotion.fr";
  const keywords = c["seo_keywords"]
    ? c["seo_keywords"].split(",").map((k: string) => k.trim())
    : ["yoga", "cours en ligne", "vinyasa", "hatha", "méditation", "bien-être"];
  const indexable = c["seo_robots_index"] !== "false";
  const followable = c["seo_robots_follow"] !== "false";

  return {
    title: {
      default: `${siteName} — Cours de yoga en ligne`,
      template: `%s | ${siteName}`,
    },
    description:
      c["seo_site_description"] ||
      "Découvrez le yoga à votre rythme avec des cours en ligne accessibles à tous les niveaux. Vinyasa, Hatha, Yin, Méditation et plus encore.",
    keywords,
    metadataBase: new URL(siteUrl),
    openGraph: {
      type: "website",
      locale: c["seo_locale"] || "fr_FR",
      siteName,
      ...(c["seo_og_image"] ? { images: [{ url: c["seo_og_image"], width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      ...(c["seo_og_image"] ? { images: [c["seo_og_image"]] } : {}),
    },
    robots: {
      index: indexable,
      follow: followable,
    },
    alternates: {
      canonical: siteUrl,
    },
  };
}

const colorDefaults: Record<string, string> = {
  color_primary: "#F8E8C3",
  color_background: "#FFF9EE",
  color_heading: "#2B2A28",
  color_text: "#4B463A",
  color_button: "#0E7C78",
  color_button_text: "#FFFFFF",
  color_border: "#E8DCC8",
  color_card: "#FFFFFF",
  color_muted: "#8A8279",
  color_accent_light: "#E6F5F4",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const colorKeys = Object.keys(colorDefaults);
  const customValues = await getContents(colorKeys);

  const cssOverrides = Object.entries(colorDefaults)
    .map(([key, defaultVal]) => {
      const cssVar = `--color-${key.replace("color_", "")}`;
      const value = customValues[key] || defaultVal;
      return `${cssVar}: ${value};`;
    })
    .join(" ");

  return (
    <html lang="fr">
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `:root { ${cssOverrides} }`,
          }}
        />
      </head>
      <body
        className={`${cormorant.variable} ${dmSans.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
