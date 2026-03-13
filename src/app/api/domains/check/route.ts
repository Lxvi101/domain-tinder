import { NextResponse } from "next/server";
import dns from "dns/promises";

export async function POST(request: Request) {
  const { domain } = await request.json();

  try {
    await dns.resolveAny(domain);
    return NextResponse.json({ available: false });
  } catch {
    return NextResponse.json({ available: true });
  }
}
