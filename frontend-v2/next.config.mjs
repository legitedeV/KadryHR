import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  reactCompiler: true,
  turbopack: {
    // Specifies the working directory to avoid multi-lockfile warnings
    root: __dirname,
  },
};

export default nextConfig;
