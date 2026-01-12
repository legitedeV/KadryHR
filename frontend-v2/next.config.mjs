import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  reactCompiler: true,
  typescript: {
    // Type checking runs in CI via npm run typecheck.
    ignoreBuildErrors: true,
  },
  eslint: {
    // Linting runs in CI via npm run lint.
    ignoreDuringBuilds: true,
  },
  turbopack: {
    // Specifies the working directory to avoid multi-lockfile warnings
    root: __dirname,
  },
  async redirects() {
    return [
      { source: "/pricing", destination: "/cennik", permanent: true },
      { source: "/contact", destination: "/kontakt", permanent: true },
      { source: "/privacy", destination: "/polityka-prywatnosci", permanent: true },
      { source: "/rodo", destination: "/polityka-prywatnosci", permanent: true },
      { source: "/terms", destination: "/regulamin", permanent: true },
    ];
  },
};

export default nextConfig;
