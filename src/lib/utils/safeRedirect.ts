/**
 * Validates and sanitizes redirect URLs to prevent open redirect attacks.
 * Only allows relative paths (same-origin redirects).
 */
export function getSafeRedirectUrl(url: string | null | undefined, fallback = "/"): string {
  if (!url) return fallback;

  // Must start with single "/" but not "//" (protocol-relative URL)
  if (url.startsWith("/") && !url.startsWith("//")) {
    return url;
  }

  // Reject all other URLs (absolute URLs, protocol-relative, javascript:, etc.)
  return fallback;
}
