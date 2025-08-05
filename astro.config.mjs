import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import bookshop from "@bookshop/astro-bookshop";
import tailwind from "@astrojs/tailwind";
import mdx from "@astrojs/mdx";

// https://astro.build/config
export default defineConfig({
  site: "https://deluxe-gel.cloudvent.net/",
  integrations: [react(), tailwind(), bookshop(), mdx()],
});
