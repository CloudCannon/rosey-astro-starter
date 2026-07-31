// Central map of split-by-directory locales. Add a locale here and create the
// matching content collection (blog_<code>) + register it in content.config.ts.
export const defaultLocale = "en";

export const locales = {
  fr: { blogCollection: "blog_fr", dateLocale: "fr-FR", label: "FR" },
  de: { blogCollection: "blog_de", dateLocale: "de-DE", label: "DE" },
} as const;

export type Locale = keyof typeof locales;

export const localeCodes = Object.keys(locales) as Locale[];

export function isLocale(value: string | undefined): value is Locale {
  return !!value && value in locales;
}

// Blog collection name for a locale ("blog" for the default language).
export function blogCollectionFor(locale?: string): "blog" | "blog_fr" | "blog_de" {
  return isLocale(locale) ? locales[locale].blogCollection : "blog";
}

// Intl date-formatting locale string.
export function dateLocaleFor(locale?: string): string {
  return isLocale(locale) ? locales[locale].dateLocale : "en-US";
}

// Prefix an in-site path with the locale segment (no prefix for the default).
export function localizePath(path: string, locale?: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return isLocale(locale) ? `/${locale}${clean}` : clean;
}
