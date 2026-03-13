import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { swipe } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { domain, direction } = await request.json();

  await db.insert(swipe).values({
    userId: session.user.id,
    domain,
    direction,
    createdAt: new Date(),
  });

  return NextResponse.json({ success: true });
}

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const liked = await db.query.swipe.findMany({
    where: and(eq(swipe.userId, session.user.id), eq(swipe.direction, "right")),
    orderBy: (swipe, { desc }) => [desc(swipe.createdAt)],
  });

  return NextResponse.json({ domains: liked.map((s) => s.domain) });
}
