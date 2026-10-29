import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    // Capacitor copies index.html into native build directories. Watching those
    // copies reloads the live app in the middle of a save or browser test.
    watch: { ignored: ["**/android/**"] },
  },
});
