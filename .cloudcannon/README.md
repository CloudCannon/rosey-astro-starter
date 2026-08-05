# Welcome

This site is published in three languages — **English**, **French** and **German**.
English is the source: you write a page once in English, then translate it into the
other two. Visitors get a language picker (EN / FR / DE) in the site header.

## Quick links

- [Pages](cloudcannon:collections/pages) — home, about, and the blog listing page
- [Blog](cloudcannon:collections/blog) — English posts
- [Blog (Français)](cloudcannon:collections/blog_fr) · [Blog (Deutsch)](cloudcannon:collections/blog_de) — translated posts
- [Data](cloudcannon:collections/data) — navigation, site details, tags
- [Locales](cloudcannon:collections/locales) — every translation in one list

## Editing pages

Pages are edited visually — click any text on the page and type. Each page is
built from blocks you add and reorder in the sidebar:

- **Hero** — a large heading, subheading, image and button at the top of a page
- **Left Right** — a heading and text beside an image, with an optional button
- **Text Block** — a heading and a block of text

Every page also has a **Search engine optimization** section for its description,
social sharing image and similar settings. Anything you leave blank falls back to
the site defaults in [site.json](cloudcannon:collections/data/site.json).

To add a page, use **+ Add** in the Pages collection and pick a type: a normal
**New Page**, a **Paginated collection** for a list that splits across numbered
pages, or a **Source Editable Page**. A brand-new page shows the home page as a
stand-in preview until you save it — that's expected, and the preview corrects
itself once your page exists.

## Translating a page

Open a page in the visual editor. A round **translate button** floats in the
bottom corner of the preview, with a small arrow showing it opens a menu. Click it
and choose a language:

- **Original** — the English page
- **FR** / **DE** — the French or German version

Pick a language and every translatable piece of text on the page becomes an editor
for that language. Type over it and your translation saves to that language. The
badge on the top-right of the button shows which language you're looking at, and
you can drag the button out of the way if it covers something.

Three things to know:

- **Only text is translated.** Images, dates, layout and the order of blocks are
  shared by all three languages. To change any of those, switch back to Original.
- **The sidebar fields always edit English**, whichever language you're previewing.
- **Some text isn't on the page**, so it can't be clicked — the browser tab title
  and the description search engines show. Those live in
  [Locales](cloudcannon:collections/locales), described below.

## Keeping translations up to date

When English text is edited after it has been translated, the translations of it
are marked **out of date** — they still say the old thing, so someone needs to
look at them.

You'll see:

- a **grey and yellow dashed outline** around the affected text on the page
- a **count** on the bottom-left of the translate button
- a line reading **"N translations out of date"** under the language in the menu

Click that line to open the review panel. For each item you can:

- **click the text** to jump straight to it on the page
- **expand the arrow** to see exactly what changed in the English — added words are
  highlighted, removed words struck through
- **tick it** to mark it as reviewed, if the English change doesn't affect the
  translation (a typo fix, say)

**Mark all as reviewed** at the bottom clears the whole list at once. Editing a
translation clears its own flag automatically, so a translation you actually
rewrite never needs ticking.

## Blog posts

A whole article is too much to translate by typing over it on the page, so each
language has its own copy of every post:

- [Blog](cloudcannon:collections/blog) — write and add posts here, in English
- [Blog (Français)](cloudcannon:collections/blog_fr) and [Blog (Deutsch)](cloudcannon:collections/blog_de) — the
  translated copies

Add new posts in **Blog** only. The French and German collections mirror the same
posts, so you edit the existing copies there rather than adding or deleting. Posts
can be edited in either the content editor or the visual editor.

Posts have **no translate button** — that's deliberate. A post is translated by
opening its French or German copy and editing it directly, so there's no language
to switch to on the page itself.

### The blog listing page

The [blog listing page](cloudcannon:collections/pages) does have a translate button,
but it only changes some of what you see. Switch it to French and the page's own
text translates — the "Blog" heading and the tag names — while the **post titles
below stay in English**.

That's expected. Those titles come from the French copies of the posts, which
aren't part of this page, so the translate button can't reach them. Translate a
post title by opening it in [Blog (Français)](cloudcannon:collections/blog_fr) or
[Blog (Deutsch)](cloudcannon:collections/blog_de).

To see how the listing really looks in French, open the published site and use the
**EN / FR / DE** picker in the header. There's no French version of this page to
open in CloudCannon — the French listing is built automatically from the English
one plus your translations, so there's nothing on it to edit directly.

Each post has a title, hero image, date, author, thumbnail and tags. Tags come from
a fixed list — to add a new one, edit [tags.json](cloudcannon:collections/data/tags.json)
first, then pick it on the post. Pick the same tags on the French and German copies
as the English one.

### Tag names

Each tag has its own page listing the posts using it, in all three languages.
The tag **name** is translated, but the **web address stays English** — a French
visitor sees "Développement" on a page at `/fr/tags/building/`. That's deliberate,
so links keep working in every language.

Tag names aren't typed on the page — translate them in
[Locales](cloudcannon:collections/locales), where they're grouped under `tags`.
Translate a tag once and it updates everywhere it appears.

## Site-wide content

The [Data](cloudcannon:collections/data) collection holds the parts that appear on
every page:

- **navigation.json** — header and footer menus, logos, and the copyright line
  (the year is added automatically)
- **site.json** — the site title, description, default author, and the image used
  when pages are shared on social media
- **tags.json** — the list of tags blog posts can use

Header, footer and menu text is translated the same way as page text: switch
language using the translate button and edit it in place.

## All translations in one place

[Locales](cloudcannon:collections/locales) lists every translated piece of text for
French and German, with the English original shown beside it for reference. It's
the quickest way to work through a batch of translations, or to find one you can't
locate on a page. Editing here is exactly the same as editing on the page — the two
stay in step.

A few things can **only** be translated here, because they don't appear on the page:

- `page_title` — the text in the browser tab and as the search-result heading
- `page_description` — the summary search engines show
- `tags` — tag names, wherever they appear
- `tag_page_titles` — the browser tab title for each tag's page

Names are grouped by where they belong, so `about:page_title` is the About page's
tab title. If one shows as out of date, the English was edited since it was last
translated — the review panel works the same as it does on the page.

## Publishing

Save your changes as normal. The site rebuilds, and your English edits and
translations go live together at their `/en/`, `/fr/` and `/de/` addresses.
