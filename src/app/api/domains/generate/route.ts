import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { preferences, swipe } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { createDeepInfra } from "@ai-sdk/deepinfra";
import { generateText } from "ai";
import { z } from "zod";
import { NextResponse } from "next/server";

async function isDomainAvailable(domain: string): Promise<boolean> {
  try {
    // Use RDAP (Registration Data Access Protocol) - the official ICANN replacement for WHOIS
    // Returns 200 if domain is registered, 404 if available
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`https://rdap.org/domain/${domain}`, {
      signal: controller.signal,
      headers: { Accept: "application/rdap+json" },
    });
    clearTimeout(timeout);
    // 200 = registered (not available), 404 = not found (available)
    if (res.status === 404) return true;
    if (res.ok) return false;
    // For other status codes (rate limit, server error), be conservative
    return false;
  } catch {
    // Network error or timeout - be conservative, mark as unavailable
    return false;
  }
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { topic } = await request.json();

  const userPrefs = await db.query.preferences.findFirst({
    where: eq(preferences.userId, session.user.id),
  });

  const tlds = userPrefs?.tlds || ".com";
  const mode = userPrefs?.mode || "bidomainial";

  const alreadySwiped = await db.query.swipe.findMany({
    where: eq(swipe.userId, session.user.id),
    columns: { domain: true },
  });
  const swipedDomains = alreadySwiped.map((s) => s.domain);

  const deepinfra = createDeepInfra({
    apiKey: process.env.DEEPINFRA_API_KEY,
  });

  const tldList = tlds.split(",").map((t: string) => t.trim());
  const tldExamples = tldList.join(", ");

  const { text } = await generateText({
    model: deepinfra("nvidia/NVIDIA-Nemotron-3-Super-120B-A12B"),
    prompt: `You are a world-class brand naming consultant and domain strategist. Generate 25 premium, highly brandable domain name ideas for: "${topic}".

DOMAIN STRATEGY RULES:
- Use ONLY these TLDs: ${tldExamples}
- Distribute suggestions across the selected TLDs
- Every domain must be a PLAUSIBLE real domain (no spaces, no special chars, lowercase only)
- ${mode === "bidomainial"
  ? "Focus on SHORT domains: 4-8 characters before the TLD. Think: single invented words, clever abbreviations, two-syllable portmanteaus. Examples: vercel.com, stripe.com, plaid.com, figma.com, notion.so"
  : "Focus on COMPOUND domains: creative two-word combos, metaphors, or descriptive phrases joined together. Think: openai.com, basecamp.com, airbnb.com, mailchimp.com, cloudflare.com"}

NAMING TECHNIQUES TO USE:
1. Portmanteaus (blend two relevant words): e.g., Pinterest = Pin + Interest
2. Metaphorical names (evoke a feeling): e.g., Slack, Ripple, Bolt
3. Modified real words (add/remove letters): e.g., Tumblr, Flickr, Lyft
4. Invented words (phonetically pleasing): e.g., Kodak, Xerox, Spotify
5. Verb-based names (imply action): e.g., Fetch, Gather, Zipline
6. Nature/science inspired: e.g., Aurora, Quantum, Helix
7. Domain hacks (use TLD as part of the word): e.g., del.icio.us, bit.ly

QUALITY FILTERS:
- Must be easy to spell when heard aloud
- Must be easy to pronounce
- Should feel modern and tech-forward
- Avoid generic/boring names like "smartapp.com" or "besttools.io"
- Avoid hyphens and numbers
- Do NOT use any of these already-seen domains: ${swipedDomains.slice(-100).join(", ")}

Return ONLY a valid JSON object: {"domains": ["domain1.com", "domain2.io", ...]}`,
  });

  const schema = z.object({
    domains: z.array(z.string()),
  });
  const trimmed = text.trim();
  const jsonStr = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)?.[1] ?? trimmed;

  let parsed;
  try {
    parsed = schema.safeParse(JSON.parse(jsonStr));
  } catch {
    return NextResponse.json(
      { error: "Failed to parse domain suggestions" },
      { status: 500 }
    );
  }

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Failed to parse domain suggestions" },
      { status: 500 }
    );
  }
  const object = parsed.data;

  // Filter out already swiped domains first
  const unswiped = object.domains.filter((d) => !swipedDomains.includes(d));

  // Check availability in parallel with concurrency limit
  const BATCH_SIZE = 5;
  const available: string[] = [];

  for (let i = 0; i < unswiped.length; i += BATCH_SIZE) {
    const batch = unswiped.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async (domain) => ({
        domain,
        available: await isDomainAvailable(domain),
      }))
    );
    for (const r of results) {
      if (r.available) available.push(r.domain);
    }
    // Stop early if we have enough
    if (available.length >= 10) break;
  }

  return NextResponse.json({ domains: available });
}
