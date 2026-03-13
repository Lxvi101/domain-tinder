import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { preferences } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prefs = await db.query.preferences.findFirst({
    where: eq(preferences.userId, session.user.id),
  });

  return NextResponse.json(prefs || { tlds: ".com", mode: "bidomainial" });
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tlds, mode } = await request.json();

  await db
    .insert(preferences)
    .values({ userId: session.user.id, tlds, mode })
    .onConflictDoUpdate({
      target: preferences.userId,
      set: { tlds, mode },
    });

  return NextResponse.json({ success: true });
}
