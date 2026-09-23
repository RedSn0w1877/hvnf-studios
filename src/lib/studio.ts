/**
 * Studio facts that appear in more than one place.
 *
 * The address is live the moment hvnfstudios.com is bought and mail is pointed at
 * it; until then the mailto opens a draft that will bounce, so buy the domain
 * before pushing this site anywhere a client will see it.
 */
export const STUDIO_EMAIL = "inquiries@hvnfstudios.com";

/**
 * Where the site is actually served, used to build absolute URLs for metadata.
 * Read at build time only (layout metadata), where VERCEL is set on Vercel builds.
 * Swap the Vercel value to https://hvnfstudios.com once that domain points here.
 */
export const SITE_URL = process.env.VERCEL
  ? "https://redsn0w.xyz"
  : "https://redsn0w1877.github.io/hvnf-studios";
