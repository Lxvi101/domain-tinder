import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { domain } = await request.json();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`https://rdap.org/domain/${domain}`, {
      signal: controller.signal,
      headers: { Accept: "application/rdap+json" },
    });
    clearTimeout(timeout);

    if (res.status === 404) {
      return NextResponse.json({ available: true });
    }
    return NextResponse.json({ available: false });
  } catch {
    return NextResponse.json({ available: false });
  }
}
