import { defineConfig } from "vite";
import catalog from "./tools/asset-catalog.cjs";
import pages from "./tools/pages-assets.cjs";
import presentation from "./tools/presentation-assets.cjs";
import { fileURLToPath } from "node:url";

export default defineConfig(({ mode }) => ({
  define: {
    __TECHNOPROF_DAY__: JSON.stringify(mode === "day" || mode === "pages"),
    __TECHNOPROF_PUBLIC__: JSON.stringify(mode === "pages"),
  },
  plugins: [
    presentation.createPresentationPlugin(
      fileURLToPath(new URL(".", import.meta.url)),
      mode,
    ),
    ...(mode === "day" || mode === "pages"
      ? [
          {
            name: "technoprof-day-assets",
            enforce: "pre",
            transformIndexHtml(html) {
              return catalog.dayDocument(html);
            },
            transform(source, id) {
              const code = catalog.selectDayAssets(id, source);
              return code === null ? null : { code, map: null };
            },
          },
        ]
      : []),
    ...(mode === "pages"
      ? [pages.createPagesPlugin(fileURLToPath(new URL(".", import.meta.url)))]
      : []),
  ],
}));
