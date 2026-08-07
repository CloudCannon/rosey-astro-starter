// Tag slugs stay lowercase because they're the URL, so the visible label is
// derived from the slug. Acronyms need an override — capitalising "seo" gives
// "Seo". Changing a label here changes its Rosey original, which marks the
// existing translations as needing review.
const labelOverrides: Record<string, string> = {
  seo: "SEO",
};

export function tagLabel(tag: string): string {
  return labelOverrides[tag] ?? tag.charAt(0).toUpperCase() + tag.slice(1);
}
