# Astro Rosey Starter

If you're looking for some help getting a multilingual site up and running in Astro using CloudCannon's CMS, get in touch with our [sales team](mailto:sales@cloudcannon.com) - we offer migrations starting from $500, depending on the size of the site. Otherwise feel free to use this starter to get your own translation workflow up and running in CloudCannon.

TODO: Put screenshot here of translation workflow here
TODO: How to add your own Rosey tags to new components
TODO: What if there multiple uses of the same phrase/word
TODO: How blog and other long form text differs from component text and how to add other namespaces like blog using docs as an example

Notes
This is best used if you don't want the layout to change between languages - if you want to control the layout unique to each locale, use the split by directory approach.
Why Rosey is useful compared to the standard split-by-dir approach:
Consider an editor adds a new left right to a page.
They have to go to the version of that page in each language in CC and add the component with content unique to that language.
The component could have a bunch of other things to set up other than content (stylings etc.) which the editor would have to manually replicate across all languages on the site.
With Rosey the component is added in the english version, and for each locale we have defined in our env variables, a translation file will appear for the new left right content.
Each page has all of its text copy laid out in a form, with inputs for translations, and links to see the original version highlighted in context on the page.

Note: Not tested with another 'main' lang other than english
Not tested with an integration (yet)

A starting point for developers looking to build a multilingual website with Astro, Rosey, and Bookshop components in CloudCannon.

Create your own copy, and start creating your own components to use in the CloudCannon CMS. Build components with `.jsx` or `.astro`.

To try to cut down on setup time this starter template includes some commonly used [features](#features) in CloudCannon.

This template is aimed at helping developers build sites quickly, rather than providing editors with a fully built editable site.
If you are an editor looking for an already built template, have a look at [CloudCannon's templates page](https://cloudcannon.com/templates/).

This template uses [Rosey](https://rosey.app/) to generate a multilingual site from an English version of the site, and some translation files. Editors can enter translations manually for different languages, all in one place.

Rosey generates a base.json file wherever it detects a `data-rosey=""` tag in your built site.
From this `base.json` file we run a script that creates a translations file for each locale listed in your `LOCALES` environment variable.
Editors can see an input for each translation in the CloudCannon UI, and can enter a translated value.
We then run a script in our postbuild to generate the [locales files that Rosey expects](https://rosey.app/docs/#creating-locale-files) to create our multilingual site from.
Rosey then uses these locales files, to generate a multilingual site.

## Getting Started

- To start using this template, go to the [GitHub repository](https://github.com/CloudCannon/rosey-astro/), and click `Use this template` to make your own copy.
- Build the site on CloudCannon.
- Create a staging site, with the environment variable `TRANSLATE=false`
- Create a production site, with the environment variable `TRANSLATE=false`
- Add the locales you want to translate to to the `LOCALES` environment variable, following the format `es-es`, with each locale separated by a comma.
- Add the environment variable `SYNC_PATHS=/rosey/` to the staging site.
- Enter a translation, wait for the build to finish, and publish to your production site.
- Navigate to the adjective-noun.cloudvent.net address for your production site, and see Rosey redirect to your default browser language.

## Adding Translations

When you add a new component using the placeholder `Hero`, or `LeftRight` components, an entry is added to our translations files to allow an editor to provide a translation.
Once our build finishes, we can publish our translations on `staging` to our `main` branch, and Rosey will use them to generate a multilingual site for us.
To create your own components that add inputs to our translation files, add a `data-rosey=""` tag following the format provided in the placeholder components.

## Environment Variables

The `SYNC_PATHS=/rosey/` environment variable tells CloudCannon to sync the generated data in the `/rosey/` directory from our postbuild back to the source repository.

The `TRANSLATE=true` environment variable tells Rosey to generate a site from the data in the locales folder.
Only set this to `true` on the production site.
Setting this to `true` on our staging site will interfere with CloudCannon's UI, and mean we can't enter translations, or edit pages.

The `LOCALES=fr-fr,de-de,es-es` tells CloudCannon to generate locale files for language codes 'fr-fr', 'de-de', and 'es-es'.
Set this value to whichever languages you would like to generate with Rosey.
Language codes should follow the placeholder format provided, and are separated by a comma.

The `BASEURL=https://adjective-noun.cloudvent.net/` is used to generate locations of the phrase you are translating.
This would usually be set to our staging site's preview URL, although extra logic could be added to send you to the translated version (main/production site's preview URL) instead.

## Local Development & Testing

To run site locally:

```bash
npm i
npm start
```

To run Rosey locally:

```bash
hugo
npx rosey generate --source public
node utils/generateTranslationFiles.js
node utils/generateLocales.js
```

To generate a multilingual site locally, run this after running the above commands:

```bash
npx rosey build --source public --dest public_translated
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

### Local Development

1. Clone the repository
2. Run `npm install`
3. Run `npm start`

## Features

### Rosey

This template uses Rosey to create a multilingual site.

To get Rosey to work in CloudCannon, follow the following steps:

- Create a staging site, with the environment variable `TRANSLATE=false`
- Create a production site, with the environment variable `TRANSLATE=false`
- Add the locales you want to translate to to the `LOCALES` environment variable, following the format `es-es`, with each locale separated by a comma.
- Add the environment variable `SYNC_PATHS=/rosey/` to the staging site.
- Enter a translation, wait for the build to finish, and publish to your production site.
- Navigate to the adjective-noun.cloudvent.net address for your production site, and see Rosey redirect to your default browser language.

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
}

const block = Astro.props;
---

<section style={`background-color: ${block.background_color}; color: ${block.text_color};`}>
  <div class="container">
    Replace me
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

### Coming Soon

- Scheduling blog posts for a future date
- Editor links to colors data file
- Writing CSS vars (padding, page max-width, etc.) through an editable data file
