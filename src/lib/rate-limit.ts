// Rate limiter simple en mémoire (adapté aux petites apps)
// En production multi-instance, utiliser Redis à la place

const requests = new Map<string, { count: number; resetAt: number }>();

// Nettoyage périodique des entrées expirées (toutes les 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of requests.entries()) {
    if (value.resetAt < now) requests.delete(key);
  }
}, 5 * 60 * 1000);

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Vérifie si une requête est autorisée selon le rate limit.
 * @param key Identifiant unique (ex: `register:${ip}`, `login:${ip}`)
 * @param limit Nombre max de requêtes
 * @param windowMs Fenêtre de temps en ms
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const entry = requests.get(key);

  if (!entry || entry.resetAt < now) {
    requests.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  entry.count++;

  if (entry.count > limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

/** Retourne une réponse 429 si le rate limit est dépassé */
export function rateLimitResponse(resetAt: number) {
  const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
  return new Response(
    JSON.stringify({ error: "Trop de requêtes. Réessayez dans quelques instants." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
      },
    }
  );
}
