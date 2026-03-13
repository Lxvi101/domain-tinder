import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { preferences, swipe } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { createDeepInfra } from "@ai-sdk/deepinfra";
import { generateText } from "ai";
import { z } from "zod";
import { NextResponse } from "next/server";
import dns from "dns/promises";

async function isDomainAvailable(domain: string): Promise<boolean> {
  try {
    await dns.resolveAny(domain);
    return false;
  } catch {
    return true;
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

  const { text } = await generateText({
    model: deepinfra("nvidia/NVIDIA-Nemotron-3-Super-120B-A12B"),
    prompt: `Generate 20 creative, catchy, and memorable domain name ideas for the topic: "${topic}".

Rules:
- Use these TLDs: ${tlds}
- Mode: ${mode === "bidomainial" ? "Generate short, punchy single-word or two-word domains" : "Generate creative multi-word or compound domains"}
- Make them brandable and easy to remember
- Mix creative wordplay, portmanteaus, and clever combinations
- Do NOT generate any of these already-seen domains: ${swipedDomains.join(", ")}
- Return ONLY a valid JSON object with this exact format: {"domains": ["domain1.com", "domain2.com", ...]}`,
  });

  const schema = z.object({
    domains: z.array(z.string()).describe("Array of full domain names including TLD"),
  });
  const trimmed = text.trim();
  const jsonStr = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)?.[1] ?? trimmed;
  const parsed = schema.safeParse(JSON.parse(jsonStr));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Failed to parse domain suggestions" },
      { status: 500 }
    );
  }
  const object = parsed.data;

  const availabilityChecks = await Promise.all(
    object.domains.map(async (domain) => ({
      domain,
      available: await isDomainAvailable(domain),
    }))
  );

  const availableDomains = availabilityChecks
    .filter((d) => d.available && !swipedDomains.includes(d.domain))
    .map((d) => d.domain);

  return NextResponse.json({ domains: availableDomains });
}
