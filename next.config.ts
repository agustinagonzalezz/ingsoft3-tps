import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Evita que 'next dev' regenere AGENTS.md/CLAUDE.md en la raiz del repo.
  agentRules: false,
  output: "standalone",
};

export default nextConfig;
