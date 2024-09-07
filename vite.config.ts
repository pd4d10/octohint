import { crx } from "@crxjs/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import pkg from "./package.json";

export default defineConfig({
  plugins: [
    react(),
    crx({
      manifest: {
        manifest_version: 3,
        name: "Octohint",
        version: pkg.version,
        description: "IntelliSense hint for GitHub",
        homepage_url: "https://github.com/pd4d10/octohint",
        icons: {
          "128": "icons/logo.png",
        },
        background: {
          service_worker: "src/background.ts",
        },
        host_permissions: ["https://*/"],
        content_scripts: [
          {
            matches: [
              "https://github.com/*",
              "https://gist.github.com/*",
              "https://gitlab.com/*",
              "https://bitbucket.org/*",
            ],
            js: ["src/content-script.tsx"],
          },
        ],
        options_ui: {
          page: "options.html",
        },
      },
    }),
    viteStaticCopy({ targets: [{ src: "../LICENSE", dest: "." }] }),
  ],
});
