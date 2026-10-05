import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// En desarrollo (npm run dev) Vite reenvía /api al backend local.
// En el contenedor ese papel lo cumple nginx (ver nginx.conf).
// En ambos casos el front llama a /api con ruta RELATIVA: no conoce
// el host del backend, así que la misma imagen sirve en cualquier entorno.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:8080",
    },
  },
});
