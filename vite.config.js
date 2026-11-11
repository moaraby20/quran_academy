import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
var stdin_default = defineConfig(() => {
  return {
    base: "/quran/",

    plugins: [react(), tailwindcss()],

    resolve: {
      alias: {
        "@": path.resolve(__dirname, ".")
      }
    },

    server: {
      hmr: process.env.DISABLE_HMR !== "true",
      watch: process.env.DISABLE_HMR === "true" ? null : {}
    }
  };
});
export {
  stdin_default as default
};
