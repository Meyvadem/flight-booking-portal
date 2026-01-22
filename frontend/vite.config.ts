import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false,
      },
    },
  },

  // npm run preview için gerekli ayarlar
  preview: {
    host: true,          // dışarıdan erişim (0.0.0.0)
    port: 3000,
    allowedHosts: true,  // ec2-...amazonaws.com hostunu engellemesin
  },
});
