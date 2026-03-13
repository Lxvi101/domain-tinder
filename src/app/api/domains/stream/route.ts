import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { preferences, swipe } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { google } from "@ai-sdk/google";
import { generateText, jsonSchema, stepCountIs } from "ai";
import { isDomainAvailable } from "@/lib/rdap";

function buildPrompt(opts: {
  topic: string;
  interests: string[];
  tlds: string;
  mode: string;
  swipedDomains: string[];
  likedDomains: string[];
  isForYou: boolean;
}) {
  const { topic, interests, tlds, mode, swipedDomains, likedDomains, isForYou } = opts;

  const modeDesc =
    mode === "bidomainial"
      ? "SHORT domains: 4-8 chars before TLD. Single invented words, clever abbreviations, two-syllable portmanteaus. Like: vercel.com, stripe.com, plaid.com, figma.com"
      : "COMPOUND domains: creative two-word combos, metaphors, descriptive phrases joined together. Like: openai.com, basecamp.com, mailchimp.com, cloudflare.com";

  const interestCtx =
    interests.length > 0 ? `\nUser interests: ${interests.join(", ")}` : "";

  const excludeList =
    swipedDomains.length > 0
      ? `\nDo NOT suggest these already-seen domains: ${swipedDomains.slice(-80).join(", ")}`
      : "";

  if (isForYou) {
    return `The user has previously liked these domains:
${likedDomains.slice(-30).join(", ")}

Analyze the patterns, style, and industries of these liked domains. Generate NEW domain names that match similar vibes, industries, and naming styles.${interestCtx}

Rules:
- Use these TLDs: ${tlds}
- Style: ${modeDesc}
- For EVERY domain idea, call check_domain to verify it's available
- If a domain is taken, try a variation or new name
- Check at least 20 domains total
- Be creative: portmanteaus, metaphors, invented words, verb-based names
- Lowercase only, no spaces, no hyphens, no numbers
- Easy to spell and pronounce${excludeList}`;
  }

  return `Generate creative, brandable domain names for: "${topic}"${interestCtx}

Rules:
- Use these TLDs: ${tlds}
- Style: ${modeDesc}
- For EVERY domain idea, call check_domain to verify it's available
- If a domain is taken, try a variation or new name
- Check at least 20 domains total
- Techniques: portmanteaus, metaphors, modified words, invented words, verb-based, nature/science, domain hacks
- Lowercase only, no spaces, no hyphens, no numbers
- Easy to spell and pronounce
- Avoid generic names like "smartapp.com" or "besttools.io"${excludeList}`;
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await request.json();
  const topic = body.topic || "";
  const isForYou = body.mode === "for-you";

  const userPrefs = await db.query.preferences.findFirst({
    where: eq(preferences.userId, session.user.id),
  });

  const tlds = userPrefs?.tlds || ".com";
  const mode = userPrefs?.mode || "bidomainial";
  const interests = userPrefs?.interests
    ? userPrefs.interests.split(",").filter(Boolean)
    : [];

  const allSwiped = await db.query.swipe.findMany({
    where: eq(swipe.userId, session.user.id),
    columns: { domain: true, direction: true },
  });
  const swipedDomains = allSwiped.map((s) => s.domain);
  const likedDomains = allSwiped
    .filter((s) => s.direction === "right")
    .map((s) => s.domain);

  if (isForYou && likedDomains.length === 0) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: "no-likes" })}\n\n`)
        );
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  const prompt = buildPrompt({
    topic,
    interests,
    tlds,
    mode,
    swipedDomains,
    likedDomains,
    isForYou,
  });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const found: string[] = [];
      const checked = new Set(swipedDomains);

      const send = (data: object) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          // Controller may be closed
        }
      };

      try {
        await generateText({
          model: google("gemini-2.0-flash"),
          system:
            "You are a domain naming consultant. For every domain you think of, you MUST call the check_domain tool. Never suggest a domain without checking first. Generate and check domains one at a time. Keep going until you run out of steps.",
          prompt,
          tools: {
            check_domain: {
              description:
                "Check if a domain name is available for registration. You must call this for every domain idea.",
              inputSchema: jsonSchema<{ domain: string }>({
                type: "object",
                properties: {
                  domain: {
                    type: "string",
                    description: "Full domain name, e.g. example.com",
                  },
                },
                required: ["domain"],
              }),
              execute: async ({ domain }) => {
                const normalized = domain.toLowerCase().trim();

                if (checked.has(normalized)) {
                  return {
                    domain: normalized,
                    available: false,
                    reason: "already checked",
                  };
                }
                checked.add(normalized);

                const available = await isDomainAvailable(normalized);

                if (available) {
                  found.push(normalized);
                  send({ domain: normalized });
                }

                return {
                  domain: normalized,
                  available,
                  found_so_far: found.length,
                };
              },
            },
          },
          stopWhen: stepCountIs(30),
          abortSignal: request.signal,
        });
      } catch (e) {
        if (!request.signal?.aborted) {
          send({ error: "generation-failed" });
        }
      } finally {
        try {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch {
          // Already closed
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
