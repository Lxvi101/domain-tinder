export async function isDomainAvailable(domain: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`https://rdap.org/domain/${domain}`, {
      signal: controller.signal,
      headers: { Accept: "application/rdap+json" },
    });
    clearTimeout(timeout);
    if (res.status === 404) return true;
    if (res.ok) return false;
    return false;
  } catch {
    return false;
  }
}
