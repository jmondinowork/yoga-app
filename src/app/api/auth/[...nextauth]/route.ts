import { handlers } from "@/lib/auth";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const { GET: authGET, POST: authPOST } = handlers;

export async function GET(req: NextRequest) {
  console.log("[AUTH] GET request:", req.url);
  try {
    const response = await authGET(req);
    console.log("[AUTH] GET response status:", response?.status);
    return response;
  } catch (error) {
    console.error("[AUTH] GET error:", error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  console.log("[AUTH] POST request:", req.url);
  try {
    const response = await authPOST(req);
    console.log("[AUTH] POST response status:", response?.status);
    return response;
  } catch (error) {
    console.error("[AUTH] POST error:", error);
    throw error;
  }
}
