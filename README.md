# Rosey Astro Starter

A multilingual starter template for building an Astro site with [CloudCannon](https://cloudcannon.com/). The site is written in English and translated into French and German with [Rosey](https://rosey.app/), with translations edited inline in the Visual Editor via the [Rosey CloudCannon Connector](https://github.com/CloudCannon/rcc).

See a [demo site](https://deluxe-gel.cloudvent.net/).

## Features

- Multilingual (English, French, German) with [Rosey](https://rosey.app/) and the [Rosey CloudCannon Connector](https://github.com/CloudCannon/rcc)
- Inline translation editing, with split-by-directory collections for content that differs per language
- Visual editing with [Editable Regions](https://cloudcannon.com/documentation/developer-guides/set-up-visual-editing/an-overview-of-editable-regions/) (text, image, array, source, and component regions)
- Page building with reusable components
- Blog with pagination and tags
- [Tailwind CSS v4](https://tailwindcss.com/) with CSS-first configuration
- SEO controls, including translated page titles and descriptions
- Pagefind search

## Getting Started

Click `Use this template` to make your own copy of the repository.

### Local Development

1. Clone the repository to your local machine.

2. Start the development server.

```bash
npm install
npm run dev
```

## CloudCannon Setup

This site is pre-configured for CloudCannon. Connect your repository and CloudCannon will detect the configuration in `.cloudcannon/initial-site-settings.json` and build your site automatically. The editing experience is defined in `cloudcannon.config.yml`, which you can modify to control your editors' experience.

### Editable Regions

This starter demonstrates several types of Editable Region:

- **Text** (`data-editable="text"`) for editing front matter text values inline
- **Image** (`data-editable="image"`) for editing front matter image values
- **Array** (`data-editable="array"`) for page-building with reorderable content blocks
- **Source** (`data-editable="source"`) for making standalone `.astro` pages editable
- **Component** (`<editable-component>`) for live re-rendering of Astro components

Components that need live re-rendering are registered in `src/scripts/register-components.ts` and loaded conditionally when the site is open in CloudCannon's Visual Editor.

#### Source Editables

The About page (`src/content/pages/about.astro`) demonstrates **source editables** — a pattern where content lives directly in an Astro template rather than in Markdown front matter. Source editable regions use `data-editable="source"`, `data-path="path/to/file.astro"`, and `data-key` attributes. CloudCannon writes changes straight back to the `.astro` file.

This is useful for standalone pages (like About or Contact) where a developer wants full control over the markup while still giving editors visual editing access — **and where page building with components is *not* desired**. No accompanying Markdown file or front matter schema is needed. A thin routing wrapper in `src/pages/about.astro` handles Astro's file-based routing.

### Components

Three page-building components are included:

- **Hero** — heading, subheading, image, and optional button
- **LeftRight** — side-by-side text and image, with optional flip and button
- **TextBlock** — heading and rich text content

### Content

- **Pages** are in `src/content/pages/` as Markdown with structured front matter, and support a component-based page-building workflow. Developers can also add standalone pages paired with a routing file in `src/pages/` (like `src/content/pages/about.astro`), and decide which parts of those pages are editable in CloudCannon.
- **Blog posts** are in `src/content/blog/` as MDX files
- **Data** files (site settings, navigation) are in `data/`

## Multilingual

The site is built in English, then [Rosey](https://rosey.app/) produces the French and German copies after the Astro build. Every language is served under a prefix — `/en/`, `/fr/`, `/de/` — and `/` is a redirect page Rosey generates.

The pipeline lives in `.cloudcannon/postbuild`: Pagefind, then `rosey generate` (scans the built HTML for translation keys into `rosey/base.json`), then `write-locales` (syncs those keys into `rosey/locales/*.json`), then `rosey build` (writes the translated site).

**CloudCannon requires `CLOUDCANNON_SYNC_PATHS=/rosey/`** so the files generated during the build are committed back to the repo. It's preset in `.cloudcannon/initial-site-settings.json` for new sites; existing sites need it added in their site settings. Without it, translations are lost on every build.

### Two ways content gets translated

| | Used for | Edited in |
| --- | --- | --- |
| **Rosey keys** (`data-rosey`) | Shared UI, headings, nav, footer, page titles/descriptions | `rosey/locales/*.json` — via the visual editor or the Locales collection |
| **Split-by-directory collections** | Blog post bodies, where a whole article differs per language | `src/content/blog_fr/`, `blog_de/` — ordinary content files |

Locale config is centralised in `src/utils/locales.ts` (collection name, date locale, display label per language). `localizePath()` prefixes in-site links.

Split-by-directory pages set `data-rosey-root` to the **English-equivalent** path via a `roseyRoot` prop, so `/fr/blog/x/` shares keys with `/blog/x/` rather than creating `fr/`-prefixed duplicates.

They also pass `hideLocaleSwitcher`, which sets `data-rcc-exclude` to every locale on the snapshot boundary so the RCC skips its locale switcher. Post bodies carry no Rosey keys, so switching locale in the Visual Editor would offer nothing to translate and read as a bug. It's set in `Post.astro` so both the default-language and locale post routes are covered.

### Mixed pages

The blog listing keeps its switcher, because half of it *is* Rosey-keyed. Switching locale in the Visual Editor translates the `blog:title` heading and the tag chips, but leaves post titles in the default language — the switcher is a client-side swap of `[data-rosey]` elements, and those titles come from `blog_<locale>` files that were never part of this page's build.

That's the expected split, and adding a key to the title would make it worse: `/en/blog/` and `/fr/blog/` are both natively built, so one key is captured from both, collapses to a single entry keeping the default-language original, and Rosey then overwrites the correct titles on `/fr/blog/`.

`/fr/blog/` is a real Astro route, not a Rosey-generated page — it appears in `rosey/base.urls.json`, which is produced by scanning the Astro output *before* `rosey build` runs. It has no source file of its own, though: its heading and head text come from the English `pages/blog.md` entry plus Rosey keys, which is why that route passes `roseySeo`. Nothing on it is editable in CloudCannon directly.

### Head/SEO text

Rosey scans `<head>`, but untagged head text is copied to translated pages unchanged. `Layout.astro` takes a `roseySeo` prop that keys `<title>` and the meta description as `{roseyRoot}:page_title` / `:page_description`. Routes serving many pages from one template pass `roseyTitleKey` / `roseyDescriptionKey` explicitly instead.

It's opt-in per page on purpose: split-by-directory post pages must **not** have head keys, since their titles already come from translated frontmatter and a Rosey value would override it.

Head text isn't on the page, so it can't be edited inline — it's only reachable through the Locales collection.

### Tags

Tag **slugs** stay English because they're the URL (`/fr/tags/markdown/`); only the **label** is translated, under a shared `tags:<slug>` key so each label is translated once for every chip and heading that uses it. `src/pages/[locale]/tags/[tag]/[...page].astro` builds tag pages per language so each lists that language's posts.

### Adding a language

1. Add the code to `locales` in `src/utils/locales.ts`
2. Create `src/content/blog_<code>/`, mirroring `src/content/blog/`
3. Register the collection in `src/content.config.ts`
4. In `cloudcannon.config.yml`: add a `blog_<code>` collection with `url: '/<code>/blog/[full_slug]/'`, a `data_config.locales_<code>` entry, and the collection to `collection_groups`
5. Add the code to `--locales` in `.cloudcannon/postbuild`

## Project Structure

```
├── .cloudcannon/          # CloudCannon schemas, postbuild, editor guide
├── cloudcannon.config.yml # CloudCannon configuration
├── data/                  # Site-wide data files
├── public/                # Static assets
├── rosey/                 # Translation keys (base.json) and locale files
└── src/
    ├── components/        # Astro components
    ├── content/           # Content collections (pages, blog, blog_fr, blog_de)
    ├── layouts/           # Page layouts
    ├── pages/             # Astro page routes ([locale]/ for translated content)
    ├── scripts/           # Component registration for visual editing
    ├── styles/            # Global CSS (Tailwind v4)
    └── utils/             # Locale configuration
```
