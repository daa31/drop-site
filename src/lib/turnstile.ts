const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export function turnstileConfigured() {
  return Boolean(process.env.TURNSTILE_SECRET_KEY);
}

/* Optional Turnstile verification. Returns true when a valid token is provided,
   or when Turnstile is not configured (so the storefront keeps working without
   keys). We never fail-closed on misconfiguration on purpose. */
export async function verifyTurnstile(token: unknown, ip?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;

  if (typeof token !== "string" || !token) return false;

  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, response: token, remoteip: ip }),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
