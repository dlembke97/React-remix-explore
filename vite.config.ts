import { defineConfig } from "vite";
import { reactRouter as react } from "@react-router/dev/vite"; // IMPORTANT: framework plugin
import tsconfigPaths from "vite-tsconfig-paths";
import tailwind from "@tailwindcss/vite"; // keep if we are using Tailwind

export default defineConfig({
  plugins: [react(), tsconfigPaths(), tailwind()],
  test: {
    environment: "jsdom"
  }
});
