import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // React core
          if (id.includes("node_modules/react-dom") || 
              id.includes("node_modules/react/") ||
              id.includes("node_modules/react-router")) {
            return "vendor-react";
          }
          // PDF processing - large, load separately
          if (id.includes("node_modules/pdfjs-dist")) {
            return "vendor-pdf";
          }
          // Document processing
          if (id.includes("node_modules/mammoth")) {
            return "vendor-docx";
          }
          // Icons
          if (id.includes("node_modules/lucide-react")) {
            return "vendor-icons";
          }
          // UI components (Radix + animations)
          if (id.includes("node_modules/@radix-ui") || 
              id.includes("node_modules/framer-motion") ||
              id.includes("node_modules/cmdk") ||
              id.includes("node_modules/vaul")) {
            return "vendor-ui";
          }
          // Charts
          if (id.includes("node_modules/recharts") || 
              id.includes("node_modules/d3-")) {
            return "vendor-charts";
          }
          // External services
          if (id.includes("node_modules/@clerk") || 
              id.includes("node_modules/convex") ||
              id.includes("node_modules/openai")) {
            return "vendor-services";
          }
          // Grammar checker (WASM)
          if (id.includes("node_modules/harper.js") ||
              id.includes("node_modules/harper-wasm")) {
            return "vendor-grammar";
          }
          // Utilities
          if (id.includes("node_modules/date-fns") ||
              id.includes("node_modules/zod") ||
              id.includes("node_modules/react-hook-form") ||
              id.includes("node_modules/@hookform")) {
            return "vendor-utils";
          }
        },
      },
    },
  },
}));
