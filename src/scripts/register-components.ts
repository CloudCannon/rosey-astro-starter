import { registerAstroComponent } from "@cloudcannon/editable-regions/astro";
import "@cloudcannon/editable-regions/astro-react-renderer";
import Hero from "../components/heroes/hero/hero.astro";
import LeftRight from "../components/left-right/left-right.astro";
import TextBlock from "../components/text-block/text-block.astro";
import PostHero from "../components/blog/post-hero/post-hero.astro";

registerAstroComponent("Hero", Hero);
registerAstroComponent("LeftRight", LeftRight);
registerAstroComponent("TextBlock", TextBlock);
registerAstroComponent("PostHero", PostHero);
