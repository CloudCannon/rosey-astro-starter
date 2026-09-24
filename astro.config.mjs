import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import editableRegions from "@cloudcannon/editable-regions/astro-integration";
import mdx from "@astrojs/mdx";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://tiny-jackal.cloudvent.net/",
  // Astro 7 defaults to JSX whitespace rules, which drop the line breaks that
  // separate text from inline elements ("edited with<strong>..."). Editors write
  // plain HTML in source editables, so keep the lossless collapsing instead.
  compressHTML: true,
  integrations: [react(), editableRegions(), mdx()],
  vite: {
    plugins: [tailwindcss()],
  },
});
