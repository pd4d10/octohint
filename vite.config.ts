import { crx } from "@crxjs/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig, Plugin } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import pkg from "./package.json";

// https://github.com/crxjs/chrome-extension-tools/issues/846#issuecomment-1861880919
const viteManifestHackIssue846: Plugin & { renderCrxManifest: (manifest: any, bundle: any) => void } = {
  // Workaround from https://github.com/crxjs/chrome-extension-tools/issues/846#issuecomment-1861880919.
  name: "manifestHackIssue846",
  renderCrxManifest(_manifest, bundle) {
    bundle["manifest.json"] = bundle[".vite/manifest.json"];
    bundle["manifest.json"].fileName = "manifest.json";
    delete bundle[".vite/manifest.json"];
  },
};

export default defineConfig((env) => ({
  resolve: {
    alias: {
      path: "path-browserify",
    },
  },
  esbuild: {
    drop: env.command === "build" ? ["console", "debugger"] : [],
  },
  plugins: [
    viteManifestHackIssue846,
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
      },
    }),
    viteStaticCopy({ targets: [{ src: "../LICENSE", dest: "." }] }),
  ],
}));
