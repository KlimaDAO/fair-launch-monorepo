import { defineConfig } from "@pandacss/dev";

export default defineConfig({
  preflight: true,
  exclude: [],
  include: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: { extend: {} },
  outdir: "styled-system",
});
