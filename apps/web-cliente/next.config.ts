import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Area do cliente: nada aqui pode ser indexado. Este cabecalho e a
        // protecao que de fato desindexa — robots.txt so impede rastreamento,
        // nao remove do indice, entao sozinho ele deixaria uma URL ja indexada
        // presa no resultado de busca, sem conteudo.
        source: "/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        ],
      },
    ];
  },
  output: "standalone",
  reactCompiler: true,
  async redirects() {
    return [
      {
        source: "/",
        destination: "/login",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
