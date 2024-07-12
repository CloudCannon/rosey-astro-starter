TODO: Put screenshot/video left right of translation workflow here

# Astro Rosey Starter

A starting point for developers looking to build a multilingual website with Astro, Rosey, using Bookshop's component based approach to building and editing sites in CloudCannon.

This starter comes with a translation workflow set up in CloudCannon's CMS with Rosey and Bookshop, to provide UI for non-technical editors and translators to control a site's content and translations.

Rosey is an open source translation workflow for SSGs. We run custom `node fs` scripts in the site's postbuild to generate inputs that a user can enter translations into. Rosey then uses the provided translations to generate a multilingual site.

Create your own copy, and start creating your own components that editors can use in the CloudCannon CMS to build and maintain pages. Add `data-rosey` tags to text content that you want to be included in the translations. Build components with either `.jsx` or `.astro`.

To try to cut down on setup time this starter template also includes some commonly used [features](#features) in CloudCannon.

This template is aimed at helping developers build multilingual sites quickly or referencing how to migrate your existing SSG setup to use this workflow, rather than providing editors with a fully built editable site.
If you are an editor looking for an already built template, have a look at [CloudCannon's templates page](https://cloudcannon.com/templates/).

## How it works

Rosey generates a base.json file wherever it detects a `data-rosey=""` tag in your built site.

From this `base.json` file we run a script that creates a translations file for each locale listed in your `LOCALES` environment variable.

Editors can see an input for each translation in the CloudCannon UI, and can enter a translated value, with links to see the original version highlighted in context on the page.

We then run a script in our postbuild to generate the [locale files that Rosey expects](https://rosey.app/docs/#creating-locale-files) to create our multilingual site from.

Rosey then uses these locales files to generate a multilingual site.

Add locale codes (eg. es, es-es) to the site's environment variables to see a new folder with all of the original site's data-rosey tag mentions, split by page.

You can enter whatever locale code you like, and a version of your site will be built at that URL.

On each translation page, a URL input exists that allows editors to define a translated URL for that page to build at.

Remove the placeholder locales, and delete the corresponding folders in the `rosey/translations` directory, and the corresponding `.json` files in the `rosey/locales` directory.

CloudCannon offers migration services if needed for larger SSG projects wanting help migrating to a new multilingual workflow - get in touch with our [sales team](mailto:sales@cloudcannon.com) if you'd like to discuss this further.

## Why is this useful?

This approach separates your content and your layouts. Change the layout and styling in one place, and have those changes reflected across all the languages you translate to.

You provide an original, and translations, and Rosey does the rest.

Rosey redirects the site visitor to the locale that matches their browser language settings, or if their locale is not supported, directs them to the default version.

### Example

- An editor adds a new left-right block to a page.
- The component could have plenty of other things to set up other than content (eg. style choices) which the editor would have to manually replicate across all languages on the site.
- They have to go to the version of that page in each language in CloudCannon and add the component with the translated content for that language.
- With Rosey, the component is added in the English version, and for each locale we have defined in our environment variables, a translation entry will appear for the new left right content.
- Each page has all of its text copy laid out in a form, with inputs for translations, and links to see the original version highlighted in context on the page.

## Getting Started

- To start using this template, go to the [GitHub repository](https://github.com/CloudCannon/rosey-astro/), and click `Use this template` to make your own copy, copy both branches - `staging` and `main`.
- Build the site on CloudCannon using your `staging` branch.
- Add the environment variable `BASEURL=adjective-noun.cloudvent.net` to the staging site, replacing the placeholder with your staging site's cloudvent.net address.
- On CloudCannon, build another site - your production site - from your main branch.
- On your production site, change the environment variable `TRANSLATE=true`. This should be the only environment variable you need on that site. You can delete the other initially populated ones that belong on staging.
- On the staging site, add the locales you want to translate to to the `LOCALES` environment variable, with each locale separated by a comma eg. `es-es,ko-kr,no-no` or `es,kr,no`.
- Save, let the build finish, and refresh the page
- In translations you can see new folders for the locales you entered. Delete the placeholder ones if not used.
- Enter a translation, save and wait for the build to finish, then publish to your production site.
- Navigate to the adjective-noun.cloudvent.net address for your production site, and see Rosey redirect to your default browser language.
- You should see your entered translation on the page you entered a translation for on your staging site.

## Adding Translations

Add a tag of `data-rosey="example-key"` to an HTML element containing text, with a key for Rosey to use to keep track of that piece of text content.

Tag values need to be unique for Rosey to keep track of what translations go where, so you will need to generate an id as demonstrated in this template. See below for more information.

Once we rebuild the site, we can see inputs for our translations on `staging`. Once we enter a translation, save and wait for the build to finish, we can publish to our `main` branch, and Rosey will our translations to generate a multilingual site for us.

To create your own components that add inputs to our translation files, add a `data-rosey=""` tag, following a format similar to the one provided in the placeholder components.

#### Static id vs dynamic id

We need to make sure for each piece of unique content, we generate a unique id for Rosey.

By default, we use the slugified text content as the data-rosey id.

This ensures that if there are any duplicate entries - they share a key, and if the translation changes all mentions are updated.

At the same time, it means that no keys overlap that aren't meant to.

The downside of this approach is that when the original text changes, it counts as a whole new key and we need to enter a new translation - that is, the old one is not preserved.
For this reason, for larger blocks of text the default approach of using the content itself as an id doesn't work well, so we can instead create a static rosey id. An id independent of the content, meaning it doesn't change when the original text changes, and preserves old translations.
We then run a diff over it to help editors see what was changed on changes to the original.

The challenge for creating these static ids is ensuring they're unique.
We can use the page slug or the index of the component the text is contained in, in combination with some input text to make sure there are no overlaps in ids.

In this starter, all static rosey ids are markdown inputs for simplicity, but the generate scripts could be changed to allow for non-markdown static rosey-ids if needed.

## Environment Variables

The `SYNC_PATHS=/rosey/` environment variable tells CloudCannon to sync the generated data in the `/rosey/` directory from our postbuild back to the source repository. We only want this to happen on staging.

The `TRANSLATE=true` environment variable tells Rosey to generate a site from the data in the locales folder.
Only set this to `true` on the production site.
We also don't run the generate scripts if `TRANSLATE=true`, as the locales we generate the multilingual site from are already in place, meaning we don't need to run it again. It has the added bonus of meaning we only need the one environment variable on our production site.
Setting this to `true` on our staging site will interfere with CloudCannon's UI, and means we can't enter translations, or edit pages.
This is why we need a staging to production publishing workflow.

The `LOCALES=fr-fr,de-de,es-es` tells CloudCannon to generate locale files for language codes 'fr-fr', 'de-de', and 'es-es'.
Set this value to whichever languages you would like to generate with Rosey.
Language codes should follow the placeholder format provided, and are separated by a comma.
Deleting the old placeholder rosey files is left to the developer setting up the site.

The `BASEURL=https://adjective-noun.cloudvent.net/` is used to generate the links to the phrase you are translating, on the staging (untranslated) site.

## Local Development & Testing

To run site locally:

```bash
npm i
npm start
```

To run Rosey locally (handy for debugging):

```bash
npm run build
./.cloudcannon/postbuild
```

If you get a permission error for running the postbuild locally, you can try changing the permissions for that file with:

```bash
chmod u+x ./.cloudcannon/postbuild
```

### Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## Other Features

### Bookshop

[Bookshop](https://cloudcannon.com/documentation/guides/bookshop-astro-guide/) is a component development workflow for static websites.

Build custom components that non-technical editors can use in a page building experience in CloudCannon.

Bookshop is already set up on this project, so that you can start building components straight away.

To add a new component:

1. Create a new folder in `src/components` using the component name as the folder name.
   - Note: If using .mdx snippets, as we are in this template, avoid using kebab-case naming conventions. Use snake_case or camelCase instead.
2. Create two files in this folder
   `src/components/ExampleComponent/ExampleComponent.astro`

```Astro
---
interface Props {
  background_color: string;
  text_color: string;
  text: string;
}

const generateRoseyID = (text: string) => {
  const lowerCaseText = text.toLowerCase();
  const formattedText = lowerCaseText.replaceAll(
    /(?:__[*#])|\[(.*?)\]\(.*?\)/gm,
    /$1/
  );
  return slugify(formattedText, { remove: /[.*,:\/]/g });
};
const generateStaticRoseyId = (text: string) => {
  if (!Astro.url.pathname) {
    return text;
  }
  const pageName =
    Astro.url.pathname === '/'
      ? 'home'
      : Astro.url.pathname?.replace('/index.html', '').replaceAll('/', '');

  const keyNumber = Astro.props.key || '1';
  return `${text}-${pageName}-${keyNumber}`;
};

const block = Astro.props;
---

<section style={`background-color: ${block.background_color}; color: ${block.text_color};`}>
  <div class="container">
    <p data-rosey={generateRoseyID(block.text)}>{block.text}</p>
  </div>
</section>

<style>
  .container {
    max-width: var(--pageContainer);
    margin: 0 auto;
    padding-inline: var(--pagePadding);
  }
</style>
```

---

`src/components/ExampleComponent/ExampleComponent.bookshop.yml`

```yaml
# Metadata about this component, to be used in the CMS
spec:
  structures:
    - content_blocks
  label: Example Component
  description: A short description.
  icon: 'cottage'
  tags:
    - Example

# Defines the structure of this component, as well as the default values
blueprint:
  background_color: '#ffffff'
  text_color: '#000000'
  text: Hello World

# Overrides any fields in the blueprint when viewing this component in the component browser
preview:

# Any extra CloudCannon inputs configuration to apply to the blueprint
_inputs:
```

### Blog & Documentation Pages

Blog section with tags and pagination included.

Documentation, blog and other text heavy sections should replicate how the blog section is implemented in this template.

The blog pages in this template use MDX to allow for snippets. Snippets allow you to use HTML components throughout your markdown text.

A common layout, with changing markdown content is favored for these kinds of text heavy pages, rather than using Bookshop components - which are defined and managed in your markdown pages frontmatter.

These text heavy pages will be edited in CloudCannon's content editor, rather than the visual editor used for building pages with Bookshop components.

For the main page content, rosey ids are statically generated via the page url, so that translations are preserved between changes to the original content, and a diff is shown to help editors update their translations.

### Image Optimization

[Astro `<Image />`](https://docs.astro.build/en/guides/images/#image--astroassets) is used in the two placeholder components in this template.
An Astro `<Image />` will process an image in your src/assets/images folder, and output an optimized image, like below:

```html
<img
  src="/_astro/my_image.hash.webp"
  srcset="
    /_astro/my_image.hash.webp  240w,
    /_astro/my_image.hash.webp  540w,
    /_astro/my_image.hash.webp  720w,
    /_astro/my_image.hash.webp 1600w
  "
  sizes="
    (max-width: 360px) 240px,
    (max-width: 720px) 540px,
    (max-width: 1600px) 720px,
    1600px
  "
  alt="A description of my image."
  width="1600"
  height="900"
  loading="lazy"
  decoding="async" />
```

This template also demonstrates how to set [`uploads` paths](https://cloudcannon.com/documentation/articles/adjusting-the-uploads-path/) on an input level, to allow for both processed and unprocessed images on one site.

On this template, by default, image inputs are opened at `public/images`, meaning they are unprocessed images.

Components that use the Astro <Image /> component are configured so the image source input opens at src/assets/images, which are images to be processed and optimized on build.

### SEO Controls

SEO inputs come set up and configured to allow editors to control SEO on a page-by-page, and sitewide basis.

### Tailwind CSS

Use Tailwind to add utility classes to your HTML, allowing you to style your components without leaving your HTML.
This can be used in combination with normal CSS and SCSS styling, leaving you to add styles to your site however you want.

To remove Tailwind CSS:

1. Remove the following packages from your `package.json`:

```json
"dependencies": {
  "tailwindcss": "^3.3.3",
  "@astrojs/tailwind": "^5.0.0"
}
```

2. Remove mentions of Tailwind from your `astro.config.mjs`

```mjs
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  // ...
  integrations: [tailwind()],
});
```

3. Delete your `tailwind.config.mjs` file.

### Font Awesome Icons

A Font Awesome Icon free icon pack is included, without having to set up your own kit in Font Awesome.

To add more icons:

1. Go to the [Font Awesome icon list](https://fontawesome.com/search?o=r&m=free)
2. Pick a free icon
3. Go to `src/components/utility/icon.jsx`
4. Import the component from `'@fortawesome/free-solid-svg-icons'`, `'@fortawesome/free-regular-svg-icons'`, or `'@fortawesome/free-brands-svg-icons'`, depending on which kind of icon it is. Tip: After entering 'fa' into one of the destructured objects, you should see an autocomplete dropdown list to help you with the correct syntax.
5. Add another if statement following the format the other icons use.
6. Add the name you just used in the conditional of the if statement to `data/icons.json`, which populates the icon dropdown list used for icons in the placeholder components.

To remove Font Awesome Icons:

1. Remove the following packages from your `package.json`:

```json
  "dependencies": {
  "@fortawesome/fontawesome-svg-core": "^6.5.2",
  "@fortawesome/free-brands-svg-icons": "^6.5.2",
  "@fortawesome/free-regular-svg-icons": "^6.5.2",
  "@fortawesome/free-solid-svg-icons": "^6.5.2",
  "@fortawesome/react-fontawesome": "^0.2.0"
  }
```

2. Remove `src/components/utility/icon.jsx`
3. Remove any imports of the icon

```Astro
import Icon from '../utility/icon';
```

4. Remove `icons.json`
5. Remove any select inputs that were using the icon

```yaml
icon:
  type: select
  options:
    values: data.icons
```

6. Remove icons from your defined data in `cloudcannon.config.yml`

```yaml
data_config:
  icons:
    path: data/icons.json
```

### Data files

Demonstrates using data files to:

- Populate select inputs in CloudCannon. This is powerful for allowing editors to make styling changes to the page, within a set design system populated by an editable data file.
- Set sitewide values such as the overall site SEO settings.
- Control header and footer data to allow editors control over navigation.
- Enter translations for text content

### Schemas

Shows how to set up schemas in CloudCannon to allow for non-technical editors to create new pages, with preset frontmatter and content.
Schemas can be define on a collection level, allowing your new blog pages to be different to your new landing pages.
This allows for your text heavy blog/docs pages to be built and edited in the content editor, while your other pages can be built with Bookshop in the visual editor.

### CloudCannon Config

A `cloudcannon.config.yml` file has been provided with some configuration that starts to show what can be done to configure the CMS.

The placeholder Bookshop components show how to configure your components to control inputs and previews in CloudCannon.

### Markdown Styles

Markdown toolbar has all the options supported in the rich text editor, along with stylings to make them work.
See the CloudCannon [Docs](https://cloudcannon.com/documentation/articles/configure-your-rich-text-editors/) for more information.

### CSS Variables

Shows how to set global CSS variables in Astro, to set commonly used values like `pagePadding`, and `pageContainer`.

Extra work could be done to write a `node fs` script to write said values from a data file to the appropriate places in the code, which would then allow editors to control sitewide styles like page max-width and padding.

### Stretch Goals

- If this is workflow is better for a 'component driven' approach to building a website, set up a 'content driven' approach with Alto
  - Content Driven
    - Separate pages by directory eg /es/docs and /docs
    - Use i18n to handle common parts of the site
      - Set this up nicely in the data editor
  - Hybrid?
    - Exclude content heavy pages from the Rosey workflow and set up with a content directory approach
      - Eg. es/docs and docs
    - Tricky parts
      - Where does Rosey build the pages that are using the content dir approach eg. es/es/docs/, or just es/docs
- Handle right aligned languages like jp
- Integrate with smartling/deepl/chatgpt or something similar
- Detect whether a duplicate entry with a translation exists already when creating a new entry
- Translations in the visual editor with Bookshop
  - Have switch input: showTranslationsInVisualEditor
  - A select is hidden/shown depending on the value of showTranslationsInVisualEditor with the values of the env var LOCALES
  - A range of inputs for each locale is hidden/shown depending on the value of showTranslationsInVisualEditor
  - In the component with the translated text
    - If in visual editor && showTranslationsInVisualEditor is true
      - Display the translated input value as the text in the component for whatever locale is selected in the select input
    - Else display the original version
  - In generateTranslationFiles.cjs loop through our pages and see if there are any components with translations in the component front matter, and write that to our translations data files
  - Conversely, we could overwrite component front matter when we get a new translation via the translations data files
  - Could display a tooltip within the fallback that tells the editor to save and wait for build to finish before we see duplicate entries overwritten, and before the component front matter translation and the translation data files are synced up with each other.
