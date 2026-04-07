import { NextResponse } from "next/server";
import { getContent } from "@/lib/content";
import { getObjectFromR2 } from "@/lib/r2";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET() {
  const faviconKey = await getContent("site_favicon");

  if (faviconKey) {
    try {
      const { body, contentType } = await getObjectFromR2(faviconKey);
      return new NextResponse(body, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=3600, s-maxage=3600",
        },
      });
    } catch {
      // Fall through to default favicon
    }
  }

  // Serve default favicon from public/
  const defaultPath = join(process.cwd(), "public", "default-favicon.ico");
  const buffer = await readFile(defaultPath);
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "image/x-icon",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
