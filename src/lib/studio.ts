/**
 * Studio facts that appear in more than one place.
 *
 * hvnfstudios.com mail is handled by Google (MX), so this inbox must exist there.
 */
export const STUDIO_EMAIL = "inquiries@hvnfstudios.com";

/**
 * Where the site is actually served, used to build absolute URLs for metadata.
 * Read at build time only (layout metadata), where VERCEL is set on Vercel builds.
 * Vercel serves hvnfstudios.com (apex 308s to www).
 */
export const SITE_URL = process.env.VERCEL
  ? "https://www.hvnfstudios.com"
  : "https://redsn0w1877.github.io/hvnf-studios";
