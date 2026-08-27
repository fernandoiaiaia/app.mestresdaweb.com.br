import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Ferramenta interna: nada aqui pode ser indexado. Este cabecalho e a
        // protecao que de fato desindexa — robots.txt so impede rastreamento,
        // nao remove do indice. Cobre inclusive /p/[id], que sao propostas
        // comerciais enviadas por link ao cliente (nome, escopo e valores):
        // uma dessas indexada e vazamento de dado de cliente.
        source: "/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        ],
      },
    ];
  },
  output: "standalone",
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777"}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
