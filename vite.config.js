import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages serves this project from /equilog/ (nataliavilnov.github.io/equilog), so the
// production build needs that as its base — both for asset URLs and for the router's basename
// (App.jsx reads import.meta.env.BASE_URL). Dev stays at "/" so localhost:5173 works as before.
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/equilog/" : "/",
  plugins: [react()],
  build: {
    // El paquete era un único archivo de 1,29 MB. Las rutas ya se cargan bajo
    // demanda (routes.jsx); aquí se separan además las dependencias grandes para
    // que React y Firebase queden en fragmentos propios, con su propia caché:
    // una corrección en el código de la aplicación deja de invalidarlos.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("/firebase/") || id.includes("@firebase")) return "firebase";
          if (id.includes("/react-dom/") || id.includes("/react/") || id.includes("/scheduler/")) return "react";
          if (id.includes("react-router")) return "router";
          return undefined;
        },
      },
    },
    chunkSizeWarningLimit: 700,
  },
}));
