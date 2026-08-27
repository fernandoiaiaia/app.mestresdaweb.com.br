import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Painel administrativo: nada aqui pode ser indexado. Este cabecalho e
        // a protecao que de fato desindexa — robots.txt so impede rastreamento,
        // nao remove do indice, entao sozinho ele deixaria uma URL ja indexada
        // presa no resultado de busca, sem conteudo.
        source: "/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        ],
      },
    ];
  },
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
