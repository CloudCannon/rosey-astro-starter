# Astro Rosey Starter

This repository extends the [CloudCannon Astro Starter](https://cloudcannon.com/templates/astro-starter/), by coming fully set up to use the `rosey-cloudcannon-connector` npm package with [Rosey](https://rosey.app/), to manage multilingual content in CloudCannon.

- Read [this post](https://cloudcannon.com/blog/managing-multilingual-content-in-cloudcannon/) for context. This site uses a combination of using Rosey with the `rosey-cloudcannon-connector` package, and [pre-translating](https://rosey.app/docs/pretranslated-pages/) the text-heavy blog pages by content directory.
- Read the [getting started guide](https://rad-turnip.cloudvent.net/docs/#option-1-a-single-site) - This starter template is setup as a single site, rather than a staging to production workflow.
- See a [demo version of the site](https://deluxe-gel.cloudvent.net/)

## Getting Started

1. Click `Use this template` to create your own copy of the repository.
2. Change the placeholder values in the rosey/rcc.yaml to what you need, and your changes to the repo.
3. Create a site on CloudCannon from the repo.
4. Edit translations - via the WYSIWYG editor for the blog post translations, and the translations data collection for the rest of the site.
5. Save and rebuild, and see translations on the live site.
6. Start adding/changing components and layouts to suit your needs, tagging elements for translation along the way.

## Local Development

To run dev server locally:

```bash
npm i
npm start
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
