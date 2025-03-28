# Astro Rosey Starter

This is a good starting point for a developer looking to build a translation workflow for non-technical editors using CloudCannon's CMS.

Rosey is used to generate a multilingual site, complete with browser settings detection with a redirect to the site visitor's default language. 

To generate the multilingual site:

  1. Html elements are tagged for translation.

  2. Rosey creates a JSON file from these tags by scanning your built static site.

  3. Rosey takes a different `locales/xx-XX.json` file, which contains the original phrase with a user entered translation and generates the finished translated site.

What the RCC connector does is create a way for non-technical editors to create these `locales/xx-XX.json` files needed to generate the site. YAML files are generated with the correct configuration to enable translations via an interface in CloudCannon's CMS, rather than writing JSON by hand. All of this happens in your site's postbuild, meaning it automatically happens each build. The file generation happens on your staging site, while the multilingual site generation takes place on your production (main) site.

## YouTube overview and setup instructions

[![Easily manage your multilingual Astro site in CloudCannon](https://img.youtube.com/vi/u5WittUT3Ts/0.jpg)](https://www.youtube.com/watch?v=u5WittUT3Ts)

## Requirements

- A CloudCannon organisation with access to [publishing workflows](https://cloudcannon.com)
- A static site

## Why is this useful?

A traditional easier-to-understand approach would be to maintain separate copies of each page for each language. This would mean creating a directory for each language, with content pages for each. This is sometimes referred to as split-by-directory. While it is easy to understand, and debug, it can become tedious to have to replicate any non-text changes across all the separate copies of your languages.

This approach has you maintain one copy of a page. Inputs are generated for all the text content that is tagged for translation, meaning editors can focus on providing just the translations instead of replicating all changes made to a page. It basically separates your content and your layouts - a concept well established in the SSG (and CMS) world. You can change the layout and styling in one place, and have those changes reflected across all the languages you translate to.

## Getting started

1. Make a copy of this repo on your own GitHub, by clicking `Use as template`.

2. Create a new branch on this repo called `staging`.

3. Create a site each for both branches on CloudCannon.

4. Add `main` as the publishing branch for the `staging` site.

5. To your staging site:

    a. Add the env variable `SYNC_PATHS`, with the value `/rosey/`.

    b. If you have a Smartling account set up for automatic translations, add the env variable `DEV_USER_SECRET`. Add your Smartling API key as the value of `DEV_USER_SECRET`.

6. To your production site, add the env variable `ROSEYPROD` with a value of `true`.

7. In your `rosey/config.yml` change the language code in the `locales` array to one that you want, and add your staging cloudvent url to the `base_url` key.

8. To add automatic AI-powered translations - which your editors can then QA - enable Smartling in your `rosey/config.yaml` file, by setting `smartling_enabled: true`. Make sure to fill in your `dev_project_id`, and `dev_user_identifier`, with the credentials in your Smartling account. Ensure you have added you secret API key to your environment variables in CloudCannon, as `DEV_USER_SECRET`. You can set this locally in a `.env` file if you want to test it in your development environment. 

    > [!IMPORTANT]
    > Make sure to not push any secret API keys to your source control. The `.env` file should already be in your .gitignore.

    > [!IMPORTANT]
    > **Be aware these translations have some cost involved**, so make sure you understand the pricing around Smartling machine-translations before enabling this. 

## Adding this to an existing site
Follow the instructions on [this repository](https://github.com/CloudCannon/rcc?tab=readme-ov-file#getting-started).

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


## Config file
Your `astro.config.mjs` should have the following configuration, or add this to yours.

```javascript
import mdx from "@astrojs/mdx";
import { autoAddRoseyTags } from "./rosey-connector/ssgs/astroMarkdownTaggerPlugin.ts";

// https://astro.build/config
export default defineConfig({
  site: "https://adjective-noun.cloudvent.net/", // Replace this with your own
  integrations: [bookshop(), mdx()],
  markdown: {
    rehypePlugins: [autoAddRoseyTags],
    remarkRehype: {
      // https://github.com/syntax-tree/mdast-util-to-hast?tab=readme-ov-file#options
      handlers: {
        mdxJsxTextElement(state, node) {
          return {
            type: "element",
            tagName: node.name,
            properties: {},
            children: state.all(node),
          };
        },
      },
    },
  },
});
```

MDX allows you to use components throughout your markdown content, to allow for more complex things than traditional markdown syntax can represent. Bookshop handles the import of all Bookshop components into each file, to allow for any configured [snippets](https://cloudcannon.com/documentation/articles/snippets-using-mdx-components/) to be added to the page. 

A rehype plugin has been provided to automatically tag block level markdown elements for translation. A handler has been added so that our plugin's AST parser knows what to do with any JSX elements it comes across in our mdx content.

## Markdown processing
The `./rosey-connector/ssgs/astroMarkdownTaggerPlugin.ts` plugin is used to extend Astro's parsing of markdown content into HTML. As the name suggests, it tags block level content in your markdown. This means you don't need to manually tag any content that will be processed as part of your page's body content - it should happen as part of the build. 

## Markdown Component
Sometimes a component needs to contain markdown content. A `type: markdown` input in CloudCannon will allow an editor to add markdown as a component's content. 

Some SSGs come with a `markdownify` filter out of the box that processes content from markdown to html. In such an SSG we would simply add this filter to the templating our component. In Astro, we need to roll our own with one of the many markdown processing libraries out there. A component has been provided `rosey-connector/ssgs/astroMarkdownComponent.astro` to add wherever you need to parse markdown that isn't going to be automatically parsed by Astro. 

Drag it into your project's components folder, and update the import `import { generateRoseyMarkdownID } from "../helpers/component-helper";` to reflect it's new relative address. It can then be used throughout your components and layouts like:
  
  ```jsx
  <div class="mb-4" style={`color: ${block.text.color};`}>
    <Markdown content={block.text.markdown_content} />
  </div>
  ```

You can style the content like:

  ```css
  .markdown-text h1 {
    font-size: 3rem;
    line-height: 3rem;
  }
  .markdown-text h2 {
    font-size: 2.5rem;
    line-height: 2.5rem;
  }
  ```

## Generating ids

When tagging content for translation, the slugified contents of that translation should be used as the `data-rosey` id.

A helper function has been provided. Add this to the top of your component, or layout, adjusting the import address as needed.

  ```js
  import { generateRoseyId } from "../../../rosey-connector/helpers/component-helper.js";
  ```

Add it to your html templating like:

  ```jsx
  <h1
    class="heading"
    data-rosey={generateRoseyId(block.heading.heading_text)}>
    {block.heading.heading_text}
  </h1>
  ```

## Pulling the rosey-connector from upstream repository

To add a single folder as an upstream dependency, we can use a git subtree.

[Using this as a guide:](https://gist.github.com/tswaters/542ba147a07904b1f3f5)

### Initial setup

Initial setup of fetching the `rosey-connector` directory from https://github.com/CloudCannon/rcc, for use in a downstream repository. This allows us to maintain the RCC logic in one place.

```bash
# Add remote to upstream repo, create new tracking branch, fetch immediately 
# An alias may need to be set if using multiple SSH keys
git remote add -f rcc-upstream git@github.com:CloudCannon/rcc.git
git checkout -b upstream/rcc rcc-upstream/main

# Split off subdir of tracking branch into separate branch
git subtree split -q --squash --prefix=rosey-connector --annotate="[rcc] " --rejoin -b merging/rcc

# Add the split subdir on separate branch as a subdirectory on staging
git checkout staging
git subtree add --prefix=rosey-connector --squash merging/rcc
```

### Pulling from upstream

Pulling changes to the `rosey-connector` directory from https://github.com/CloudCannon/rcc.

```bash
# switch back to tracking branch, fetch & rebase.
git checkout upstream/rcc 
git pull rcc-upstream/main

# update the separate branch with changes from upstream
git subtree split -q --prefix=rosey-connector --annotate="[rcc] " --rejoin -b merging/rcc

# switch back to staging and use subtree merge to update the subdirectory
git checkout staging
git subtree merge -q --prefix=rosey-connector --squash merging/rcc
```