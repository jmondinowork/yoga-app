import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    env: {
      AUTH_SECRET: process.env.AUTH_SECRET ? "SET (" + process.env.AUTH_SECRET.substring(0, 5) + "...)" : "NOT SET",
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "SET" : "NOT SET",
      AUTH_URL: process.env.AUTH_URL || "NOT SET",
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || "NOT SET",
      DATABASE_URL: process.env.DATABASE_URL ? "SET (...)" : "NOT SET",
      RESEND_API_KEY: process.env.RESEND_API_KEY ? "SET" : "NOT SET",
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_URL: process.env.VERCEL_URL || "NOT SET",
    },
    timestamp: new Date().toISOString(),
  });
}
