import fs from "node:fs";
import { satteri, satteriHeadingIdsPlugin } from "@astrojs/markdown-satteri";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwind from "@tailwindcss/vite";
import { defineConfig, envField } from "astro/config";
import expressiveCode from "astro-expressive-code";
import icon from "astro-icon";
import robotsTxt from "astro-robots-txt";
import { satteriAdmonitionsPlugin } from "./src/plugins/admonitions";
import { satteriGithubCardPlugin } from "./src/plugins/github-cards";
import {
	satteriAutolinkHeadingsPlugin,
	satteriExternalLinksPlugin,
	satteriFootnoteLabelPlugin,
	satteriReadingTimePlugin,
	satteriUnwrapImagesPlugin,
} from "./src/plugins/satteri";
import { expressiveCodeOptions, siteConfig } from "./src/site.config";

// https://astro.build/config
export default defineConfig({
	site: siteConfig.url,
	image: {
		domains: ["webmention.io"],
	},
	integrations: [
		expressiveCode(expressiveCodeOptions),
		icon(),
		sitemap(),
		mdx(),
		robotsTxt(),
	],
	markdown: {
		processor: satteri({
			features: { directive: true },
			mdastPlugins: [
				satteriUnwrapImagesPlugin(),
				satteriReadingTimePlugin(),
				satteriGithubCardPlugin(),
				satteriAdmonitionsPlugin(),
			],
			hastPlugins: [
				satteriHeadingIdsPlugin(),
				satteriAutolinkHeadingsPlugin(),
				satteriFootnoteLabelPlugin(),
				satteriExternalLinksPlugin(),
			],
		}),
	},
	vite: {
		plugins: [tailwind(), rawFonts([".ttf", ".woff"])],
	},
	env: {
		schema: {
			WEBMENTION_API_KEY: envField.string({ context: "server", access: "secret", optional: true }),
			WEBMENTION_URL: envField.string({ context: "client", access: "public", optional: true }),
			WEBMENTION_PINGBACK: envField.string({ context: "client", access: "public", optional: true }),
		},
	},
});

function rawFonts(ext: string[]) {
	return {
		name: "vite-plugin-raw-fonts",
		// @ts-expect-error:next-line
		transform(_, id) {
			if (ext.some((e) => id.endsWith(e))) {
				const buffer = fs.readFileSync(id);
				return {
					code: `export default ${JSON.stringify(buffer)}`,
					map: null,
					moduleType: "js",
				};
			}
		},
	};
}
