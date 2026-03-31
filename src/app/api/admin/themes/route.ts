import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const THEMES_KEY = "course_themes";

async function getThemesFromDb(): Promise<string[]> {
  // Themes stored in SiteContent
  const stored = await prisma.siteContent.findUnique({ where: { key: THEMES_KEY } });
  let storedThemes: string[] = [];
  if (stored) {
    try {
      storedThemes = JSON.parse(stored.value);
    } catch {
      storedThemes = [];
    }
  }

  // Also include any themes already on courses (to not lose existing data)
  const courseThemes = await prisma.course.findMany({
    select: { theme: true },
    distinct: ["theme"],
  });
  const courseThemeNames = courseThemes.map((c) => c.theme);

  // Merge and deduplicate, preserving stored order
  const all = [...new Set([...storedThemes, ...courseThemeNames])].sort();
  return all;
}

async function saveThemesToDb(themes: string[]) {
  await prisma.siteContent.upsert({
    where: { key: THEMES_KEY },
    update: { value: JSON.stringify(themes) },
    create: { key: THEMES_KEY, value: JSON.stringify(themes) },
  });
}

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const themes = await getThemesFromDb();

  // Count courses per theme
  const counts = await prisma.course.groupBy({
    by: ["theme"],
    _count: { id: true },
  });
  const countMap = Object.fromEntries(counts.map((c) => [c.theme, c._count.id]));

  return NextResponse.json({
    themes: themes.map((t) => ({ name: t, courseCount: countMap[t] ?? 0 })),
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Nom requis" }, { status: 400 });
  }

  const themes = await getThemesFromDb();
  const trimmed = name.trim();
  if (themes.includes(trimmed)) {
    return NextResponse.json({ error: "Ce thème existe déjà" }, { status: 400 });
  }

  const updated = [...themes, trimmed].sort();
  await saveThemesToDb(updated);

  return NextResponse.json({ success: true, themes: updated });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { oldName, newName } = await req.json();
  if (!oldName?.trim() || !newName?.trim()) {
    return NextResponse.json({ error: "Ancien et nouveau nom requis" }, { status: 400 });
  }

  const trimmedNew = newName.trim();
  const themes = await getThemesFromDb();

  if (!themes.includes(oldName)) {
    return NextResponse.json({ error: "Thème introuvable" }, { status: 404 });
  }
  if (themes.includes(trimmedNew) && trimmedNew !== oldName) {
    return NextResponse.json({ error: "Ce nom de thème existe déjà" }, { status: 400 });
  }

  // Rename in SiteContent
  const updated = themes.map((t) => (t === oldName ? trimmedNew : t)).sort();
  await saveThemesToDb(updated);

  // Rename on all courses
  await prisma.course.updateMany({
    where: { theme: oldName },
    data: { theme: trimmedNew },
  });

  return NextResponse.json({ success: true, themes: updated });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Nom requis" }, { status: 400 });
  }

  // Check if any courses use this theme
  const count = await prisma.course.count({ where: { theme: name } });
  if (count > 0) {
    return NextResponse.json(
      { error: `Ce thème est utilisé par ${count} cours. Modifiez ces cours d'abord.` },
      { status: 400 }
    );
  }

  const themes = await getThemesFromDb();
  const updated = themes.filter((t) => t !== name);
  await saveThemesToDb(updated);

  return NextResponse.json({ success: true, themes: updated });
}
