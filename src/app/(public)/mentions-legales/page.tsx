import type { Metadata } from "next";
import { getContent, getContents } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContents(["seo_mentions_title", "seo_mentions_description"]);
  return {
    title: c["seo_mentions_title"] || "Mentions légales — Prana Motion Yoga",
    description: c["seo_mentions_description"] || "Mentions légales du site Prana Motion Yoga.",
    robots: { index: false, follow: true },
  };
}

function renderLegalContent(text: string) {
  if (!text)
    return (
      <p className="text-muted">
        Contenu à venir. Modifiable depuis l&apos;administration.
      </p>
    );

  return text.split("\n\n").map((block, i) => {
    if (block.startsWith("### ")) {
      return (
        <h3
          key={i}
          className="font-heading text-xl font-semibold text-heading mt-6 mb-3"
        >
          {block.slice(4)}
        </h3>
      );
    }
    if (block.startsWith("## ")) {
      return (
        <h2
          key={i}
          className="font-heading text-2xl font-semibold text-heading mt-8 mb-4"
        >
          {block.slice(3)}
        </h2>
      );
    }
    return (
      <p key={i} className="text-text leading-relaxed mb-4">
        {block}
      </p>
    );
  });
}

export default async function MentionsLegalesPage() {
  const content = await getContent("legal_mentions", "");

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="font-heading text-4xl font-bold text-heading mb-8">
        Mentions légales
      </h1>
      {renderLegalContent(content)}
    </div>
  );
}
