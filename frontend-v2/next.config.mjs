import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  reactCompiler: true,
  turbopack: {
    // wskazujemy właściwy katalog roboczy, aby uniknąć ostrzeżeń o wielu lockfile
    root: __dirname,
  },
};

export default nextConfig;
