const NON_SLUG_CHARS = /[^\w\s-]/g;
const WHITESPACE = /[\s_]+/g;
const EDGE_HYPHENS = /^-+|-+$/g;

export function slugify(value: string, maxLength = 48): string {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(NON_SLUG_CHARS, "")
    .replace(WHITESPACE, "-")
    .replace(EDGE_HYPHENS, "")
    .slice(0, maxLength);

  return slug.length > 0 ? slug : "org";
}

export function withSlugSuffix(base: string, suffix: string, maxLength = 60): string {
  const room = Math.max(1, maxLength - suffix.length - 1);
  return `${base.slice(0, room)}-${suffix}`;
}
