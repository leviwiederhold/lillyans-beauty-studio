export function getSafeNextPath(nextParam: string | null | undefined, fallback = "/account") {
  if (!nextParam) return fallback;

  let value = nextParam.trim();
  try {
    value = decodeURIComponent(value);
  } catch {
    return fallback;
  }

  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\") || /[\u0000-\u001F\u007F]/.test(value)) {
    return fallback;
  }

  try {
    const parsed = new URL(value, "https://lillyansbeautystudio.local");
    if (parsed.origin !== "https://lillyansbeautystudio.local") return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

export function getSiteUrl(origin?: string) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  return (configured || origin || "http://localhost:3000").replace(/\/$/, "");
}

export function getAuthCallbackUrl(nextPath: string, origin?: string) {
  return `${getSiteUrl(origin)}/auth/callback?next=${getSafeNextPath(nextPath)}`;
}
