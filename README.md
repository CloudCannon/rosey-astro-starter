# Astro Rosey Starter

TODO: Links to
- Managing multilingual content in CloudCannon post
- RCC post
- RCC repo

## Requirements

- A CloudCannon organisation with access to [publishing workflows](https://cloudcannon.com)

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

## Local Development & Testing

To run dev server locally:

```bash
npm i
npm start
```

TODO: Test these commands
Run the RCC translation file generation locally (useful for debugging):

~~~bash
$ npm run rosey:generate
~~~

Run the Rosey build locally (useful for debugging):

~~~bash
$ npm run rosey:build
~~~

### Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |


## Dependencies

To use the provided markdown plugin, and markdown component for Astro, these extra dependencies need to be installed. Add the following to your `package.json` and run `npm install`.

```JSON
  "dependencies": {
    "markdown-it": "^13.0.1",
    "node-html-markdown": "^1.3.0",
    "rosey": "^2.3.3",
    "slugify": "^1.6.6",
    "yaml": "^2.4.2",
    "smartling-api-sdk-nodejs": "^2.11.0",
    "dotenv": "^16.4.5",
    "unist-util-visit": "^5.0.0",
    "hast-util-from-html-isomorphic": "^2.0.0",
  }
```

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

MDX allows you to use components throughout your markdown content, to allow for more complex things than traditional markdown syntax could represent. Bookshop handles the import of any Bookshop components into each file, to allow for any [snippets](https://cloudcannon.com/documentation/articles/snippets-using-mdx-components/) to be added to the page. CloudCannon configuration then defines which snippets an editor can see and their editing experience for editing, or adding them to the page.

A rehype plugin has been provided to automatically tag block level markdown elements for translation. A handler has been added so that our plugin's AST parser knows what to do with any JSX elements it comes across in our mdx content.

## Tagging your content

### Manually tagging your HTML

When tagging content for translation, the slugified contents of that translation should be used as the `data-rosey` id.

A helper function has been provided. Add this to the top of your component, or layout, adjusting the import address as needed.

  ```js
  import { generateRoseyId } from "../../../rosey-connector/helpers/component-helper.mjs";
  ```

Add it to your html templating like:

  ```jsx
  <h1
    class="heading"
    data-rosey={generateRoseyId(block.heading.heading_text)}>
    {block.heading.heading_text}
  </h1>
  ```

### Automatic tagging of markdown
The `./rosey-connector/ssgs/astroMarkdownTaggerPlugin.ts` plugin is used to extend Astro's parsing of markdown content into Html. As the name suggests, it tags block level content in your markdown. This means you don't need to manually tag any content that will be processed as part of your page's body content - it should happen as part of the build. 

### Markdown Component
Sometimes a component needs to contain markdown content. A `type: markdown` input in CloudCannon will allow an editor to add markdown as a component's content. 

Some SSGs come with a `markdownify` filter out of the box that processes content from markdown to html. In such an SSG we would simply add this filter to the templating our component. In Astro, we need to roll our own with one of the many markdown processing libraries out there. A component has been provided `rosey-connector/ssgs/astroMarkdownComponent.astro` to add wherever you need to parse markdown that isn't going to be automatically parsed by Astro. 

Drag it into your project's components folder, and update the import `import { generateRoseyMarkdownId } from "../helpers/component-helper";` to reflect it's new relative address. It can then be used throughout your components and layouts like:
  
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
  