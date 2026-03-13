import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { preferences, swipe } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { createDeepInfra } from "@ai-sdk/deepinfra";
import { generateText } from "ai";
import { z } from "zod";
import { isDomainAvailable } from "@/lib/rdap";

const BATCH_SIZE = 15;
const MAX_ROUNDS = 5;
const TARGET_DOMAINS = 15;

function buildPrompt(opts: {
  topic: string;
  interests: string[];
  tlds: string;
  mode: string;
  exclude: string[];
  likedDomains: string[];
  isForYou: boolean;
  round: number;
}) {
  const { topic, interests, tlds, mode, exclude, likedDomains, isForYou, round } = opts;

  const modeDesc =
    mode === "bidomainial"
      ? "SHORT domains: 4-8 chars. Single invented words, abbreviations, portmanteaus. Like: vercel.com, stripe.com, figma.com"
      : "COMPOUND domains: two-word combos, metaphors, joined phrases. Like: openai.com, basecamp.com, mailchimp.com";

  const interestCtx =
    interests.length > 0 ? `\nInterests: ${interests.join(", ")}` : "";

  const excludeStr =
    exclude.length > 0 ? `\nEXCLUDE these: ${exclude.join(", ")}` : "";

  const roundHint =
    round > 0
      ? `\nThis is round ${round + 1}. Previous suggestions were taken. Try MORE creative/unusual names.`
      : "";

  if (isForYou) {
    return `Generate ${BATCH_SIZE} brandable domain names inspired by these liked domains:
${likedDomains.slice(-20).join(", ")}${interestCtx}

TLDs: ${tlds} | Style: ${modeDesc}${roundHint}
Lowercase, no hyphens, no numbers. Be creative.${excludeStr}
Return ONLY: {"domains": ["domain1.com", ...]}`;
  }

  return `Generate ${BATCH_SIZE} brandable domain names for: "${topic}"${interestCtx}

TLDs: ${tlds} | Style: ${modeDesc}${roundHint}
Techniques: portmanteaus, metaphors, invented words, domain hacks.
Lowercase, no hyphens, no numbers.${excludeStr}
Return ONLY: {"domains": ["domain1.com", ...]}`;
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
      headers: sseHeaders(),
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const found: string[] = [];
      const allChecked = new Set(swipedDomains);

      const send = (data: object) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          // closed
        }
      };

      const deepinfra = createDeepInfra({
        apiKey: process.env.DEEPINFRA_API_KEY,
      });

      try {
        for (let round = 0; round < MAX_ROUNDS; round++) {
          if (request.signal?.aborted) break;
          if (found.length >= TARGET_DOMAINS) break;

          // Generate a batch of domain names
          const prompt = buildPrompt({
            topic,
            interests,
            tlds,
            mode,
            exclude: [...allChecked].slice(-60),
            likedDomains,
            isForYou,
            round,
          });

          const { text } = await generateText({
            model: deepinfra("nvidia/NVIDIA-Nemotron-3-Super-120B-A12B"),
            prompt,
            abortSignal: request.signal,
          });

          // Parse domains from response
          const trimmed = text.trim();
          const jsonStr =
            trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)?.[1] ?? trimmed;

          let domains: string[] = [];
          try {
            const parsed = z
              .object({ domains: z.array(z.string()) })
              .safeParse(JSON.parse(jsonStr));
            if (parsed.success) {
              domains = parsed.data.domains;
            }
          } catch {
            continue; // Bad response, try another round
          }

          // Filter out already-checked domains
          const fresh = domains
            .map((d) => d.toLowerCase().trim())
            .filter((d) => !allChecked.has(d) && d.includes("."));

          for (const d of fresh) allChecked.add(d);

          if (fresh.length === 0) continue;

          // Check ALL domains in parallel (fast!)
          const results = await Promise.all(
            fresh.map(async (domain) => ({
              domain,
              available: await isDomainAvailable(domain),
            }))
          );

          // Stream available ones immediately
          for (const r of results) {
            if (r.available) {
              found.push(r.domain);
              send({ domain: r.domain });
            }
          }
        }
      } catch (e) {
        if (!request.signal?.aborted) {
          send({ error: "generation-failed" });
        }
      } finally {
        try {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch {
          // closed
        }
      }
    },
  });

  return new Response(stream, {
    headers: sseHeaders(),
  });
}

function sseHeaders() {
  return {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  };
}
