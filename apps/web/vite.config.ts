import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

const PUBLIC = new URL("./public", import.meta.url).pathname;

function publicFiles(dir = PUBLIC): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (name.startsWith(".")) return [];
    return statSync(path).isDirectory() ? publicFiles(path) : [relative(PUBLIC, path)];
  });
}

/**
 * Emits sw.js (see sw.js) with this build's version and every file to precache: index.html, the
 * scripts and styles (the question bank is inside the script) and everything in public/
 * (pictures, icons, manifest). Font subsets are cached as pages use them; offline the system Korean font stands in.
 */
function serviceWorker(): Plugin {
  return {
    name: "koroad-service-worker",
    apply: "build",
    enforce: "post",
    generateBundle(_, bundle) {
      const built = Object.keys(bundle).filter((file) => file === "index.html" || /\.(js|css)$/.test(file));
      const pub = publicFiles();
      const precache = [...built.sort(), ...pub.sort()];
      const hash = createHash("sha256").update(precache.join("\n"));
      const index = bundle["index.html"];
      if (index?.type === "asset") hash.update(index.source);
      for (const file of pub) hash.update(readFileSync(join(PUBLIC, file)));
      const source = readFileSync(new URL("./sw.js", import.meta.url), "utf8");
      const version = hash.update(source).digest("hex").slice(0, 12);
      this.emitFile({
        type: "asset",
        fileName: "sw.js",
        source: source.replace("const BUILD = __BUILD__;", `const BUILD = ${JSON.stringify({ version, precache })};`),
      });
    },
  };
}

export default defineConfig({
  // Relative paths: the app is served from a subpath on GitHub Pages (/koroad-learn/).
  base: "./",
  plugins: [react(), serviceWorker()],
  build: { assetsInlineLimit: 0 },
});
